/**
 * Rewise AI — Popup Script
 * Manages login/logout state and displays user stats
 */

const API_BASE = 'http://localhost:3000';

// ─── DOM Elements ────────────────────────────────────────────

const $loading = document.getElementById('loading');
const $loggedOut = document.getElementById('logged-out');
const $loggedIn = document.getElementById('logged-in');
const $btnLogin = document.getElementById('btn-login');
const $btnLogout = document.getElementById('btn-logout');
const $btnRefresh = document.getElementById('btn-refresh');
const $userName = document.getElementById('user-name');
const $userEmail = document.getElementById('user-email');
const $userAvatar = document.getElementById('user-avatar');
const $statTotal = document.getElementById('stat-total');
const $statProcessed = document.getElementById('stat-processed');
const $statPending = document.getElementById('stat-pending');
const $tagsSection = document.getElementById('tags-section');
const $tagsContainer = document.getElementById('tags-container');

// ─── Initialization ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Check for auth data from URL params (coming back from OAuth)
  const params = new URLSearchParams(window.location.search);
  if (params.has('token')) {
    const authData = {
      token: params.get('token'),
      name: params.get('name'),
      email: params.get('email'),
      avatar: params.get('avatar'),
    };
    await saveAuth(authData);
  }

  // Check stored auth
  const authData = await getAuth();

  if (authData?.token) {
    showLoggedIn(authData);
    loadStats();
  } else {
    showLoggedOut();
  }
}

// ─── State Management ────────────────────────────────────────

function showLoggedOut() {
  $loading.style.display = 'none';
  $loggedOut.style.display = 'block';
  $loggedIn.style.display = 'none';
}

function showLoggedIn(authData) {
  $loading.style.display = 'none';
  $loggedOut.style.display = 'none';
  $loggedIn.style.display = 'block';

  $userName.textContent = authData.name || 'User';
  $userEmail.textContent = authData.email || '';

  if (authData.avatar) {
    $userAvatar.src = authData.avatar;
    $userAvatar.style.display = 'block';
  } else {
    $userAvatar.style.display = 'none';
  }
}

// ─── Auth Helpers ────────────────────────────────────────────

function getAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.get('rewise_auth', (result) => {
      resolve(result.rewise_auth || null);
    });
  });
}

function saveAuth(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ rewise_auth: data }, resolve);
  });
}

function clearAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.remove('rewise_auth', resolve);
  });
}

// ─── Load Stats ──────────────────────────────────────────────

async function loadStats() {
  try {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
      if (response?.success && response.stats) {
        const { total, processed, pending, topTags } = response.stats;

        animateNumber($statTotal, total);
        animateNumber($statProcessed, processed);
        animateNumber($statPending, pending);

        // Render tags
        if (topTags && topTags.length > 0) {
          $tagsSection.style.display = 'block';
          $tagsContainer.innerHTML = topTags
            .map(
              (t) =>
                `<span class="tag">${t.tag}<span class="tag-count">${t.count}</span></span>`
            )
            .join('');
        }
      }
    });
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Smooth number animation
function animateNumber(el, target) {
  const duration = 600;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ─── Event Listeners ─────────────────────────────────────────

$btnLogin.addEventListener('click', () => {
  // Open Google OAuth in a new tab
  chrome.tabs.create({ url: `${API_BASE}/auth/google` });
  window.close();
});

$btnLogout.addEventListener('click', async () => {
  await clearAuth();
  chrome.runtime.sendMessage({ type: 'LOGOUT' });
  showLoggedOut();
});

$btnRefresh.addEventListener('click', () => {
  $statTotal.textContent = '—';
  $statProcessed.textContent = '—';
  $statPending.textContent = '—';
  loadStats();
});

// ─── Listen for auth changes ─────────────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.rewise_auth) {
    const newValue = changes.rewise_auth.newValue;
    if (newValue?.token) {
      showLoggedIn(newValue);
      loadStats();
    } else {
      showLoggedOut();
    }
  }
});
