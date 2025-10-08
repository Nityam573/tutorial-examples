// Set the base URL for the API request
const baseUrl = `${window.location.origin}${window.location.pathname}`;
let pollingInterval = null;
let sessionId = null;

// Function to handle the page load event
window.onload = () => {
    const qrCodeEl = document.getElementById('qrcode');
    const linkButton = document.getElementById('button');
    const errorMessage = document.getElementById('errorMessage');

    // Show loading spinner
    qrCodeEl.innerHTML = '<div class="loading-spinner"></div>';

    fetch(`${baseUrl}api/sign-in`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to fetch authentication data');
            }
        })
        .then(data => {
            // Clear loading spinner
            qrCodeEl.innerHTML = '';

            // Generate QR code
            generateQrCode(qrCodeEl, data);

            // Encode the data in Base64 for the universal link
            const encodedRequest = btoa(JSON.stringify(data));
            linkButton.href = `https://wallet.privado.id/#i_m=${encodedRequest}`;

            // Extract session ID from the callback URL
            if (data.body && data.body.callbackUrl) {
                const urlParams = new URLSearchParams(data.body.callbackUrl.split('?')[1]);
                sessionId = urlParams.get('sessionId');

                // Store session ID for checking
                if (sessionId) {
                    storeSessionId(sessionId);
                    startAuthenticationCheck(sessionId);
                }
            }
        })
        .catch(error => {
            console.error('Error fetching data from API:', error);
            showError('Failed to load authentication. Please refresh the page.');
            qrCodeEl.innerHTML = '';
        });
};

function generateQrCode(element, data) {
    new QRCode(element, {
        text: JSON.stringify(data),
        width: 256,
        height: 256,
        correctLevel: QRCode.CorrectLevel.Q
    });
}

function storeSessionId(sessionId) {
    // Store in memory (not localStorage per instructions)
    window.currentSessionId = sessionId;
}

function startAuthenticationCheck(sessionId) {
    console.log('Starting authentication check for session:', sessionId);

    // Check for authentication every 2 seconds
    pollingInterval = setInterval(() => {
        checkAuthenticationStatus(sessionId);
    }, 2000);

    // Stop checking after 5 minutes (timeout)
    setTimeout(() => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
            console.log('Authentication check timeout');
        }
    }, 300000);
}

function checkAuthenticationStatus(sessionId) {
    // Try to check if authentication was successful by querying with session ID
    fetch(`${baseUrl}api/auth-status?sessionId=${sessionId}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            // If 404 or error, auth not complete yet
            throw new Error('Not authenticated yet');
        })
        .then(data => {
            // If we get valid data back, authentication succeeded
            if (data && (data.from || data.authenticated)) {
                console.log('Authentication successful!', data);
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                }
                showSuccessModal(data);
            }
        })
        .catch(error => {
            // Authentication not complete yet, continue polling silently
            // This is expected behavior
        });
}

function showSuccessModal(authData) {
    console.log('Showing success modal');
    const modal = document.getElementById('successModal');
    modal.classList.add('show');

    // Store auth data if needed
    if (authData) {
        window.authenticationData = authData;
    }
}

function closeModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');

    // Show the welcome dashboard
    showDashboard();
}

function showDashboard() {
    const loginContainer = document.getElementById('loginContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const userDIDElement = document.getElementById('userDID');
    const networkTypeElement = document.getElementById('networkType');

    // Hide login container
    loginContainer.classList.add('hidden');

    // Show dashboard
    dashboardContainer.classList.add('show');

    // Display user DID
    if (window.authenticationData && window.authenticationData.from) {
        userDIDElement.textContent = window.authenticationData.from;

        // Extract network from DID if possible
        const didParts = window.authenticationData.from.split(':');
        if (didParts.length >= 3) {
            networkTypeElement.textContent = didParts[2].charAt(0).toUpperCase() + didParts[2].slice(1);
        }
    } else {
        userDIDElement.textContent = 'DID not available';
    }

    console.log('Dashboard displayed with user data:', window.authenticationData);
}

function goToDashboard() {
    // Redirect to your application dashboard
    console.log('Redirecting to dashboard...');
    // window.location.href = '/dashboard';
    alert('This would redirect to your application dashboard!');
}

function logout() {
    // Clear authentication data
    window.authenticationData = null;
    window.currentSessionId = null;

    // Hide dashboard
    const dashboardContainer = document.getElementById('dashboardContainer');
    dashboardContainer.classList.remove('show');

    // Show login container again
    const loginContainer = document.getElementById('loginContainer');
    loginContainer.classList.remove('hidden');

    // Reload the page to get a fresh auth request
    setTimeout(() => {
        window.location.reload();
    }, 300);
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

// Close modal when clicking outside
document.getElementById('successModal').addEventListener('click', (e) => {
    if (e.target.id === 'successModal') {
        closeModal();
    }
});

// Manual trigger for testing - you can call this from console
window.testSuccessModal = function () {
    showSuccessModal({ from: 'test-user', authenticated: true });
};