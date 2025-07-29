const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    kitchen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Kitchen',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    guests: {
        type: Number,
        required: true,
        min: 1
    },
    totalCost: {
        type: Number,
        required: true
    },
    payment: {
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        method: {
            type: String,
            enum: ['paypal', 'mpesa', 'stripe'],
            default: 'mpesa'
        },
        transactionId: {
            type: String
        }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
bookingSchema.index({ kitchen: 1, date: 1, startTime: 1, endTime: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 