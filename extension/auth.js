/**
 * Rewise AI — Auth Callback Script
 * Extracts token from URL params, stores in chrome.storage,
 * and renders the premium welcome page with info content.
 */

(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const name = params.get('name');
  const email = params.get('email');
  const avatar = params.get('avatar');

  const contentEl = document.getElementById('content');

  if (token) {
    const authData = { token, name, email, avatar };

    // Render the success UI immediately
    renderSuccess(name, email);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      // Running inside the extension context — save to chrome.storage
      chrome.storage.local.set({ rewise_auth: authData }, () => {
        console.log('Rewise AI: Auth saved to chrome.storage');
      });
    } else {
      // Fallback — store in localStorage
      localStorage.setItem('rewise_auth', JSON.stringify(authData));
    }

    // Auto-close after 5 seconds
    setTimeout(() => window.close(), 5000);
  } else {
    renderError();
  }

  function renderSuccess(name, email) {
    const displayName = name || email || 'User';
    contentEl.innerHTML = `
      <div class="badge">✓ Successfully Authenticated</div>
      <h1>Welcome to Rewise AI</h1>
      <p class="subtitle">
        Signed in as <strong>${displayName}</strong>. Your intelligent knowledge capture system is now active.
      </p>

      <div class="divider"></div>
      <p class="section-title">How it works</p>

      <ul class="steps">
        <li>
          <span class="step-icon">✂️</span>
          <span><strong>Highlight any text</strong> on a webpage, right-click, and select <em>"📚 Add to Rewise AI"</em> to save it instantly</span>
        </li>
        <li>
          <span class="step-icon">🤖</span>
          <span><strong>AI processes your highlights</strong> in the background — generating summaries, explanations, real-world examples, and smart tags</span>
        </li>
        <li>
          <span class="step-icon">📧</span>
          <span><strong>Weekly revision digest</strong> arrives every Sunday at 9:00 AM — a curated email with everything you captured, organized by topic</span>
        </li>
        <li>
          <span class="step-icon">📊</span>
          <span><strong>Track your progress</strong> by clicking the extension icon to see your stats, recent highlights, and top topics</span>
        </li>
      </ul>

      <div class="notice">
        <span class="notice-icon">📬</span>
        <span>Your weekly digest will be sent to <strong>${email || 'your registered email'}</strong>. If you don't receive it, please check your <strong>Spam</strong> or <strong>Promotions</strong> folder and mark it as "Not Spam" so future emails land in your inbox.</span>
      </div>

      <p class="close-msg">You can close this tab or it will close automatically <span class="dot"></span><span class="dot"></span><span class="dot"></span></p>
    `;
  }

  function renderError() {
    contentEl.classList.add('error-card');
    contentEl.innerHTML = `
      <div class="icon">⚠️</div>
      <h1>Authentication Failed</h1>
      <p>No token was received. Please try logging in again through the extension popup.</p>
    `;
  }
})();
