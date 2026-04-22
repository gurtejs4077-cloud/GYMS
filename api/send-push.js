const { KJUR } = require('jsrsasign');

// This function runs on Vercel's servers.
// It is NOT bundled into your APK, so it is safe.
module.exports = async (req, res) => {
  // 1. Set CORS headers so your app can call it
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, title, body, data: extraData } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // These should be set as Environment Variables in Vercel Dashboard
    // Or we can use the values from your service account JSON
    const PROJECT_ID = "gymflow-83d53";
    const CLIENT_EMAIL = "firebase-adminsdk-fbsvc@gymflow-83d53.iam.gserviceaccount.com";
    
    // THE PRIVATE KEY MUST BE IN VERCEL ENV VARIABLES
    const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || "";

    if (!PRIVATE_KEY) {
      return res.status(500).json({ error: 'Server configuration error: Private Key missing' });
    }

    // 2. Generate Access Token using JWT
    const header = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    const payload = {
      iss: CLIENT_EMAIL,
      sub: CLIENT_EMAIL,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiry,
      scope: 'https://www.googleapis.com/auth/firebase.messaging'
    };

    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const jwtToken = KJUR.jws.JWS.sign('RS256', sHeader, sPayload, PRIVATE_KEY.replace(/\\n/g, '\n'));

    // 3. Exchange JWT for Access Token
    const authResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken
      })
    });

    const authData = await authResponse.json();
    if (!authResponse.ok) throw new Error(`Auth failed: ${JSON.stringify(authData)}`);

    const accessToken = authData.access_token;

    // 4. Send the FCM message
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
    const fcmResponse = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: extraData || {},
          android: { priority: 'high' }
        }
      })
    });

    const fcmData = await fcmResponse.json();
    if (!fcmResponse.ok) throw new Error(`FCM failed: ${JSON.stringify(fcmData)}`);

    return res.status(200).json({ success: true, messageId: fcmData.name });

  } catch (error) {
    console.error("Vercel Function Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
