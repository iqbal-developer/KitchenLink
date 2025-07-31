// seed/seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Kitchen = require('../models/Kitchen');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');
const Activity = require('../models/Activity');

// Railway Mongo URI (fallback for local)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:sAacdlHgAoLCBUqrqBHkoTKAPPshleLm@switchyard.proxy.rlwy.net:57608';

if (!MONGO_URI) {
  console.error('❌ Missing Mongo URI');
  process.exit(1);
}

// Helper date generator
const SEED_TODAY = new Date();
function randomRecentDate() {
  const daysAgo = Math.floor(Math.random() * 14);
  const d = new Date(SEED_TODAY);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

// Sample Images for Kitchens
const kitchenImages = [
  '/images/kitchens/kitchen1.jpg',
  '/images/kitchens/kitchen2.jpg',
  '/images/kitchens/kitchen3.jpg',
  '/images/kitchens/kitchen4.jpg',
];

// Generate hashed password
const hashPassword = (plain) => bcrypt.hashSync(plain, 10);

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB (Railway)');

    // Clear old data
    await User.deleteMany({});
    await Kitchen.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await Favorite.deleteMany({});
    await Activity.deleteMany({});
    console.log('Old data cleared');

    // 1 Admin
    const admin = new User({
      name: 'Admin User',
      email: 'admin@kitchenlink.com',
      password: hashPassword('AdminPass123'),
      role: 'admin',
      createdAt: randomRecentDate()
    });
    await admin.save();
    console.log('Created admin');

    // 4 Kitchen Owners
    const owners = [];
    for (let i = 1; i <= 4; i++) {
      const owner = new User({
        name: `Owner ${i}`,
        email: `owner${i}@kitchenlink.com`,
        password: hashPassword(`OwnerPass${i}`),
        role: 'owner',
        createdAt: randomRecentDate()
      });
      await owner.save();
      owners.push(owner);
      console.log(`Created owner ${i}`);
    }

    // 6 Users
    const users = [];
    for (let i = 1; i <= 6; i++) {
      const user = new User({
        name: `User ${i}`,
        email: `user${i}@kitchenlink.com`,
        password: hashPassword(`UserPass${i}`),
        role: 'user',
        createdAt: randomRecentDate()
      });
      await user.save();
      users.push(user);
      console.log(`Created user ${i}`);
    }

    // Kitchens (each owner gets 1 kitchen)
    const kitchens = [];
    for (let i = 0; i < owners.length; i++) {
      const kitchen = new Kitchen({
        name: `Premium Kitchen ${i + 1}`,
        description: `State-of-the-art kitchen facility for chefs and bakers.`,
        location: `Nairobi Zone ${i + 1}`,
        capacity: 20 + i * 5,
        kitchenType: 'commercial',
        amenities: [
          { name: 'Oven', description: 'High-capacity oven', pricePerHour: 5 },
          { name: 'Fridge', description: 'Commercial-grade fridge', pricePerHour: 3 }
        ],
        hourlyRate: 50 + i * 10,
        availability: true,
        images: [kitchenImages[i]],
        owner: owners[i]._id,
        rules: ['No smoking', 'Clean after use'],
        createdAt: randomRecentDate()
      });
      await kitchen.save();
      kitchens.push(kitchen);
      console.log(`Created kitchen: ${kitchen.name}`);
    }

    // 10 Bookings
    const bookings = [];
    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length];
      const kitchen = kitchens[i % kitchens.length];
      const booking = new Booking({
        user: user._id,
        kitchen: kitchen._id,
        date: randomRecentDate(),
        startTime: '10:00',
        endTime: '14:00',
        guests: 5,
        totalCost: 200,
        status: 'confirmed',
        createdAt: randomRecentDate()
      });
      await booking.save();
      bookings.push(booking);
    }
    console.log('Created 10 bookings');

    // 10 Reviews
    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length];
      const kitchen = kitchens[i % kitchens.length];
      await new Review({
        user: user._id,
        kitchen: kitchen._id,
        rating: (i % 5) + 1,
        comment: `Great experience #${i + 1}`,
        createdAt: randomRecentDate()
      }).save();
    }
    console.log('Created 10 reviews');

    // 10 Favorites
    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length];
      const kitchen = kitchens[i % kitchens.length];
      await new Favorite({
        user: user._id,
        kitchen: kitchen._id,
        createdAt: randomRecentDate()
      }).save();
    }
    console.log('Created 10 favorites');

    // 10 Activities (mixed actions)
    const actions = ['booking', 'review', 'favorite'];
    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length];
      await new Activity({
        user: user._id,
        action: actions[i % actions.length],
        details: `Activity #${i + 1}`,
        createdAt: randomRecentDate()
      }).save();
    }
    console.log('Created 10 activities');

    console.log('✅ Seeding complete.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Seed error:', err);
    await mongoose.disconnect();
  }
}

seedDatabase();
