import crypto from 'crypto';

// CSRF Token Management
const CSRF_SECRET = process.env.CSRF_SECRET || 'digital-business-card-secret-key-2024';
const TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes

// Generate CSRF token with timestamp
const generateCSRFToken = () => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}:${random}`;
  const hmac = crypto.createHmac('sha256', CSRF_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${payload}:${signature}`;
};

export const handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'GET'
      },
      body: JSON.stringify({
        error: 'Method not allowed'
      })
    };
  }

  try {
    const token = generateCSRFToken();
    const timestamp = Date.now();
    
    console.log(`[${new Date().toISOString()}] CSRF token issued to IP: ${event.headers['x-forwarded-for'] || 'unknown'}`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        csrfToken: token,
        expires: timestamp + TOKEN_EXPIRY,
        expiresIn: TOKEN_EXPIRY / 1000, // seconds
        issued: timestamp
      })
    };
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to generate CSRF token'
      })
    };
  }
};
