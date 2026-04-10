/**
 * Rewise AI — Content Script
 * Handles visual feedback (toasts) on the webpage
 */

(function () {
  // Prevent multiple injections
  if (window.rewiseInjected) return;
  window.rewiseInjected = true;

  console.log('Rewise AI content script loaded');

  // ─── Toast System ───────────────────────────────────────────

  const createToastContainer = () => {
    let container = document.getElementById('rewise-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'rewise-toast-container';
      container.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      `;
      document.body.appendChild(container);
    }
    return container;
  };

  const showToast = (message, type = 'success') => {
    const container = createToastContainer();
    const toast = document.createElement('div');

    const bgColor = type === 'success' ? '#10b981' : '#ef4444';
    const icon = type === 'success' ? '✅' : '❌';

    toast.style.cssText = `
      background: white;
      color: #1f2937;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 200px;
      max-width: 350px;
      transform: translateX(120%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
      border-left: 4px solid ${bgColor};
    `;

    toast.innerHTML = `
      <span style="font-size: 18px;">${icon}</span>
      <div style="display: flex; flex-direction: column;">
        <span style="font-weight: 600; font-size: 14px;">Rewise AI</span>
        <span style="font-size: 13px; color: #6b7280;">${message}</span>
      </div>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  };

  // ─── Message Listener ───────────────────────────────────────

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_TOAST') {
      showToast(message.text, message.status);
      sendResponse({ success: true });
    }
    return true;
  });
})();
