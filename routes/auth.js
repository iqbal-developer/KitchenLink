const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Register page
router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('auth/register', {
        title: 'Join KitchenLink'
    });
});

// Register user
router.post('/register', async (req, res) => {
    try {
        const { name, email: rawEmail, password, confirmPassword, phone, role } = req.body;
        const email = rawEmail.toLowerCase();
        console.log('Registering email:', email, 'password:', password);

        // Validate passwords match
        if (password !== confirmPassword) {
            return res.render('auth/register', {
                title: 'Join KitchenLink',
                error: 'Passwords do not match'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('auth/register', {
                title: 'Join KitchenLink',
                error: 'Email already registered'
            });
        }

        // Create new user (do NOT hash password here)
        let userRole = 'user';
        if (role === 'owner') userRole = 'owner';

        const user = new User({
            name,
            email,
            password, // pass raw password
            phone,
            role: userRole
        });

        await user.save();

        // Set session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Redirect based on role
        if (user.role === 'admin') {
            return res.redirect('/users/dashboard');
        } else if (user.role === 'owner') {
            return res.redirect('/users/owner-dashboard');
        } else {
            return res.redirect('/users/profile');
        }
    } catch (error) {
        console.error(error);
        res.render('auth/register', {
            title: 'Join KitchenLink',
            error: 'Error creating account'
        });
    }
});

// Login page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('auth/login', {
        title: 'Sign In - KitchenLink'
        // Do NOT include error here
    });
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email: rawEmail, password, remember } = req.body;
        const email = rawEmail.toLowerCase();
        console.log('Login attempt:', email, password);
        // Find user
        const user = await User.findOne({ email });
        console.log('User found:', user);
        if (!user) {
            return res.render('auth/login', {
                title: 'Sign In - KitchenLink',
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Sign In - KitchenLink',
                error: 'Invalid credentials'
            });
        }

        // Set session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Set remember me cookie if requested
        if (remember) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }

        // Redirect based on role
        if (user.role === 'admin') {
            return res.redirect('/users/dashboard');
        } else if (user.role === 'owner') {
            return res.redirect('/users/owner-dashboard');
        } else {
            return res.redirect('/users/profile');
        }
    } catch (error) {
        console.error(error);
        res.render('auth/login', {
            title: 'Sign In - KitchenLink',
            error: 'Error signing in'
        });
    }
});

// Admin login page
router.get('/login/admin', (req, res) => {
    if (req.session.user) {
        return res.redirect('/users/dashboard');
    }
    res.render('auth/login-admin', {
        title: 'Admin Login - KitchenLink'
    });
});

// Admin login POST
router.post('/login/admin', async (req, res) => {
    try {
        const { email: rawEmail, password, remember } = req.body;
        const email = rawEmail.toLowerCase();
        // Find user
        const user = await User.findOne({ email, role: 'admin' });
        if (!user) {
            return res.render('auth/login-admin', {
                title: 'Admin Login - KitchenLink',
                error: 'Invalid admin credentials'
            });
        }
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/login-admin', {
                title: 'Admin Login - KitchenLink',
                error: 'Invalid admin credentials'
            });
        }
        // Set session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        if (remember) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }
        return res.redirect('/users/dashboard');
    } catch (error) {
        console.error(error);
        res.render('auth/login-admin', {
            title: 'Admin Login - KitchenLink',
            error: 'Error signing in as admin'
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

// Forgot password page
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Forgot Password - KitchenLink'
    });
});

module.exports = router; 