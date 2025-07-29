const serverless = require('serverless-http');
const app = require('../app');

module.exports = serverless(app);
// This file is used to wrap the Express app for serverless deployment
// It allows the app to be run in a serverless environment like AWS Lambda or Vercel