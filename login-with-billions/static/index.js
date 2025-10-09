// Set the base URL for the API request
const basePath = window.location.pathname.replace(/\/[^/]*$/, '/');
const baseUrl = `${window.location.origin}${basePath}`;

let pollingInterval = null;
let sessionId = null;

window.onload = () => {
  const linkButton = document.getElementById('button');

  linkButton.textContent = 'Loading...';

  fetch(`${baseUrl}api/sign-in`)
    .then((response) => {
      if (!response.ok) throw new Error('Failed to fetch authentication data');
      return response.json();
    })
    .then((data) => {
      linkButton.textContent = 'Login with Billions';

      const encodedRequest = btoa(JSON.stringify(data));
      linkButton.href = `https://wallet.billions.network/#i_m=${encodedRequest}`;

      if (data.body && data.body.callbackUrl) {
        const urlParams = new URLSearchParams(data.body.callbackUrl.split('?')[1]);
        sessionId = urlParams.get('sessionId');
        if (sessionId) {
          window.currentSessionId = sessionId; // store in-memory
          startAuthenticationCheck(sessionId);
        }
      }
    })
    .catch(() => {
      showError('Failed to load authentication. Please refresh the page.');
      linkButton.textContent = 'Retry Login';
    });

  // wire up buttons
  document.getElementById('continueBtn').addEventListener('click', closeModal);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // close modal when clicking backdrop
  document.getElementById('successModal').addEventListener('click', (e) => {
    if (e.target.id === 'successModal') closeModal();
  });
};

function startAuthenticationCheck(sessionId) {
  // poll every 2s
  pollingInterval = setInterval(() => checkAuthenticationStatus(sessionId), 2000);

  // stop after 5 minutes
  setTimeout(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }, 300000);
}

function checkAuthenticationStatus(sessionId) {
  fetch(`${baseUrl}api/auth-status?sessionId=${sessionId}`)
    .then((response) => {
      if (!response.ok) throw new Error('Not authenticated yet');
      return response.json();
    })
    .then((data) => {
      if (data && (data.from || data.authenticated)) {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        showSuccessModal(data);
      }
    })
    .catch(() => {
      // keep polling
    });
}

function showSuccessModal(authData) {
  const modal = document.getElementById('successModal');
  modal.classList.add('show');
  if (authData) window.authenticationData = authData;
}

function closeModal() {
  document.getElementById('successModal').classList.remove('show');
  showDashboard();
}

function showDashboard() {
  document.getElementById('loginContainer').classList.add('hidden');
  document.getElementById('dashboardContainer').classList.add('show');

  const userDIDElement = document.getElementById('userDID');
  if (window.authenticationData && window.authenticationData.from) {
    userDIDElement.textContent = window.authenticationData.from;
  } else {
    userDIDElement.textContent = 'DID not available';
  }
}

function logout() {
  window.authenticationData = null;
  window.currentSessionId = null;

  document.getElementById('dashboardContainer').classList.remove('show');
  document.getElementById('loginContainer').classList.remove('hidden');

  setTimeout(() => window.location.reload(), 300);
}

function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  errorEl.textContent = message;
  errorEl.classList.add('show');
}
