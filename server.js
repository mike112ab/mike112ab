import "dotenv/config";
import express from "express";
import * as paypal from "./paypal-api.js";
const {PORT = 8888} = process.env;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static("views"));
// render checkout page with client id & unique client token
app.get("/", async (req, res) => {
  const clientId = process.env.CLIENT_ID;
  try {
    const clientToken = await paypal.generateClientToken();
    res.render("checkout", { clientId, clientToken });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// create order
app.post("/api/orders/:transactionTotal", async (req, res) => {
  const {transactionTotal} = req.params;
  try {
    
    const order = await paypal.createOrder(transactionTotal);
    res.json(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// capture payment
app.post("/api/orders/:orderID/capture", async (req, res) => {
  const { orderID } = req.params;
  //console.log(req);
  try {
    const captureData = await paypal.capturePayment(orderID);
    res.status(200);
    res.json(captureData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/thankyou', function(req, res) {
 res.sendFile('thankyou.html', { root: '.' })
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}/`);
});