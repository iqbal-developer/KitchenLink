// seed/seedAdmin.js
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Kitchen = require('../models/Kitchen');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');

// Default to Railway proxy if local not provided
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://mongo:sAacdlHgAoLCBUqrqBHkoTKAPPshleLm@switchyard.proxy.rlwy.net:57608';

if (!MONGO_URI) {
  console.error('❌ No MongoDB connection string found.');
  process.exit(1);
}

console.log(`Seeding to: ${MONGO_URI}`);

// --- Sample Data ---
const users = [
  {
    name: 'Admin',
    email: 'admin@kitchenlink.com',
    password: 'admin123',
    role: 'admin',
    phone: '0700000000'
  },
  {
    name: 'Olivia Owner',
    email: 'olivia.owner@kitchenlink.com',
    password: 'owner123',
    role: 'owner',
    phone: '0711111111',
    businessName: 'Olivia Kitchens',
    businessType: 'Commercial'
  },
  {
    name: 'Oscar Owner',
    email: 'oscar.owner@kitchenlink.com',
    password: 'owner123',
    role: 'owner',
    phone: '0722222222',
    businessName: 'Oscar Foods',
    businessType: 'Home'
  },
  {
    name: 'Uma User',
    email: 'uma.user@kitchenlink.com',
    password: 'user123',
    role: 'user',
    phone: '0733333333'
  }
];

const kitchens = [
  {
    name: 'Olivia Commercial Kitchen',
    description: 'Fully equipped kitchen for events and catering.',
    location: 'Nairobi, Kenya',
    capacity: 20,
    kitchenType: 'commercial',
    amenities: ['Oven', 'Walk-in Fridge'],
    hourlyRate: 1500,
    availability: true,
    images: ['/images/hero-image.jpg'],
    rules: ['No smoking', 'Clean after use']
  },
  {
    name: 'Oscar Home Kitchen',
    description: 'Cozy private kitchen for small groups.',
    location: 'Westlands, Nairobi',
    capacity: 8,
    kitchenType: 'home',
    amenities: ['Microwave', 'Coffee Maker'],
    hourlyRate: 600,
    availability: true,
    images: ['/images/hero-image.jpg'],
    rules: ['No pets', 'No loud music']
  }
];

const bookings = [
  {
    userEmail: 'uma.user@kitchenlink.com',
    kitchenName: 'Olivia Commercial Kitchen',
    date: new Date(Date.now() + 2 * 86400000), // 2 days from now
    startTime: '10:00',
    endTime: '14:00',
    guests: 10,
    totalCost: 6000,
    status: 'confirmed'
  }
];

// --- Utility for recent dates ---
const SEED_TODAY = new Date();
function randomRecentDate() {
  const d = new Date(SEED_TODAY);
  d.setDate(d.getDate() - Math.floor(Math.random() * 14));
  return d;
}

// --- Seeding Function ---
async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const exists = await User.findOne({ email: 'admin@kitchenlink.com' });
    if (exists) {
      console.log('Database already seeded. Exiting.');
      return process.exit(0);
    }

    const userDocs = {};
    for (const u of users) {
      const user = await new User({ ...u, createdAt: randomRecentDate() }).save();
      userDocs[u.email] = user;
      console.log(`Created user: ${u.email}`);
    }

    const kitchenDocs = {};
    for (let i = 0; i < kitchens.length; i++) {
      const owner =
        i === 0
          ? userDocs['olivia.owner@kitchenlink.com']._id
          : userDocs['oscar.owner@kitchenlink.com']._id;
      const kitchen = await new Kitchen({
        ...kitchens[i],
        owner,
        createdAt: randomRecentDate()
      }).save();
      kitchenDocs[kitchen.name] = kitchen;
      console.log(`Created kitchen: ${kitchen.name}`);
    }

    for (const b of bookings) {
      const user = userDocs[b.userEmail];
      const kitchen = kitchenDocs[b.kitchenName];
      if (!user || !kitchen) continue;

      await new Booking({
        user: user._id,
        kitchen: kitchen._id,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        guests: b.guests,
        totalCost: b.totalCost,
        status: b.status,
        createdAt: randomRecentDate()
      }).save();

      console.log(`Created booking for ${b.userEmail}`);
    }

    console.log('✅ Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  } finally {
    mongoose.disconnect();
  }
}

seedDatabase();
