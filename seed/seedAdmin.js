// seed/seedAdmin.js
if (process.env.NODE_ENV === 'production') {
  console.log("Seeding database on Railway...");
}

const mongoose = require('mongoose');
const User = require('../models/User');
const Kitchen = require('../models/Kitchen');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing. Set it in Railway Variables.');
  process.exit(1);
}

// Import your sample data (users, kitchens, bookings) here
const users = [/* your users array as before */];
const kitchens = [/* your kitchens array as before */];
const bookings = [/* your bookings array as before */];

// Helper: create consistent recent dates
const SEED_TODAY = new Date();
function randomRecentDate() {
  const daysAgo = Math.floor(Math.random() * 14);
  const d = new Date(SEED_TODAY);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function seedDatabase() {
  await mongoose.connect(MONGO_URI);

  const alreadySeeded = await User.findOne({ email: 'admin@kitchenlink.com' });
  if (alreadySeeded) {
    console.log('ℹ️ Database already seeded, skipping.');
    await mongoose.disconnect();
    return;
  }

  console.log('🌱 Seeding data...');

  const userDocs = {};
  for (const u of users) {
    const user = new User({ ...u, createdAt: randomRecentDate() });
    await user.save();
    userDocs[user.email] = user;
    console.log(`Created user: ${u.email}`);
  }

  const kitchenDocs = {};
  for (let i = 0; i < kitchens.length; i++) {
    const k = new Kitchen({
      ...kitchens[i],
      owner: i === 0 ? userDocs['olivia.owner@kitchenlink.com']._id : userDocs['oscar.owner@kitchenlink.com']._id,
      createdAt: randomRecentDate()
    });
    await k.save();
    kitchenDocs[k.name] = k;
    console.log(`Created kitchen: ${k.name}`);
  }

  for (const b of bookings) {
    const user = userDocs[b.userEmail];
    const kitchen = kitchenDocs[b.kitchenName];
    if (!user || !kitchen) continue;
    const booking = new Booking({
      user: user._id,
      kitchen: kitchen._id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      guests: b.guests,
      totalCost: b.totalCost,
      status: b.status,
      createdAt: randomRecentDate()
    });
    await booking.save();
    console.log(`Created booking for ${b.userEmail}`);
  }

  console.log('✅ Seeding complete.');
  await mongoose.disconnect();
}

seedDatabase().catch(err => {
  console.error('❌ Seed error:', err);
  mongoose.disconnect();
});
