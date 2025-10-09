# Privado Login Service

A Node.js backend service implementing secure authentication using Privado ID wallet.

## Overview

This service provides a complete authentication flow leveraging Privado's zero-knowledge proof system. Users authenticate by clicking a button that opens their Privado ID wallet, offering a privacy-preserving alternative to traditional authentication.

### API Endpoints

- `GET /api/sign-in` - Initiates authentication flow and returns QR code data
- `POST /api/callback` - Handles wallet authentication responses and verifies proofs
- `GET /api/auth-status` - Polls authentication status and returns verified user identity

## Quick Start

### Local Development with ngrok

Since Privado wallets require public HTTPS access for authentication callbacks, use ngrok for local development:

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start your server:**
   ```bash
   # Install dependencies
   npm install
   
   # Start the server
   node index.js
   ```

3. **Expose with ngrok (in another terminal):**
   ```bash
   ngrok http 8080
   ```

4. **Update the hostUrl in `index.js`:**
   ```javascript
   // Replace with your ngrok URL
   const hostUrl = "https://your-ngrok-url.ngrok-free.app";
   ```

5. **Restart the server and access via ngrok URL**

### Using Your Own Public API

If you have your own public API endpoint:

1. **Deploy your service** to your preferred cloud provider (AWS, Google Cloud, etc.)

2. **Update the hostUrl:**
   ```javascript
   const hostUrl = "https://your-api-domain.com";
   ```

3. **Ensure HTTPS is enabled** for secure wallet communication

