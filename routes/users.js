const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const Kitchen = require('../models/Kitchen');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');
const Activity = require('../models/Activity');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const { ensureAuthenticated, isAuthenticated, isOwner, isAdmin } = require('../middleware/auth');
const notOwner = require('../middleware/notOwner');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/profile-images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// Multer setup for kitchen images (owner)
const ownerKitchenStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/kitchen-images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const ownerKitchenUpload = multer({ storage: ownerKitchenStorage });

// Get user profile
router.get('/profile', notOwner, isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        const userStats = {
            bookings: await Booking.countDocuments({ user: user._id }),
            reviews: await Review.countDocuments({ user: user._id }),
            favorites: await Favorite.countDocuments({ user: user._id })
        };
        const recentActivity = await Activity.find({ user: user._id })
            .sort('-createdAt')
            .limit(5);
        // Find earliest activity date for this user
        const earliestBooking = await Booking.findOne({ user: user._id }).sort('createdAt');
        const earliestReview = await Review.findOne({ user: user._id }).sort('createdAt');
        const earliestFavorite = await Favorite.findOne({ user: user._id }).sort('createdAt');
        let minDate = new Date();
        if (earliestBooking && earliestBooking.createdAt < minDate) minDate = earliestBooking.createdAt;
        if (earliestReview && earliestReview.createdAt < minDate) minDate = earliestReview.createdAt;
        if (earliestFavorite && earliestFavorite.createdAt < minDate) minDate = earliestFavorite.createdAt;
        // If no activity, default to 12 months ago
        if (!earliestBooking && !earliestReview && !earliestFavorite) {
          minDate = new Date();
          minDate.setMonth(minDate.getMonth() - 11);
        }
        // Generate months array from minDate to now
        const months = [];
        const now = new Date();
        let d = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        while (d <= now) {
          months.push({
            label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
            year: d.getFullYear(),
            month: d.getMonth()
          });
          d.setMonth(d.getMonth() + 1);
        }
        // Bookings per month
        const bookingsPerMonth = await Booking.aggregate([
            { $match: { user: user._id } },
            { $group: {
                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                count: { $sum: 1 }
            } }
        ]);
        // Reviews per month
        const reviewsPerMonth = await Review.aggregate([
            { $match: { user: user._id } },
            { $group: {
                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                count: { $sum: 1 }
            } }
        ]);
        // Favorites per month
        const favoritesPerMonth = await Favorite.aggregate([
            { $match: { user: user._id } },
            { $group: {
                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                count: { $sum: 1 }
            } }
        ]);
        // Format chart data
        const bookingsData = months.map(m => {
            const found = bookingsPerMonth.find(b => b._id.year === m.year && b._id.month === m.month + 1);
            return found ? found.count : 0;
        });
        const reviewsData = months.map(m => {
            const found = reviewsPerMonth.find(b => b._id.year === m.year && b._id.month === m.month + 1);
            return found ? found.count : 0;
        });
        const favoritesData = months.map(m => {
            const found = favoritesPerMonth.find(b => b._id.year === m.year && b._id.month === m.month + 1);
            return found ? found.count : 0;
        });
        // Comparative chart data for user profile
        const bookingsVsReviews = {
            labels: ['Bookings', 'Reviews'],
            data: [userStats.bookings, userStats.reviews]
        };
        const bookingsVsFavorites = {
            labels: ['Bookings', 'Favorites'],
            data: [userStats.bookings, userStats.favorites]
        };
        const reviewsVsFavorites = {
            labels: ['Reviews', 'Favorites'],
            data: [userStats.reviews, userStats.favorites]
        };
        const chartData = {
            months: months.map(m => m.label),
            bookingsData,
            reviewsData,
            favoritesData,
            comparisons: {
                bookingsVsReviews,
                bookingsVsFavorites,
                reviewsVsFavorites
            }
        };
        res.render('users/profile', {
            title: 'My Profile - KitchenLink',
            user,
            userStats,
            recentActivity,
            chartData
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading profile');
        res.redirect('/');
    }
});

// Update user profile
router.post('/profile', isAuthenticated, upload.single('profileImage'), async (req, res) => {
    try {
        const { name, phone, businessName } = req.body;
        const updateData = { name, phone };

        if (businessName) {
            updateData.businessName = businessName;
        }

        if (req.file) {
            updateData.profileImage = '/uploads/profile-images/' + req.file.filename;
        }

        await User.findByIdAndUpdate(req.session.user.id, updateData);
        req.flash('success', 'Profile updated successfully');
        res.redirect('/users/profile');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error updating profile');
        res.redirect('/users/profile');
    }
});

// Change password
router.post('/change-password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (newPassword !== confirmPassword) {
            req.flash('error', 'New passwords do not match');
            return res.redirect('/users/profile');
        }

        const user = await User.findById(req.session.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            req.flash('error', 'Current password is incorrect');
            return res.redirect('/users/profile');
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        req.flash('success', 'Password changed successfully');
        res.redirect('/users/profile');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error changing password');
        res.redirect('/users/profile');
    }
});

// Update notification settings
router.post('/notifications', isAuthenticated, async (req, res) => {
    try {
        const { emailNotifications, bookingReminders, promotionalEmails } = req.body;
        
        await User.findByIdAndUpdate(req.session.user.id, {
            settings: {
                emailNotifications: emailNotifications === 'on',
                bookingReminders: bookingReminders === 'on',
                promotionalEmails: promotionalEmails === 'on'
            }
        });

        req.flash('success', 'Notification settings updated');
        res.redirect('/users/profile');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error updating notification settings');
        res.redirect('/users/profile');
    }
});

// Get user bookings
router.get('/bookings', notOwner, isAuthenticated, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.session.user.id })
            .populate('kitchen')
            .sort('-createdAt');

        res.render('users/my-bookings', {
            title: 'My Bookings - KitchenLink',
            bookings
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading bookings');
        res.redirect('/users/profile');
    }
});

// Get user kitchens (for providers)
router.get('/kitchens', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.role !== 'provider') {
            req.flash('error', 'Access denied');
            return res.redirect('/users/profile');
        }

        const kitchens = await Kitchen.find({ provider: req.session.user.id })
            .sort('-createdAt');

        res.render('users/kitchens', {
            title: 'My Kitchens - KitchenLink',
            kitchens
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading kitchens');
        res.redirect('/users/profile');
    }
});

// Admin dashboard
router.get('/dashboard', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const kitchenCount = await Kitchen.countDocuments();
        const bookingCount = await Booking.countDocuments();
        const users = await User.find().sort('-createdAt').limit(5);
        const kitchens = await Kitchen.find().sort('-createdAt').limit(5);
        // Chart Data: show total counts for all time
        const totalUsers = await User.countDocuments();
        const totalKitchens = await Kitchen.countDocuments();
        const totalBookings = await Booking.countDocuments();
        // User role distribution
        const roleAgg = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);
        const chartData = {
            usersVsKitchens: {
                labels: ['Users', 'Kitchens'],
                data: [totalUsers, totalKitchens]
            },
            usersVsBookings: {
                labels: ['Users', 'Bookings'],
                data: [totalUsers, totalBookings]
            },
            kitchensVsBookings: {
                labels: ['Kitchens', 'Bookings'],
                data: [totalKitchens, totalBookings]
            },
            roleLabels: roleAgg.map(r => r._id),
            roleCounts: roleAgg.map(r => r.count)
        };
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            userCount,
            kitchenCount,
            bookingCount,
            users,
            kitchens,
            chartData,
            layout: 'admin'
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading admin dashboard');
        res.redirect('/');
    }
});
// Kitchen owner dashboard
router.get('/owner-dashboard', isAuthenticated, isOwner, async (req, res) => {
    try {
        const kitchens = await Kitchen.find({ owner: req.session.user.id }).sort('-createdAt');
        const kitchenIds = kitchens.map(k => k._id);
        const bookings = await Booking.find({ kitchen: { $in: kitchenIds } }).populate('kitchen').sort('-createdAt').limit(10);
        // Stats
        const totalKitchens = kitchens.length;
        const totalBookings = await Booking.countDocuments({ kitchen: { $in: kitchenIds } });
        const totalEarningsAgg = await Booking.aggregate([
            { $match: { kitchen: { $in: kitchenIds }, status: 'approved' } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalEarnings = totalEarningsAgg[0] ? totalEarningsAgg[0].total : 0;
        const kitchenStats = { totalKitchens, totalBookings, totalEarnings };
        // Chart Data
        const now = new Date();
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
                year: d.getFullYear(),
                month: d.getMonth()
            });
        }
        // Bookings per month
        const bookingsPerMonth = await Booking.aggregate([
            { $match: { kitchen: { $in: kitchenIds } } },
            { $group: {
                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                count: { $sum: 1 }
            } }
        ]);
        // Earnings per month
        const earningsPerMonth = await Booking.aggregate([
            { $match: { kitchen: { $in: kitchenIds }, status: 'approved' } },
            { $group: {
                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                total: { $sum: "$totalAmount" }
            } }
        ]);
        // Booking status distribution
        const statusAgg = await Booking.aggregate([
            { $match: { kitchen: { $in: kitchenIds } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        // Format chart data
        const bookingsData = months.map(m => {
            const found = bookingsPerMonth.find(b => b._id.year === m.year && b._id.month === m.month + 1);
            return found ? found.count : 0;
        });
        const earningsData = months.map(m => {
            const found = earningsPerMonth.find(b => b._id.year === m.year && b._id.month === m.month + 1);
            return found ? found.total : 0;
        });
        const statusLabels = statusAgg.map(s => s._id);
        const statusCounts = statusAgg.map(s => s.count);
        // Comparative chart data for owner (like admin dashboard)
        const kitchensVsBookings = {
            labels: ['Kitchens', 'Bookings'],
            data: [totalKitchens, totalBookings]
        };
        const kitchensVsEarnings = {
            labels: ['Kitchens', 'Earnings (Ksh)'],
            data: [totalKitchens, Number(totalEarnings)]
        };
        const bookingsVsEarnings = {
            labels: ['Bookings', 'Earnings (Ksh)'],
            data: [totalBookings, Number(totalEarnings)]
        };
        const chartData = {
            kitchensVsBookings,
            kitchensVsEarnings,
            bookingsVsEarnings,
            statusLabels,
            statusCounts
        };
        res.render('owner/dashboard', {
            title: 'Kitchen Owner Dashboard',
            kitchens,
            bookings,
            kitchenStats,
            chartData,
            layout: 'owner'
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading owner dashboard');
        res.redirect('/');
    }
});

// List all users (admin)
router.get('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await User.find().sort('-createdAt');
        res.render('admin/users', {
            title: 'Manage Users',
            users,
            layout: 'admin'
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading users');
        res.redirect('/users/dashboard');
    }
});

// Edit user role (admin)
router.post('/admin/users/:id/role', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        await User.findByIdAndUpdate(req.params.id, { role });
        req.flash('success', 'User role updated');
        res.redirect('/users/admin/users');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error updating user role');
        res.redirect('/users/admin/users');
    }
});

// Delete user (admin)
router.post('/admin/users/:id/delete', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        req.flash('success', 'User deleted');
        res.redirect('/users/admin/users');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error deleting user');
        res.redirect('/users/admin/users');
    }
});

// List all kitchens (admin)
router.get('/admin/kitchens', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const kitchens = await Kitchen.find().populate('owner', 'name email').sort('-createdAt');
        res.render('admin/kitchens', {
            title: 'Manage Kitchens',
            kitchens,
            layout: 'admin'
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading kitchens');
        res.redirect('/users/dashboard');
    }
});

// Edit kitchen page (admin)
router.get('/admin/kitchens/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const kitchen = await Kitchen.findById(req.params.id);
        if (!kitchen) {
            req.flash('error', 'Kitchen not found');
            return res.redirect('/users/admin/kitchens');
        }
        res.render('admin/edit-kitchen', {
            title: 'Edit Kitchen',
            kitchen,
            layout: 'admin'
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading kitchen');
        res.redirect('/users/admin/kitchens');
    }
});

// Edit kitchen submit (admin)
router.post('/admin/kitchens/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
    try {
        let { name, description, location, latitude, longitude, capacity, kitchenType, amenities, hourlyRate, availability, rules } = req.body;
        // Validate latitude/longitude
        if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
            req.flash('error', 'Latitude and longitude are required and must be valid numbers.');
            return res.redirect('back');
        }
        availability = availability === 'on' ? true : false;
        await Kitchen.findByIdAndUpdate(req.params.id, {
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
        });
        req.flash('success', 'Kitchen updated');
        res.redirect('/users/admin/kitchens');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error updating kitchen');
        res.redirect('/users/admin/kitchens');
    }
});

// Delete kitchen (admin)
router.post('/admin/kitchens/:id/delete', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await Kitchen.findByIdAndDelete(req.params.id);
        req.flash('success', 'Kitchen deleted');
        res.redirect('/users/admin/kitchens');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error deleting kitchen');
        res.redirect('/users/admin/kitchens');
    }
});

// List bookings for owner's kitchens
router.get('/owner-bookings', isAuthenticated, isOwner, async (req, res) => {
    try {
        const kitchens = await Kitchen.find({ owner: req.session.user.id });
        const bookings = await Booking.find({ kitchen: { $in: kitchens.map(k => k._id) } })
            .populate('kitchen user')
            .sort('-createdAt');
        res.render('owner/bookings', {
            title: 'Manage Bookings',
            bookings,
            layout: 'owner'
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading bookings');
        res.redirect('/users/owner-dashboard');
    }
});

// Approve booking (owner)
router.post('/owner-bookings/:id/approve', isAuthenticated, isOwner, async (req, res) => {
    try {
        await Booking.findByIdAndUpdate(req.params.id, { status: 'approved' });
        req.flash('success', 'Booking approved');
        res.redirect('/users/owner-bookings');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error approving booking');
        res.redirect('/users/owner-bookings');
    }
});

// Reject booking (owner)
router.post('/owner-bookings/:id/reject', isAuthenticated, isOwner, async (req, res) => {
    try {
        await Booking.findByIdAndUpdate(req.params.id, { status: 'rejected' });
        req.flash('success', 'Booking rejected');
        res.redirect('/users/owner-bookings');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error rejecting booking');
        res.redirect('/users/owner-bookings');
    }
});

// List owner's kitchens
router.get('/owner-kitchens', isAuthenticated, isOwner, async (req, res) => {
    try {
        const kitchens = await Kitchen.find({ owner: req.session.user.id }).sort('-createdAt');
        res.render('owner/kitchens', {
            title: 'My Kitchens',
            kitchens,
            layout: 'owner'
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading kitchens');
        res.redirect('/users/owner-dashboard');
    }
});

// Add kitchen page (owner)
router.get('/owner-kitchens/new', isAuthenticated, isOwner, (req, res) => {
    res.render('owner/new-kitchen', {
        title: 'Add Kitchen',
        layout: 'owner'
    });
});

// Add kitchen submit (owner)
router.post('/owner-kitchens/new', isAuthenticated, isOwner, ownerKitchenUpload.array('images', 5), async (req, res) => {
    try {
        let { name, description, location, latitude, longitude, capacity, kitchenType, amenities, hourlyRate, availability, rules } = req.body;
        // Validate latitude/longitude
        if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
            req.flash('error', 'Latitude and longitude are required and must be valid numbers.');
            return res.redirect('back');
        }
        const images = req.files ? req.files.map(f => '/uploads/kitchen-images/' + f.filename) : [];
        availability = availability === 'on' ? true : false;
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
            rules: rules ? rules.split('\n').map(rule => rule.trim()).filter(rule => rule) : [],
            owner: req.session.user.id,
            images
        });
        await kitchen.save();
        req.flash('success', 'Kitchen added');
        res.redirect('/users/owner-kitchens');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error adding kitchen');
        res.redirect('/users/owner-kitchens');
    }
});

// Edit kitchen page (owner)
router.get('/owner-kitchens/:id/edit', isAuthenticated, isOwner, async (req, res) => {
    try {
        const kitchen = await Kitchen.findOne({ _id: req.params.id, owner: req.session.user.id });
        if (!kitchen) {
            req.flash('error', 'Kitchen not found');
            return res.redirect('/users/owner-kitchens');
        }
        res.render('owner/edit-kitchen', {
            title: 'Edit Kitchen',
            kitchen,
            layout: 'owner'
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading kitchen');
        res.redirect('/users/owner-kitchens');
    }
});

// Edit kitchen submit (owner)
router.post('/owner-kitchens/:id/edit', isAuthenticated, isOwner, ownerKitchenUpload.array('images', 5), async (req, res) => {
    try {
        let { name, description, location, latitude, longitude, capacity, kitchenType, amenities, hourlyRate, availability, rules } = req.body;
        // Validate latitude/longitude
        if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
            req.flash('error', 'Latitude and longitude are required and must be valid numbers.');
            return res.redirect('back');
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
        await Kitchen.findOneAndUpdate({ _id: req.params.id, owner: req.session.user.id }, update);
        req.flash('success', 'Kitchen updated');
        res.redirect('/users/owner-kitchens');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error updating kitchen');
        res.redirect('/users/owner-kitchens');
    }
});

// Delete kitchen (owner)
router.post('/owner-kitchens/:id/delete', isAuthenticated, isOwner, async (req, res) => {
    try {
        await Kitchen.findOneAndDelete({ _id: req.params.id, owner: req.session.user.id });
        req.flash('success', 'Kitchen deleted');
        res.redirect('/users/owner-kitchens');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error deleting kitchen');
        res.redirect('/users/owner-kitchens');
    }
});

// Remove image from kitchen (owner)
router.post('/owner-kitchens/:id/remove-image', isAuthenticated, isOwner, async (req, res) => {
    try {
        const kitchen = await Kitchen.findOne({ _id: req.params.id, owner: req.session.user.id });
        if (!kitchen) {
            req.flash('error', 'Kitchen not found');
            return res.redirect('/users/owner-kitchens');
        }
        const imageToRemove = req.body.image;
        // Remove from images array
        kitchen.images = kitchen.images.filter(img => img !== imageToRemove);
        await kitchen.save();
        // Delete file from disk if it exists and is not a default image
        if (imageToRemove && imageToRemove.startsWith('/uploads/')) {
            const filePath = require('path').join(__dirname, '../public', imageToRemove);
            fs.unlink(filePath, err => { /* ignore errors if file doesn't exist */ });
        }
        req.flash('success', 'Image removed');
        res.redirect(`/users/owner-kitchens/${kitchen._id}/edit`);
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error removing image');
        res.redirect('/users/owner-kitchens');
    }
});

module.exports = router; 