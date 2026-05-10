/**
 * Rewise AI — Extension Configuration
 * Manages API URL based on environment
 */

// Detect environment from localStorage or use default
function getApiBase() {
  // Check if API URL is stored in localStorage (set during OAuth callback)
  const storedUrl = localStorage.getItem('rewise_api_base');
  if (storedUrl) {
    return storedUrl;
  }

  // Check environment (dev vs production)
  const isDevelopment = chrome.runtime.id === 'YOUR_DEV_EXTENSION_ID'; // Replace with your dev extension ID
  
  if (isDevelopment) {
    return 'http://localhost:3000';
  }

  // Production URL - stored in Chrome storage to allow dynamic updates
  return 'https://api.rewise.ai'; // Replace with your production domain
}

/**
 * Set API URL dynamically (useful after OAuth callback)
 * @param {string} url - The API base URL
 */
function setApiBase(url) {
  if (url && url.startsWith('http')) {
    localStorage.setItem('rewise_api_base', url);
  }
}

/**
 * Get API URL synchronously for immediate use
 */
const API_BASE = getApiBase();

/**
 * Get API URL asynchronously (for chrome.storage queries)
 */
async function getApiBaseAsync() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['api_base'], (result) => {
      if (result.api_base) {
        resolve(result.api_base);
      } else {
        resolve(getApiBase());
      }
    });
  });
}

export { API_BASE, getApiBase, setApiBase, getApiBaseAsync };
