const path = require("path");
const express = require("express");
const { auth, resolver, protocol } = require("@iden3/js-iden3-auth");
const getRawBody = require("raw-body");
const cors = require('cors');
const app = express();
const port = 8080;

app.use(express.static("./static"));
app.use(cors());

app.get("/api/sign-in", (req, res) => {
  console.log("get Auth Request");
  getAuthRequest(req, res);
});

app.get("/api/auth-status", (req, res) => {
  const sessionId = req.query.sessionId;

  if (!sessionId) {
    return res.status(400).send({ error: "Session ID is required" });
  }

  // Check if authentication was successful for this session
  const authData = requestMap.get(`${sessionId}_authenticated`);

  if (authData) {
    return res.status(200).json({
      authenticated: true,
      from: authData.from,
      ...authData
    });
  }

  return res.status(404).json({ authenticated: false });
});

app.post("/api/callback", (req, res) => {
  console.log("callback");
  callback(req, res);
});

app.listen(port, () => {
  console.log("server running on port 8080");
});

// Create a map to store the auth requests and their session IDs
const requestMap = new Map();

async function getAuthRequest(req, res) {
  const hostUrl = "Your_Public_API";
  const sessionId = Date.now();
  const callbackURL = "/api/callback";
  const audience =
    "did:polygonid:polygon:amoy:2qQ68JkRcf3xrHPQPWZei3YeVzHPP58wYNxx2mEouR"; // Your Verifier DID

  const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;

  // Generate request for basic authentication only (no proof requirements)
  const request = auth.createAuthorizationRequest("Basic Sign In", audience, uri);

  request.body.scope = [];

  // Store auth request in map associated with session ID
  requestMap.set(`${sessionId}`, request);

  console.log(`Created basic auth request for session: ${sessionId}`);

  return res.status(200).set("Content-Type", "application/json").send(request);
}

// Callback verifies the basic authentication response
async function callback(req, res) {
  try {
    // Get session ID from request
    const sessionId = req.query.sessionId;

    if (!sessionId) {
      return res.status(400).send({ error: "Session ID is required" });
    }

    // get JWZ token params from the post request
    const raw = await getRawBody(req);
    const tokenStr = raw.toString().trim();

    if (!tokenStr) {
      return res.status(400).send({ error: "Token is required" });
    }

    const keyDIR = "./keys";
    const resolvers = {
      ["privado:main"]: new resolver.EthStateResolver(
        "https://rpc-mainnet.privado.id",
        "0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896"
      )
    };

    // fetch authRequest from sessionID
    const authRequest = requestMap.get(`${sessionId}`);

    if (!authRequest) {
      return res.status(400).send({ error: "Invalid session ID or session expired" });
    }

    // EXECUTE BASIC VERIFICATION (no proof verification needed)
    const verifier = await auth.Verifier.newVerifier({
      stateResolver: resolvers,
      circuitsDir: path.join(__dirname, keyDIR),
      ipfsGatewayURL: "https://ipfs.io",
    });

    const opts = {
      AcceptedStateTransitionDelay: 5 * 60 * 1000, // 5 minutes
    };

    // identity verification only
    const authResponse = await verifier.fullVerify(tokenStr, authRequest, opts);

    console.log(`Basic authentication successful for session: ${sessionId}`);
    console.log("User DID:", authResponse.from);

    // Return success response
    return res.status(200).set("Content-Type", "application/json").send(authResponse);

  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).send({
      error: "Authentication failed",
      details: error.message
    });
  }
}
