// Helper for displaying status messages.
const addMessage = (message) => {
  const messagesDiv = document.querySelector('#messages');
  // ATTENTO MODALITA' DEBUG COMMENTATA
  //messagesDiv.style.display = 'block';
  messagesDiv.style.display = 'none';
  const messageWithLinks = addDashboardLinks(message);
  messagesDiv.innerHTML += `<br>${messageWithLinks}<br>`;
  console.log(`Debug: ${message}`);
};

// Adds links for known Stripe objects to the Stripe dashboard.
const addDashboardLinks = (message) => {
  const piDashboardBase = 'https://dashboard.stripe.com/test/payments';
  return message.replace(
    /(pi_(\S*)\b)/g,
    `<a href="${piDashboardBase}/$1" target="_blank">$1</a>`
  );
};
