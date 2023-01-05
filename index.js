const express = require('express');
const app = express();
var PORT = 3000;

// CONFIG ENV
// Replace if using a different env file or config
require('dotenv').config();
const env = require('dotenv').config({ path: './.env' });

//APP USE
//app.use(express.static(process.env.STATIC_DIR));
app.use(express.static('client'));

// ROUTE
const stripeApp = require("./server/server.js");
const stripeAppRoute = stripeApp.router;
app.use("/", stripeApp);

app.listen(PORT, function(err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
