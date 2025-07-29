require('dotenv').config();
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

// Error handling
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).render('error', { message: err.message });
});

// If not running on Vercel (local dev), start server normally
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;  // Important for Vercel
