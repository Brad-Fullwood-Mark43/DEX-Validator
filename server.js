const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic authentication credentials (can be overridden with environment variables)
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'UniversalSearch';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'DEXValidation';

// Basic Authentication Middleware
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="CA eSUN Validator"');
    return res.status(401).send('Authentication required');
  }

  const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const username = auth[0];
  const password = auth[1];

  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    return next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="CA eSUN Validator"');
    return res.status(401).send('Invalid credentials');
  }
};

// Apply authentication to all routes except health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protect all other routes with basic auth
app.use(basicAuth);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route for the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CA eSUN Validator running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
