const serverless = require('serverless-http');
const app = require('../app');

// Force Express detection to fix "Unsupported framework" error
module.exports = serverless(app, { framework: 'express' });
