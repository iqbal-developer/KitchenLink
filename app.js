// Only load .env locally (not in production on Vercel)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

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

// Configure Handlebars
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: handlebarsHelpers,
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    },
    partialsDir: [
        path.join(__dirname, 'views/partials')
    ]
});

// Set up view engine
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Flash messages
app.use(flash());

// Make user data and flash messages available to all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const kitchenRoutes = require('./routes/kitchens');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const mainRoutes = require('./routes/main');

app.use('/', mainRoutes);
app.use('/auth', authRoutes);
app.use('/kitchens', kitchenRoutes);
app.use('/bookings', bookingRoutes);
app.use('/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Something broke!' });
});

// Export the app for serverless (no app.listen!)
module.exports = app;
