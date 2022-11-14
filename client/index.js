document.addEventListener('DOMContentLoaded', async () => {
  // Load the publishable key from the server. The publishable key
  // is set in your .env file.
  const {publishableKey} = await fetch('/config').then((r) => r.json());
  if (!publishableKey) {
    addMessage(
      'No publishable key returned from the server. Please check `.env` and try again'
    );
    alert('Please set your Stripe publishable API key in the .env file');
  }

  const stripe = Stripe(publishableKey, {
    apiVersion: '2020-08-27',
  });

  // Get URL string
  var url_string = window.location.href; 
  var url = new URL(url_string);
  console.log('url',url);
  var customerId = url.searchParams.get("customerid");
  console.log('customerid',customerId);
  var currency = url.searchParams.get("currency");
  console.log('currency',currency);
  var amount = url.searchParams.get("amount");
  console.log('amount',amount);
  var description = url.searchParams.get("description");
  console.log('description',description);

  // On page load, we create a PaymentIntent on the server so that we have its clientSecret to
  // initialize the instance of Elements below. The PaymentIntent settings configure which payment
  // method types to display in the PaymentElement.
  let url_post = new URL('http://localhost:4242/create-payment-intent');
  let params = {'customerId': customerId, 'currency': currency, 'amount': amount,'description': description};
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
  console.log('clientSecret',clientSecret);

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
    if(submitted) { return; }
    submitted = true;
    form.querySelector('button').disabled = true;

    const nameInput = document.querySelector('#name');

    // Confirm the card payment given the clientSecret
    // from the payment intent that was just created on
    // the server.
    const {error: stripeError} = await stripe.confirmPayment({
      elements,
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
