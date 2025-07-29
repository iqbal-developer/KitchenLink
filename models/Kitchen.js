const mongoose = require('mongoose');

const kitchenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    capacity: {
        type: Number,
        required: true
    },
    kitchenType: {
        type: String,
        enum: ['commercial', 'home', 'industrial'],
        required: true
    },
    amenities: [{
        name: String,
        description: String,
        pricePerHour: Number
    }],
    hourlyRate: {
        type: Number,
        required: true
    },
    availability: {
        type: Boolean,
        default: true
    },
    // Images: array of image URLs/paths
    images: [String],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rules: [{
        type: String,
        required: true
    }],
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate average rating before saving
kitchenSchema.pre('save', function(next) {
    if (this.reviews.length > 0) {
        this.averageRating = this.reviews.reduce((acc, curr) => acc + curr.rating, 0) / this.reviews.length;
    }
    next();
});

module.exports = mongoose.model('Kitchen', kitchenSchema); 