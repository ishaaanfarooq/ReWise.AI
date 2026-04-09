/**
 * Rewise AI — Auth Callback Script
 * Extracts token from URL params and stores in chrome.storage
 */

(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const name = params.get('name');
  const email = params.get('email');
  const avatar = params.get('avatar');

  if (token) {
    const authData = { token, name, email, avatar };

    if (typeof chrome !== 'undefined' && chrome.storage) {
      // Running inside the extension context
      chrome.storage.local.set({ rewise_auth: authData }, () => {
        console.log('Rewise AI: Auth saved');
        document.body.innerHTML = '<p>✅ Logged in! You can close this tab.</p>';
        setTimeout(() => window.close(), 2000);
      });
    } else {
      // Running on the backend success page — store for pickup
      localStorage.setItem('rewise_auth', JSON.stringify(authData));
      document.body.innerHTML = '<p>✅ Logged in! You can close this tab.</p>';
    }
  } else {
    document.body.innerHTML = '<p>❌ Authentication failed. No token received.</p>';
  }
})();
