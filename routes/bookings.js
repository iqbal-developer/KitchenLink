const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Kitchen = require('../models/Kitchen');
const { isAuthenticated } = require('../middleware/auth');
const paypalHelper = require('../helpers/paypal');
const mpesaHelper = require('../helpers/mpesa');
const stripeHelper = require('../helpers/stripe');

// Get all bookings for current user
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.session.user.id })
            .populate('kitchen', 'name location')
            .sort('-createdAt');

        res.render('bookings/index', {
            title: 'My Bookings - KitchenLink',
            bookings
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error fetching bookings' });
    }
});

// Get single booking
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('kitchen', 'name location amenities')
            .populate('user', 'name email');

        if (!booking) {
            return res.status(404).render('error', { message: 'Booking not found' });
        }

        // Check if booking belongs to current user
        if (booking.user._id.toString() !== req.session.user.id) {
            return res.status(403).render('error', { message: 'Unauthorized access' });
        }

        // Populate selectedAmenities with full amenity objects
        if (booking.selectedAmenities && booking.kitchen && booking.kitchen.amenities) {
            booking.selectedAmenities = booking.selectedAmenities.map(id =>
                booking.kitchen.amenities.find(a => a._id.toString() === id.toString())
            ).filter(Boolean);
        }

        res.render('bookings/show', {
            title: `Booking Details - KitchenLink`,
            booking
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error fetching booking details' });
    }
});

// Process payment
router.post('/:id/pay', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).render('error', { message: 'Booking not found' });
        }

        // Check if booking belongs to current user
        if (booking.user.toString() !== req.session.user.id) {
            return res.status(403).render('error', { message: 'Unauthorized access' });
        }

        const { cardNumber, expiryDate, cvv } = req.body;

        // Mock payment processing
        // In a real application, this would integrate with a payment gateway
        const paymentSuccess = true; // For demo purposes, always succeed

        if (paymentSuccess) {
            booking.payment.status = 'completed';
            booking.status = 'confirmed';
            await booking.save();

            res.redirect(`/bookings/${booking._id}`);
        } else {
            res.status(400).render('error', { message: 'Payment failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error processing payment' });
    }
});

// Create a new booking
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const { kitchenId, date, startTime, endTime, guests } = req.body;
        
        // Validate input
        if (!kitchenId || !date || !startTime || !endTime || !guests) {
            req.flash('error', 'Please fill in all required fields');
            return res.redirect('back');
        }

        // Get kitchen details
        const kitchen = await Kitchen.findById(kitchenId);
        if (!kitchen) {
            req.flash('error', 'Kitchen not found');
            return res.redirect('back');
        }

        // Check capacity
        if (guests > kitchen.capacity) {
            req.flash('error', `Number of guests exceeds kitchen capacity of ${kitchen.capacity}`);
            return res.redirect('back');
        }

        // Check availability
        const bookingDate = new Date(date);
        const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
        const availability = kitchen.availability[dayOfWeek];

        if (!availability) {
            req.flash('error', 'Kitchen is not available on this day');
            return res.redirect('back');
        }

        // Check if time is within available hours
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        const availableStart = parseInt(availability.start.split(':')[0]);
        const availableEnd = parseInt(availability.end.split(':')[0]);

        if (startHour < availableStart || endHour > availableEnd) {
            req.flash('error', `Kitchen is only available between ${availability.start} and ${availability.end}`);
            return res.redirect('back');
        }

        // Check for existing bookings
        const existingBooking = await Booking.findOne({
            kitchen: kitchenId,
            date: date,
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
            ]
        });

        if (existingBooking) {
            req.flash('error', 'This time slot is already booked');
            return res.redirect('back');
        }

        // Calculate total cost
        const duration = endHour - startHour;
        const totalCost = duration * kitchen.hourlyRate;

        // Create new booking
        const booking = new Booking({
            user: req.user._id,
            kitchen: kitchenId,
            date: date,
            startTime: startTime,
            endTime: endTime,
            guests: guests,
            totalCost: totalCost,
            status: 'pending'
        });

        await booking.save();

        req.flash('success', 'Booking created successfully!');
        res.redirect('/users/bookings');
    } catch (error) {
        console.error('Booking creation error:', error);
        req.flash('error', 'Error creating booking. Please try again.');
        res.redirect('back');
    }
});

// Get all bookings for a user
router.get('/my-bookings', isAuthenticated, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('kitchen')
            .sort({ date: 1, startTime: 1 });
        
        res.render('bookings/my-bookings', { 
            title: 'My Bookings',
            bookings: bookings
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        req.flash('error', 'Error fetching bookings');
        res.redirect('/');
    }
});

// Cancel a booking
router.post('/:id/cancel', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!booking) {
            req.flash('error', 'Booking not found');
            return res.redirect('/users/bookings');
        }

        // Only allow cancellation of pending bookings
        if (booking.status !== 'pending') {
            req.flash('error', 'Only pending bookings can be cancelled');
            return res.redirect('/users/bookings');
        }

        booking.status = 'cancelled';
        await booking.save();

        req.flash('success', 'Booking cancelled successfully');
        res.redirect('/users/bookings');
    } catch (error) {
        console.error('Error cancelling booking:', error);
        req.flash('error', 'Error cancelling booking');
        res.redirect('/users/bookings');
    }
});

// Create PayPal order for a booking
router.post('/:id/paypal/create-order', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.user.toString() !== req.session.user.id) return res.status(403).json({ error: 'Unauthorized' });
        if (booking.payment.status === 'completed') return res.status(400).json({ error: 'Already paid' });

        const order = await paypalHelper.createOrder(booking.totalCost);
        res.json({ id: order.result.id });
    } catch (error) {
        console.error('PayPal create order error:', error);
        res.status(500).json({ error: 'Error creating PayPal order' });
    }
});

// Capture PayPal payment for a booking
router.post('/:id/paypal/capture', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.user.toString() !== req.session.user.id) return res.status(403).json({ error: 'Unauthorized' });
        if (booking.payment.status === 'completed') return res.status(400).json({ error: 'Already paid' });

        const { orderId } = req.body;
        const capture = await paypalHelper.captureOrder(orderId);
        booking.payment.status = 'completed';
        booking.payment.method = 'paypal';
        booking.payment.transactionId = orderId;
        booking.status = 'confirmed';
        await booking.save();
        res.json({ success: true });
    } catch (error) {
        console.error('PayPal capture error:', error);
        res.status(500).json({ error: 'Error capturing PayPal payment' });
    }
});

// Initiate M-Pesa STK Push for a booking
router.post('/:id/mpesa/initiate', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.user.toString() !== req.session.user.id) return res.status(403).json({ error: 'Unauthorized' });
        if (booking.payment.status === 'completed') return res.status(400).json({ error: 'Already paid' });

        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Phone number required' });

        const response = await mpesaHelper.stkPush({
            amount: booking.totalCost,
            phone,
            accountReference: booking._id.toString(),
            transactionDesc: `Booking payment for ${booking._id}`
        });
        // Save transactionId (CheckoutRequestID) for later verification
        booking.payment.transactionId = response.CheckoutRequestID;
        booking.payment.method = 'mpesa';
        booking.payment.status = 'pending';
        await booking.save();
        res.json({ success: true, CheckoutRequestID: response.CheckoutRequestID });
    } catch (error) {
        console.error('M-Pesa STK Push error:', error);
        res.status(500).json({ error: 'Error initiating M-Pesa payment' });
    }
});

// M-Pesa callback endpoint
router.post('/mpesa/callback', async (req, res) => {
    try {
        const body = req.body;
        const checkoutId = body.Body.stkCallback.CheckoutRequestID;
        const resultCode = body.Body.stkCallback.ResultCode;
        const booking = await Booking.findOne({ 'payment.transactionId': checkoutId });
        if (!booking) return res.status(404).end();
        if (resultCode === 0) {
            booking.payment.status = 'completed';
            booking.status = 'confirmed';
        } else {
            booking.payment.status = 'failed';
        }
        await booking.save();
        res.status(200).end();
    } catch (error) {
        console.error('M-Pesa callback error:', error);
        res.status(500).end();
    }
});

// Create Stripe PaymentIntent for a booking
router.post('/:id/stripe/create-intent', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.user.toString() !== req.session.user.id) return res.status(403).json({ error: 'Unauthorized' });
        if (booking.payment.status === 'completed') return res.status(400).json({ error: 'Already paid' });

        const paymentIntent = await stripeHelper.createPaymentIntent(booking.totalCost);
        booking.payment.transactionId = paymentIntent.id;
        booking.payment.method = 'stripe';
        booking.payment.status = 'pending';
        await booking.save();
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Stripe create intent error:', error);
        res.status(500).json({ error: 'Error creating payment intent' });
    }
});

// Confirm Stripe payment for a booking
router.post('/:id/stripe/confirm', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.user.toString() !== req.session.user.id) return res.status(403).json({ error: 'Unauthorized' });
        if (booking.payment.status === 'completed') return res.status(400).json({ error: 'Already paid' });

        const { paymentIntentId } = req.body;
        if (booking.payment.transactionId !== paymentIntentId) return res.status(400).json({ error: 'Invalid payment intent' });

        // Optionally, retrieve and check payment intent status
        // const paymentIntent = await stripeHelper.retrievePaymentIntent(paymentIntentId);
        // if (paymentIntent.status !== 'succeeded') return res.status(400).json({ error: 'Payment not successful' });

        booking.payment.status = 'completed';
        booking.status = 'confirmed';
        await booking.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Stripe confirm error:', error);
        res.status(500).json({ error: 'Error confirming payment' });
    }
});

module.exports = router; 