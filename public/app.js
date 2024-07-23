paypal
  .Buttons({
    // Sets up the transaction when a payment button is clicked
    createOrder: function () {
      return fetch(`/api/orders/${document.getElementById("transactionTotal").innerHTML}`, {
        method: "post",
        body: JSON.stringify({
          transactionTotal: document.getElementById("transactionTotal").innerHTML,
          cart: [
            {
              sku: document.getElementById("sku").innerHTML,
              quantity: document.getElementById("quantity").innerHTML,
            },
          ],
        }),
        
      })
        .then((response) => response.json())
        .then((order) => order.id);
    },
    // Finalize the transaction after payer approval
    onApprove: function (data) {
      return fetch(`/api/orders/${data.orderID}/capture`, {
        method: "post",
      })
        .then((response) => response.json())
        .then((orderData) => {
          // Success
          /*
          console.log(
            "Capture result",
            orderData,
            JSON.stringify(orderData, null, 2)
          );
          */
          const transaction = orderData.purchase_units[0].payments.captures[0];
          window.location.href = "thankyou/?transactionID="+transaction.id+"&currency="+transaction.amount.currency_code+"&amount="+transaction.amount.value;
        });
    },
  })
  .render("#paypal-button-container");

// If payment with card
if (paypal.HostedFields.isEligible()) {
  let orderId;

  // Renders card fields
  paypal.HostedFields.render({
    // Call server to set up the transaction
    createOrder: () => {
      return fetch(`/api/orders/${document.getElementById("transactionTotal").innerHTML}`, {
        method: "post",
        body: JSON.stringify({
          cart: [
            {
              sku: document.getElementById("sku").innerHTML,
              quantity: document.getElementById("quantity").innerHTML,
            },
          ],
        }),
      })
        .then((res) => res.json())
        .then((orderData) => {
          orderId = orderData.id;
          return orderData.id;
        });
    },
    styles: {
      ".valid": {
        color: "green",
      },
      ".invalid": {
        color: "red",
      },
    },
    fields: {
      number: {
        selector: "#card-number",
        placeholder: "4111 1111 1111 1111",
      },
      cvv: {
        selector: "#cvv",
        placeholder: "123",
      },
      expirationDate: {
        selector: "#expiration-date",
        placeholder: "MM/YY",
      },
    },
  }).then((cardFields) => {
    document.querySelector("#card-form").addEventListener("submit", (event) => {
      event.preventDefault();
      if (document.getElementById("card-billing-address-country").value == "United States"){
        document.getElementById("card-billing-address-country").value = "US";
      }
      if (document.getElementById("card-billing-address-country").value != "US"){
        return alert ("Billing address out the US not supported");
      }
      cardFields
        .submit({
          // Cardholder's first and last name
          cardholderName: document.getElementById("card-holder-name").value,
          // Billing Address
          billingAddress: {
            // Street address, line 1
            streetAddress: document.getElementById(
              "card-billing-address-street"
            ).value,
            // State
            region: document.getElementById("card-billing-address-state").value,
            // City
            locality: document.getElementById("card-billing-address-city")
              .value,
            // Postal Code
            postalCode: document.getElementById("card-billing-address-zip")
              .value,
            // Country Code
            countryCodeAlpha2: document.getElementById(
              "card-billing-address-country"
            ).value,
          },
        })
        .then(() => {
          fetch(`/api/orders/${orderId}/capture`, {
            method: "post",
          })
            .then((res) => res.json())
            .then((orderData) => {
              const errorDetail =
                Array.isArray(orderData.details) && orderData.details[0];
              if (errorDetail) {
                var msg = "Sorry, your transaction could not be processed.";
                if (errorDetail.description)
                  msg += "\n\n" + errorDetail.description;
                if (orderData.debug_id) msg += " (" + orderData.debug_id + ")";
                return alert(msg); // Show a failure message
              }
              JSON.stringify(orderData, null, 2)
              // Show a success message or redirect
              //alert("Transaction completed!");
              const transaction = orderData.purchase_units[0].payments.captures[0];
              console.log(JSON.stringify(orderData));
              window.location.href = "thankyou/?transactionID="+transaction.id+"&currency="+transaction.amount.currency_code+"&amount="+transaction.amount.value;
            });
        })
        .catch((err) => {
          alert("Payment could not be captured! " + JSON.stringify(err));
        });
    });
  });
} else {
  // Hides card fields if the merchant isn't eligible
  document.querySelector("#card-form").style = "display: none";
}
