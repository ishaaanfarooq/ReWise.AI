/**
 * Rewise AI — Background Service Worker
 * Handles context menu registration, highlight capture, and auth state
 */

const API_BASE = 'http://localhost:3000';

// ─── Context Menu Setup ──────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  // Create the right-click menu item (only shows when text is selected)
  chrome.contextMenus.create({
    id: 'rewise-add-highlight',
    title: '📚 Add to Rewise AI',
    contexts: ['selection'],
  });

  console.log('Rewise AI: Context menu registered');
});

// ─── Context Menu Click Handler ──────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'rewise-add-highlight') return;

  const selectedText = info.selectionText?.trim();
  if (!selectedText) {
    showNotification('No text selected', 'Please select some text first.');
    return;
  }

  // Check authentication
  const authData = await getAuthData();
  if (!authData?.token) {
    // Open popup for login
    showNotification('Login Required', 'Please log in to Rewise AI first.');
    // Open the popup programmatically isn't possible in MV3,
    // but we can open a tab to the login page
    chrome.tabs.create({ url: `${API_BASE}/auth/google` });
    return;
  }

  // Send highlight to backend
  try {
    const response = await fetch(`${API_BASE}/highlights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.token}`,
      },
      body: JSON.stringify({
        text: selectedText,
        sourceUrl: tab?.url || '',
        pageTitle: tab?.title || '',
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Show visual feedback on the page
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_TOAST',
        text: 'Saved to Rewise AI!',
        status: 'success'
      });
      
      // Update badge
      await updateBadge();
    } else if (response.status === 401) {
      // Token expired — clear auth and prompt re-login
      await chrome.storage.local.remove('rewise_auth');
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_TOAST',
        text: 'Session expired. Please log in again.',
        status: 'error'
      });
      chrome.tabs.create({ url: `${API_BASE}/auth/google` });
    } else {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_TOAST',
        text: data.error || 'Failed to save highlight.',
        status: 'error'
      });
    }
  } catch (error) {
    console.error('Rewise AI: Save failed', error);
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_TOAST',
      text: 'Network Error. Could not connect to server.',
      status: 'error'
    });
  }
});

// ─── Auth Helpers ────────────────────────────────────────────

async function getAuthData() {
  return new Promise((resolve) => {
    chrome.storage.local.get('rewise_auth', (result) => {
      resolve(result.rewise_auth || null);
    });
  });
}

// ─── Listen for auth messages from the success page ──────────

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_SUCCESS' && message.data) {
    chrome.storage.local.set({ rewise_auth: message.data }, () => {
      console.log('Rewise AI: Auth data saved');
      updateBadge();
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  }
});

// Also listen for internal messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_SUCCESS' && message.data) {
    chrome.storage.local.set({ rewise_auth: message.data }, () => {
      updateBadge();
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.type === 'LOGOUT') {
    chrome.storage.local.remove('rewise_auth', () => {
      updateBadge();
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_AUTH') {
    getAuthData().then((data) => sendResponse(data));
    return true;
  }

  if (message.type === 'GET_STATS') {
    getAuthData().then(async (authData) => {
      if (!authData?.token) {
        sendResponse({ success: false, error: 'Not authenticated' });
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/summary/stats`, {
          headers: { 'Authorization': `Bearer ${authData.token}` },
        });
        const data = await response.json();
        sendResponse(data);
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  if (message.type === 'GET_RECENT') {
    getAuthData().then(async (authData) => {
      if (!authData?.token) {
        sendResponse({ success: false, error: 'Not authenticated' });
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/highlights?limit=5`, {
          headers: { 'Authorization': `Bearer ${authData.token}` },
        });
        const data = await response.json();
        sendResponse(data);
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }
});

// ─── Badge ───────────────────────────────────────────────────

async function updateBadge() {
  const authData = await getAuthData();
  if (authData?.token) {
    chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
    chrome.action.setBadgeText({ text: '✓' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ─── Notifications ───────────────────────────────────────────

function showNotification(title, message) {
  // Use the action badge for quick feedback since notifications API
  // requires additional permissions. We'll flash the badge instead.
  chrome.action.setBadgeBackgroundColor({ color: title.includes('✅') ? '#22c55e' : '#ef4444' });
  chrome.action.setBadgeText({ text: title.includes('✅') ? '✓' : '!' });
  
  // Reset badge after 3 seconds
  setTimeout(() => updateBadge(), 3000);
  
  console.log(`Rewise AI: ${title} — ${message}`);
}

// Initialize badge on startup
updateBadge();
