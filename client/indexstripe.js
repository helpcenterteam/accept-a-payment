document.addEventListener('DOMContentLoaded', async () => {
  // Get URL string
  var url_string = window.location.href;
  var url = new URL(url_string);
  console.log('url', url);
  // CONFIG KEY SEGRET
  // Load the publishable key from the server. The publishable key
  // is set in your .env file.
  var projectId = url.searchParams.get("projectId");
  console.log('USER KEY - projectId', projectId);
  const { publishableKey } = await fetch('/config?projectId=' + projectId).then((r) => r.json());
  if (!publishableKey) {
    addMessage(
      'No publishable key returned from the server. Please configure the App and try again'
    );
    alert('Please set your Stripe publishable API key in the configure function');
  } else {
    console.log('USER KEY - publishableKey', publishableKey);
  }

  const stripe = Stripe(publishableKey, {
    apiVersion: '2020-08-27',
  });

  console.log('stripe: ', stripe)
  //-------------------------------------------
  var currency = url.searchParams.get("currency");
  console.log('currency', currency);
  var amount = url.searchParams.get("amount");
  console.log('amount', amount);
  var description = url.searchParams.get("description");
  console.log('description', description);
  var orderId = url.searchParams.get("orderId");
  console.log('orderId', orderId);
  // CUSTOMER
  var customer_mail = url.searchParams.get("customer_mail");
  console.log('customer_mail', customer_mail);
  var customer_name = url.searchParams.get("customer_name");
  console.log('customer_name', customer_name);

  // On page load, we create a PaymentIntent on the server so that we have its clientSecret to
  // initialize the instance of Elements below. The PaymentIntent settings configure which payment
  // method types to display in the PaymentElement.
  //ATTENTO URL DA MODIFICARE CON PRODUZIONE
  console.log('DOMAIN - url', url.origin);
  let url_post = new URL(url.origin + '/create-payment-intent');
  let params = { 'currency': currency, 'amount': amount, 'description': description, 'orderId': orderId, 'customer_mail': customer_mail, 'customer_name': customer_name };
  url_post.search = new URLSearchParams(params);
  //---------------------------------------------------------------------------

  const {
    error: backendError,
    clientSecret
  } = await fetch(url_post).then(r => r.json());
  if (backendError) {
    addMessage(backendError.message);
  }
  addMessage(`Client secret returned.`);
  console.log('clientSecret', clientSecret);

  // Initialize Stripe Elements with the PaymentIntent's clientSecret,
  // then mount the payment element.
  const elements = stripe.elements({ clientSecret });
  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');


  // When the form is submitted...
  const form = document.getElementById('payment-form');
  let submitted = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable double submission of the form
    if (submitted) { return; }
    submitted = true;
    form.querySelector('button').disabled = true;

    const nameInput = document.querySelector('#name');

    // Confirm the card payment given the clientSecret
    // from the payment intent that was just created on
    // the server.
    // ATTENTO COMMENTATA
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/return.html`,
      }
    });

    if (stripeError) {
      addMessage(stripeError.message);

      // reenable the form.
      submitted = false;
      form.querySelector('button').disabled = false;
      return;
    }
  });
});
