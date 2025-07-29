const express = require('express');
const router = express.Router();
const Kitchen = require('../models/Kitchen');
const Booking = require('../models/Booking');
const { isAuthenticated, isOwner, isAdmin, isOwnerOrAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const notOwner = require('../middleware/notOwner');
// Multer setup for kitchen images (admin/global)
const kitchenStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/kitchen-images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const kitchenUpload = multer({ storage: kitchenStorage });

// Get all kitchens with filtering
router.get('/', notOwner, async (req, res) => {
    try {
        const { location, type, capacity, minPrice, maxPrice } = req.query;
        let query = {};

        // Location filter
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        // Kitchen type filter
        if (type) {
            query.kitchenType = type;
        }

        // Capacity filter
        if (capacity) {
            query.capacity = { $gte: parseInt(capacity) };
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.hourlyRate = {};
            if (minPrice) query.hourlyRate.$gte = parseInt(minPrice);
            if (maxPrice) query.hourlyRate.$lte = parseInt(maxPrice);
        }

        const kitchens = await Kitchen.find(query)
            .populate('owner', 'name')
            .sort('-createdAt');

        // Get unique kitchen types and locations for filter dropdowns
        const kitchenTypes = await Kitchen.distinct('kitchenType');
        const locations = await Kitchen.distinct('location');

        res.render('kitchens/index', {
            title: 'Available Kitchens - KitchenLink',
            kitchens,
            kitchenTypes,
            locations,
            filters: {
                location,
                type,
                capacity,
                minPrice,
                maxPrice
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error fetching kitchens' });
    }
});

// Create kitchen page
router.get('/new', isAuthenticated, isOwnerOrAdmin, (req, res) => {
    res.render('kitchens/new', {
        title: 'List Your Kitchen - KitchenLink'
    });
});

// Create kitchen
router.post('/', isAuthenticated, isOwnerOrAdmin, kitchenUpload.array('images', 5), async (req, res) => {
    try {
        let {
            name,
            description,
            location,
            latitude,
            longitude,
            capacity,
            kitchenType,
            amenities,
            hourlyRate,
            availability,
            rules
        } = req.body;
        // Validate latitude/longitude
        if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
            return res.status(400).render('error', { message: 'Latitude and longitude are required and must be valid numbers.' });
        }
        availability = availability === 'on' ? true : false;
        const images = req.files ? req.files.map(f => '/uploads/kitchen-images/' + f.filename) : [];
        const kitchen = new Kitchen({
            name,
            description,
            location,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            capacity,
            kitchenType,
            amenities, // already array of objects
            hourlyRate,
            availability,
            owner: req.session.user.id,
            images,
            rules: rules ? rules.split('\n').map(rule => rule.trim()).filter(rule => rule) : []
        });
        await kitchen.save();
        res.redirect(`/kitchens/${kitchen._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error creating kitchen' });
    }
});

// Get single kitchen
router.get('/:id', notOwner, async (req, res) => {
    try {
        const kitchen = await Kitchen.findById(req.params.id)
            .populate({
                path: 'reviews',
                populate: { path: 'user', select: 'name' }
            });

        if (!kitchen) {
            return res.status(404).render('error', { message: 'Kitchen not found' });
        }

        res.render('kitchens/show', {
            title: `${kitchen.name} - KitchenLink`,
            kitchen
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error fetching kitchen details' });
    }
});

// Edit kitchen page
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const kitchen = await Kitchen.findById(req.params.id);
        if (!kitchen) {
            return res.status(404).render('error', { message: 'Kitchen not found' });
        }
        // Only owner of kitchen or admin can edit
        if (req.session.user.role !== 'admin' && kitchen.owner.toString() !== req.session.user.id) {
            req.flash('error', 'Access denied. You can only edit your own kitchens.');
            return res.redirect('/kitchens');
        }
        res.render('kitchens/edit', {
            title: `Edit ${kitchen.name} - KitchenLink`,
            kitchen
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error fetching kitchen' });
    }
});

// Update kitchen
router.put('/:id', isAuthenticated, kitchenUpload.array('images', 5), async (req, res) => {
    try {
        const kitchen = await Kitchen.findById(req.params.id);
        if (!kitchen) {
            return res.status(404).render('error', { message: 'Kitchen not found' });
        }
        // Only owner of kitchen or admin can update
        if (req.session.user.role !== 'admin' && kitchen.owner.toString() !== req.session.user.id) {
            req.flash('error', 'Access denied. You can only update your own kitchens.');
            return res.redirect('/kitchens');
        }
        let {
            name,
            description,
            location,
            latitude,
            longitude,
            capacity,
            kitchenType,
            amenities,
            hourlyRate,
            availability,
            rules
        } = req.body;
        // Validate latitude/longitude
        if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
            return res.status(400).render('error', { message: 'Latitude and longitude are required and must be valid numbers.' });
        }
        availability = availability === 'on' ? true : false;
        const update = {
            name,
            description,
            location,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            capacity,
            kitchenType,
            amenities, // already array of objects
            hourlyRate,
            availability,
            rules: rules ? rules.split('\n').map(rule => rule.trim()).filter(rule => rule) : []
        };
        if (req.files && req.files.length > 0) {
            update.images = req.files.map(f => '/uploads/kitchen-images/' + f.filename);
        }
        const updatedKitchen = await Kitchen.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );
        res.redirect(`/kitchens/${updatedKitchen._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error updating kitchen' });
    }
});

// Delete kitchen
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const kitchen = await Kitchen.findById(req.params.id);
        if (!kitchen) {
            return res.status(404).render('error', { message: 'Kitchen not found' });
        }
        // Only owner of kitchen or admin can delete
        if (req.session.user.role !== 'admin' && kitchen.owner.toString() !== req.session.user.id) {
            req.flash('error', 'Access denied. You can only delete your own kitchens.');
            return res.redirect('/kitchens');
        }
        await Kitchen.findByIdAndDelete(req.params.id);
        res.redirect('/kitchens');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error deleting kitchen' });
    }
});

// Book kitchen
router.post('/:id/book', isAuthenticated, async (req, res) => {
    try {
        const kitchen = await Kitchen.findById(req.params.id);
        if (!kitchen) {
            req.flash('error', 'Kitchen not found');
            return res.redirect('/kitchens');
        }

        // Check if kitchen is available
        if (!kitchen.availability) {
            req.flash('error', 'This kitchen is not available for booking at the moment');
            return res.redirect(`/kitchens/${kitchen._id}`);
        }

        const { 
            date,
            startTime,
            endTime,
            guests,
            selectedAmenities,
            paymentMethod,
            totalCost
        } = req.body;

        // Create booking
        const booking = new Booking({
            user: req.session.user.id,
            kitchen: kitchen._id,
            date,
            startTime,
            endTime,
            guests,
            selectedAmenities: Array.isArray(selectedAmenities) ? selectedAmenities : [],
            totalCost,
            status: 'pending',
            payment: {
                method: paymentMethod,
                status: 'pending'
            }
        });

        await booking.save();
        req.flash('success', 'Booking created successfully!');
        res.redirect(`/bookings/${booking._id}`);
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error creating booking');
        res.redirect(`/kitchens/${req.params.id}`);
    }
});

// Add review
router.post('/:id/reviews', isAuthenticated, async (req, res) => {
    try {
        const kitchen = await Kitchen.findById(req.params.id);
        if (!kitchen) {
            return res.status(404).render('error', { message: 'Kitchen not found' });
        }

        const { rating, comment } = req.body;
        kitchen.reviews.push({
            user: req.session.user.id,
            rating,
            comment
        });

        // Update average rating
        const totalRating = kitchen.reviews.reduce((sum, review) => sum + review.rating, 0);
        kitchen.averageRating = totalRating / kitchen.reviews.length;

        await kitchen.save();
        res.redirect(`/kitchens/${kitchen._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error adding review' });
    }
});

module.exports = router; 