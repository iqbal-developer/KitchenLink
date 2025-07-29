const serverless = require('serverless-http');
const app = require('../app');  // Import your Express app

// Export as a serverless function for Vercel
module.exports = serverless(app);
// This file is used to wrap the Express app for serverless deployment
// It allows the app to be run in a serverless environment like AWS Lambda or Vercel