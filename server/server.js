// UPDATE 05/01/23
"use strict";
const express = require("express");
const router = express.Router();
// CONFIG INITIAL
//update 15/12/2022
const bodyParser = require("body-parser");
const { TiledeskClient } = require('@tiledesk/tiledesk-client');
var assert = require('assert');
// Update 16/12/22 CHANGE ENV
require('dotenv').config();
//const express = require('express');
const fs = require('fs');
const handlebars = require('handlebars');
const pjson = require('./package.json');
// import node-fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) =>
  fetch(...args));
//const app = express();
router.use(bodyParser.urlencoded({ extended: false }));
const { resolve } = require('path');
// CONFIG ENV
// Replace if using a different env file or config
const env = require('dotenv').config({ path: './.env' });


// CONFIG STRIPE SECRET_KEY
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
  appInfo: { // For sample support and debugging, not required for production:
    name: "stripe-samples/accept-a-payment/payment-element",
    version: "0.0.2",
    url: "https://github.com/stripe-samples"
  }
});

// DB MONGO
//const { KVBaseMongo } = require('@tiledesk/tiledesk-kvbasemongo');
//const kvbase_collection = 'kvstore';
//const db = new KVBaseMongo(kvbase_collection);
//DB KVBASE
const { KVBase } = require('./KVBase');
let db = new KVBase();
let orderId;
let id;
const max = 100000;
//app.use(express.static(process.env.STATIC_DIR));
// UPDATE 05/01/23
//router.use(express.static(process.env.STATIC_DIR));

router.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function(req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);
// CONFIG ENV VARIABLE

var DOMAIN = process.env.DOMAIN;
var PAYMENT_METHOD_TYPES = process.env.PAYMENT_METHOD_TYPES;
//var STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
//var STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
//var STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET1;
console.log('DOMAIN', DOMAIN)
console.log('PAYMENT_METHOD_TYPES', PAYMENT_METHOD_TYPES)
//console.log('STRIPE_PUBLISHABLE_KEY', STRIPE_PUBLISHABLE_KEY)
//console.log('STRIPE_SECRET_KEY', STRIPE_SECRET_KEY)
//console.log('STRIPE_WEBHOOK_SECRET', STRIPE_WEBHOOK_SECRET)

var path;

// READ THE INFO
router.get('/info', async (req, res) => {
  console.log('READ APP Stripe Info');
  console.log('Request query: ', req.query);
  var projectId = req.query.projectId;
  var log = false;
  var page = '/index.html';
  var dir = '/info';
  readHTMLFile(page, dir, (err, html) => {
    if (err) {
      console.log("(ERROR) Read html file: ", err);
    }
    var template = handlebars.compile(html);
    var replacements = {
    }
    if (log) {
      console.log("Replacements: ", replacements);
    }
    var html = template(replacements);
    res.send(html);
  })
})
// INIZIALIZE A PAYMENT
router.get('/payment', async (req, res) => {
  var page = '';
  var dir = '';
  //READ THE CONFIGURATION FILE
  console.log('req project_id ', req.query.project_id);
  var projectId = req.query.project_id;
  var sett = await db.get(projectId);
  console.log('Read settings APP', sett);
  var stripe_publishable_key;
  var stripe_wehook_segret;
  if (sett.stripe_publishable_key != '') {
    // SETTINGS IS OK!
    console.log('SETTINGS IS OK!');
    stripe_publishable_key = sett.stripe_publishable_key;
    stripe_wehook_segret = sett.stripe_wehook_segret;
    var log = false;
    page = '/index.html';
    dir = '/payment';
    readHTMLFile(page, dir, (err, html) => {
      if (err) {
        console.log("(ERROR) Read html file: ", err);
      }
      var template = handlebars.compile(html);
      var replacements = {
      }
      if (log) {
        console.log("Replacements: ", replacements);
      }
      var html = template(replacements);
      res.send(html);
    })
  } else {
    console.log('SETTINGS IS KO!');
    console.log('Request query: ', req.query);
    var log = false;
    var page = '/index.html';
    var dir = '/configure';
    readHTMLFile(page, dir, (err, html) => {
      if (err) {
        console.log("(ERROR) Read html file: ", err);
      }
      var template = handlebars.compile(html);
      var replacements = {
        //pay_method_types: pay_method_types,
        stripe_publishable_key: stripe_publishable_key,
        //stripe_secret_key: stripe_secret_key,
        stripe_wehook_segret: stripe_wehook_segret,
      }
      if (log) {
        console.log("Replacements: ", replacements);
      }
      var html = template(replacements);
      res.send(html);
    })
  }
});

// GET INDEX AGENT --  DISABLE
router.get('/', async (req, res) => {
  path = resolve(process.env.STATIC_DIR + '/index.html');
  res.sendFile(path);
});

// READ THE CONFIGURATION THE APP
router.get('/getconfigure', async (req, res) => {
  console.log('READ APP Stripe Configure');
  console.log('Request query: ', req.query);
  var projectId = req.query.projectId;
  var sett = await db.get(projectId);
  console.log('APP Config project_id ', projectId);
  var sett = await db.get(projectId);
  console.log('APP Config sett ', sett);
  var stripe_publishable_key = sett.stripe_publishable_key;
  var stripe_wehook_segret = sett.stripe_wehook_segret;
  var log = false;
  var page = '/index.html';
  var dir = '/configure';
  readHTMLFile(page, dir, (err, html) => {
    if (err) {
      console.log("(ERROR) Read html file: ", err);
    }
    var template = handlebars.compile(html);
    var replacements = {
      //pay_method_types: pay_method_types,
      stripe_publishable_key: sett.stripe_publishable_key,
      //stripe_secret_key: stripe_secret_key,
      stripe_wehook_segret: sett.stripe_wehook_segret
    }
    if (log) {
      console.log("Replacements: ", replacements);
    }
    var html = template(replacements);
    res.send(html);
  })
})

// SET CONFIGURATION THE APP
router.post('/configure', async (req, res) => {
  console.log('Write APP Stripe Configure');
  console.log('Request query: ', req.body);
  var projectId = req.body.projectId;
  var stripe_publishable_key = req.body.stripe_publishable_key;
  var stripe_wehook_segret = req.body.stripe_wehook_segret;
  console.log('APP Config project_id ', projectId);
  console.log('APP Config stripe_publishable_key ', stripe_publishable_key);
  console.log('APP Config stripe_wehook_segret', stripe_wehook_segret);
  var log = true;
  // SETTINGS THE APP FIRST TIME!
  var settings = { stripe_publishable_key: stripe_publishable_key, stripe_wehook_segret: stripe_wehook_segret };
  await db.set(projectId, settings);
  console.log('Sett settings APP!', settings);
  var page = '/index.html';
  var dir = '/payment';
  res.send({ success: true })
})

// CONFIGURE STRIPE
//RETURN THE CONFIG KEY IN MULTITENANT
router.get('/config', async (req, res) => {
  // ATTENTO PROVA
  const projectId = req.query.projectId;
  console.log('GET KEY SEGRET: ', projectId);
  var sett = await db.get(projectId);
  console.log('Read settings APP', sett);
  res.send({
    //publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    publishableKey: sett.stripe_publishable_key,
  });
});
// SEND A PAYMENT ON CHAT
router.get('/create-payment-intent', async (req, res) => {
  // Create a PaymentIntent with the amount, currency, and a payment method type.
  // See the documentation [0] for the full list of supported parameters.
  // [0] https://stripe.com/docs/api/payment_intents/create
  const currency = req.query.currency;
  const amount = req.query.amount;
  const description = req.query.description;
  const orderId = req.query.orderId;
  const customer_mail = req.query.customer_mail;
  const customer_name = req.query.customer_name;

  console.log('POST request: currency is:', currency);
  console.log('POST request: amount is:', amount);
  console.log('POST request: description is:', description);
  console.log('POST request: orderId is:', orderId);
  console.log('POST request: customer_mail is', customer_mail);
  console.log('POST request: customer_name is', customer_name);

  // ATTENTION NOT FOR MULTITENANT WITH THE SAME CUSTOMER MAIL
  //const customer = await stripe.customers.retrieve(
  //'cus_MnPemk1KAXX845'
  //);

  // IF a NEW MAIL THEN CREATE A NEW CUSTOMER
  // create the user if it doesn't exist
  let customerId;
  let customer = await db.get(customer_mail);
  console.log('customer', customer);
  if (customer === undefined || customer === null) {
    try {
      customerId = await stripe.customers.create({
        name: customer_name,
        email: customer_mail,
      });
      console.log('New customerId create: ', customerId);
      await db.set(customer_mail, customerId);
    } catch (error) {
      console.error('stripe', error);
    }
  } else {
    console.log('Old customerId', customer.id);
    customerId = customer.id;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: currency,
      amount: amount,
      customer: customerId,
      description: description,
      payment_method_types: ['card'],
      receipt_email: customer_mail,
      metadata: { order_id: orderId },
      //automatic_payment_methods: { enabled: true },
      shipping: {
        address: {
          city: '',
          line1: '',
          line2: '',
          postal_code: '',
          state: ''
        },
        name: customer_name
      }
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});


// CREATE PAYMENT E PAY SUCCCESS WEBHOOK
// Expose a endpoint as a webhook handler for asynchronous events.
// Configure your webhook in the stripe developer dashboard
// https://dashboard.stripe.com/test/webhooks
router.post('/webhook', async (req, res) => {
  let data, eventType;

  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('STRIPE_WEBHOOK_SECRET: ', process.env.STRIPE_WEBHOOK_SECRET)
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err);
      return res.sendStatus(400);
    }
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  if (eventType === 'payment_intent.succeeded') {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log('💰 Payment captured!');
    // set url as constant
    const url = 'https://accept-a-payment-App-into-Chat.leomirco.repl.co/payment/succeeded';
    const customHeaders = {
      "Content-Type": "application/json",
    }
    console.log('Payment captured Data OrderID: ', data.object.metadata.order_id);
    console.log('Payment captured Data CustomerID: ', data.object.customer);
    let orderid = data.object.metadata.order_id;
    let customerid = data.object.customer;
    const bodydata = {
      orderid: orderid,
      customerid: customerid
    };
    try {
      const apiResponse = await fetch(url, {
        method: "POST",
        headers: customHeaders,
        body: JSON.stringify(bodydata),
      })
      //const body = await res.text();
      //console.log(body);
      console.log('Payment captured respose:', apiResponse)
    } catch (error) {
      console.error(error);
    }
  } else if (eventType === 'payment_intent.payment_failed') {
    console.log('❌ Payment failed.');
  } else if (eventType === 'payment_intent.created') {
    console.log('🆕 Payment created.');
    // Then define and call a function to handle the event payment_intent.createdß
    console.log('Payment created OrderID: ', data.object.metadata.order_id);
    // DEVI RISPONDERE AL MSG CHIAMA IL GET e PASSA l'ORDER ID
  }
  res.sendStatus(200);
});

// UPDATE 15/12/2022 AGENT
// CREATE A PAYMENT INTENT
router.post('/payment/created', async (req, res) => {
  console.log("req.body post", req.body)
  let messageid = "";
  const token = req.body.token
  let amount = req.body.amount
  let currency = req.body.currencyList
  //let messageid = req.body.messageid;
  const projectId = req.body.projectId;
  const request_id = req.body.request_id;
  const description = req.body.description;
  const customer_mail = req.body.customer_mail;
  const customer_name = req.body.customer_name;
  //generate random orderId
  //id = id +1;
  //const orderId = projectId + id.toString;
  //console.log('order ID', orderId);
  let orderId = projectId + Math.floor(Math.random() * max).toString();

  //CONTROL IF THE ORDERID exists FOR THE MULTITENANT USE
  let orderIdOld = await db.get(orderId)
  if (orderIdOld != null || orderIdOld != undefined) {
    let orderId = Math.floor(Math.random() * max)
  }

  console.log('post-amount: ', amount)
  console.log('post-currencyList: ', currency)
  console.log('post-description: ', description)
  console.log('post-projectId: ', projectId)
  console.log('token: ', token)
  console.log('orderId: ', orderId)
  console.log('customer_mail: ', customer_mail)
  console.log('customer_name: ', customer_name)

  // ATTENTION ONLY FOR DEBUG LOG 
  var msg = 'https://accept-a-payment-App-into-Chat.leomirco.repl.co/?&currency=' + currency + '&amount=' + amount + '&description=' + description + '&orderId=' + orderId + '&token=' + token + '&customer_mail=' + customer_mail + '&customer_name=' + customer_name + '&projectId=' + projectId;
  console.log('post-Call Stripe: ' + msg)

  // create a TiledeskClient instance
  const tdclient = new TiledeskClient(
    {
      APIKEY: '*',
      projectId: projectId,
      token: token
    })
  var message = {
    type: "frame",
    text: "Payment of " + currency + " " + amount + " !",
    metadata: {
      src: 'https://accept-a-payment-App-into-Chat.leomirco.repl.co/?currency=' + currency + '&amount=' + (amount * 100) + '&description=' + description + '&orderId=' + orderId + '&customer_mail=' + customer_mail + '&customer_name=' + customer_name + '&projectId=' + projectId,
      width: '100%',
      height: '330px'
    }
  }
  console.log('post request_id: ', request_id)
  tdclient.sendSupportMessage(
    request_id,
    message, async (err, result) => {
      if (err) {
        return res.status(500).send({ error: err });
      }
      console.log('post-result._id', result._id);
      messageid = result._id;
      // Read the old orderId
      //save your app's status in the key-value store as "completed"
      var payment = { orderId: orderId, projectId: projectId, request_id: request_id, currency: currency, amount: amount, description: description, messageid: messageid, token: token, customer_mail: customer_mail, customer_name: customer_name, paid: false };
      //orderId is used with key primary into the DB
      // -- ATTENTO NON VA BENE PER IL MULTITENANT --
      await db.set(orderId, payment);
      console.log('post-orderId', orderId);
      const resu = await db.get(orderId)
      console.log('post-result', resu);
    });

  res.send('Payment created!');
  //const path = resolve(process.env.STATIC_DIR + '/created.html');
  //res.sendFile(path);
});

//SEND SUCCEEDED MSG ON CHAT
router.post('/payment/succeeded', async (req, res) => {
  const orderid = req.body.orderid
  const customerid = req.body.customerid
  console.log("return orderId: ", orderid);
  console.log("return customerId: ", customerid);
  // Read the payment data
  var resu = 0;
  if (orderid != null && orderid != undefined) {
    resu = await db.get(orderid);
    console.log('post-result', resu);
  }
  // CLOSE THE PAYMENT ON  DB
  if (resu != null && resu != undefined) {
    var payment = { orderId: resu.orderid, projectId: resu.projectId, request_id: resu.request_id, currency: resu.currency, amount: resu.amount, description: resu.description, messageid: resu.messageid, token: resu.token, customer_mail: resu.customer_mail, customer_name: resu.customer_name, paid: true };
    await db.set(orderid, payment);
  }
  console.log('End-Payment', payment);

  // SEND THE MSG PAY CORRECT ON THE CHAT
  let messageid = "";
  const tdclient = new TiledeskClient(
    {
      APIKEY: '*',
      projectId: resu.projectId,
      token: resu.token
    })
  if (resu != null && resu != undefined) {
    tdclient.sendSupportMessage(
      resu.request_id,
      { text: 'Payment of ' + resu.amount + ' ' + resu.currency + ' successful! Thank you.' },
      (err, result) => {
        assert(err === null);
        assert(result != null);
      });
    res.send('Payment successful!')
  } else {
    res.send('Payment wrong!')
  }
});
//END UPDATE

/*
app.listen(4242, () =>
  console.log(`Server Node Started`)
);
*/
// UPDATE 05/01/23
module.exports = router;

// *****************************
// ********* FUNCTIONS *********
// *****************************
function readHTMLFile(templateName, dir, callback) {
  var perc = __dirname + dir + templateName;
  console.log("Reading file: ", perc)
  console.log("Reading __dirname: ", __dirname)
  //fs.readFile(__dirname + '/configure' + templateName, { encoding: 'utf-8' },
  fs.readFile(__dirname + dir + templateName, { encoding: 'utf-8' },
    function(err, html) {
      if (err) {
        throw err;
        //callback(err);
      } else {
        callback(null, html)
      }
    })
}

