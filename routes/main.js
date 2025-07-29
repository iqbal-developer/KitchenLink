const express = require('express');
const router = express.Router();
const notOwner = require('../middleware/notOwner');

// Home page
router.get('/', notOwner, (req, res) => {
    res.render('index', {
        title: 'Home'
    });
});

// About Us page
router.get('/about', notOwner, (req, res) => {
    res.render('about', {
        title: 'About Us - KitchenLink'
    });
});

// Services page
router.get('/services', notOwner, (req, res) => {
    res.render('services', {
        title: 'Our Services - KitchenLink'
    });
});

// Contact Us page
router.get('/contact', notOwner, (req, res) => {
    res.render('contact', {
        title: 'Contact Us - KitchenLink'
    });
});

// How It Works page
router.get('/how-it-works', notOwner, (req, res) => {
    res.render('how-it-works', {
        title: 'How It Works - KitchenLink'
    });
});

// Cooking Tips page
router.get('/help/cooking-tips', notOwner, (req, res) => {
    res.render('help/cooking-tips', {
        title: 'Cooking Tips - KitchenLink'
    });
});

// Privacy Policy page
router.get('/privacy', notOwner, (req, res) => {
    res.render('privacy', {
        title: 'Privacy Policy - KitchenLink'
    });
});

// Terms of Service page
router.get('/terms', notOwner, (req, res) => {
    res.render('terms', {
        title: 'Terms of Service - KitchenLink'
    });
});

// Handle contact form submission
router.post('/contact', (req, res) => {
    // Here you would typically:
    // 1. Validate the form data
    // 2. Send an email notification
    // 3. Store the message in a database
    // 4. Show a success message to the user
    
    // For now, we'll just redirect with a success message
    req.flash('success', 'Thank you for your message. We will get back to you soon!');
    res.redirect('/contact');
});

module.exports = router; 