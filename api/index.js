const app = require('../app');

// Vercel expects a default export
module.exports = (req, res) => {
  return app(req, res); 
};
