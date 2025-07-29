// Load env first
require('dotenv').config();

// Prevent secrets from being logged in production
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape for regex
const sensitivePatterns = [
  process.env.MPESA_CONSUMER_KEY,
  process.env.MPESA_CONSUMER_SECRET,
  process.env.SESSION_SECRET,
  process.env.MONGODB_URI
].filter(Boolean);

const scrubSecrets = (msg) => {
  let output = msg;
  for (const secret of sensitivePatterns) {
    if (secret && output.includes(secret)) {
      output = output.replace(new RegExp(escapeRegex(secret), 'g'), '[HIDDEN]');
    }
  }
  return output;
};

const safeLog = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args); // Full logs locally
  } else {
    console.log(...args.map(arg => (typeof arg === 'string' ? scrubSecrets(arg) : arg)));
  }
};

const safeError = (...args) => {
  console.error(...args.map(arg => (typeof arg === 'string' ? scrubSecrets(arg) : arg)));
};

// Override console methods
console.log = safeLog;
console.error = safeError;

const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const handlebarsHelpers = require('./helpers/handlebars');
const path = require('path');

const app = express();

// Handlebars setup
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: handlebarsHelpers,
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  },
  partialsDir: [path.join(__dirname, 'views/partials')]
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Session & flash
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/main'));
app.use('/auth', require('./routes/auth'));
app.use('/kitchens', require('./routes/kitchens'));
app.use('/bookings', require('./routes/bookings'));
app.use('/users', require('./routes/users'));

// Error handler
app.use((err, req, res, next) => {
  safeError('Error:', err.message);
  res.status(500).render('error', { 
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// Local dev server (not for Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;  // Export for Vercel
// This allows the app to be used in serverless environments like AWS Lambda or Vercel