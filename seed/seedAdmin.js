// seed/seedAdmin.js

if (process.env.NODE_ENV === 'production') {
  console.log("Seeding database on Railway...");
}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// --- USERS ---
const users = [
  {
    name: "Admin User",
    email: "admin@kitchenlink.com",
    password: bcrypt.hashSync("AdminPass123", 10),
    role: "admin"
  },
  {
    name: "Olivia Kitchen Owner",
    email: "olivia.owner@kitchenlink.com",
    password: bcrypt.hashSync("OwnerPass123", 10),
    role: "owner"
  },
  {
    name: "Oscar Kitchen Owner",
    email: "oscar.owner@kitchenlink.com",
    password: bcrypt.hashSync("OwnerPass123", 10),
    role: "owner"
  },
  {
    name: "Uma User",
    email: "uma.user@kitchenlink.com",
    password: bcrypt.hashSync("UserPass123", 10),
    role: "user"
  },
  {
    name: "Umar User",
    email: "umar.user@kitchenlink.com",
    password: bcrypt.hashSync("UserPass123", 10),
    role: "user"
  },
  {
    name: "Usha User",
    email: "usha.user@kitchenlink.com",
    password: bcrypt.hashSync("UserPass123", 10),
    role: "user"
  }
];

// --- KITCHENS ---
const kitchens = [
  {
    name: "Olivia Commercial Kitchen",
    description: "Fully equipped commercial kitchen ideal for catering and events.",
    location: "Nairobi, Kenya",
    latitude: -1.286389,
    longitude: 36.817223,
    capacity: 50,
    kitchenType: "commercial",
    amenities: [
      { name: "Oven", description: "Industrial convection oven", pricePerHour: 500 },
      { name: "Fridge", description: "Large double-door fridge", pricePerHour: 300 },
      { name: "Freezer", description: "Walk-in freezer", pricePerHour: 400 }
    ],
    hourlyRate: 1500,
    availability: true,
    images: ["/images/kitchens/olivia1.jpg", "/images/kitchens/olivia2.jpg"],
    rules: ["No smoking", "Clean after use", "Report any damages"]
  },
  {
    name: "Oscar Home Kitchen",
    description: "Cozy home-style kitchen suitable for small-scale baking or cooking.",
    location: "Mombasa, Kenya",
    latitude: -4.043477,
    longitude: 39.668206,
    capacity: 10,
    kitchenType: "home",
    amenities: [
      { name: "Gas Stove", description: "4-burner gas stove", pricePerHour: 200 },
      { name: "Microwave", description: "Standard microwave", pricePerHour: 100 }
    ],
    hourlyRate: 500,
    availability: true,
    images: ["/images/kitchens/oscar1.jpg"],
    rules: ["No loud music", "Keep it tidy"]
  },
  {
    name: "Industrial Food Prep Hub",
    description: "Large-scale industrial kitchen for bulk meal preparation.",
    location: "Kisumu, Kenya",
    latitude: -0.091702,
    longitude: 34.767956,
    capacity: 100,
    kitchenType: "industrial",
    amenities: [
      { name: "Blast Chiller", description: "Rapid cooling for large batches", pricePerHour: 800 },
      { name: "Grill", description: "Heavy-duty grilling station", pricePerHour: 500 }
    ],
    hourlyRate: 2500,
    availability: true,
    images: ["/images/kitchens/industrial1.jpg"],
    rules: ["Safety gear required", "Authorized staff only", "Follow hygiene protocols"]
  }
];

// --- BOOKINGS ---
const bookings = [
  {
    userEmail: "uma.user@kitchenlink.com",
    kitchenName: "Olivia Commercial Kitchen",
    date: new Date(),
    startTime: "10:00",
    endTime: "14:00",
    guests: 5,
    totalCost: 6000,
    status: "confirmed"
  },
  {
    userEmail: "umar.user@kitchenlink.com",
    kitchenName: "Oscar Home Kitchen",
    date: new Date(),
    startTime: "09:00",
    endTime: "11:00",
    guests: 2,
    totalCost: 1000,
    status: "confirmed"
  },
  {
    userEmail: "usha.user@kitchenlink.com",
    kitchenName: "Industrial Food Prep Hub",
    date: new Date(),
    startTime: "12:00",
    endTime: "18:00",
    guests: 20,
    totalCost: 15000,
    status: "pending"
  },
  {
    userEmail: "uma.user@kitchenlink.com",
    kitchenName: "Oscar Home Kitchen",
    date: new Date(),
    startTime: "14:00",
    endTime: "17:00",
    guests: 3,
    totalCost: 1500,
    status: "confirmed"
  },
  {
    userEmail: "umar.user@kitchenlink.com",
    kitchenName: "Olivia Commercial Kitchen",
    date: new Date(),
    startTime: "08:00",
    endTime: "12:00",
    guests: 4,
    totalCost: 6000,
    status: "cancelled"
  },
  {
    userEmail: "usha.user@kitchenlink.com",
    kitchenName: "Industrial Food Prep Hub",
    date: new Date(),
    startTime: "09:00",
    endTime: "15:00",
    guests: 10,
    totalCost: 12000,
    status: "confirmed"
  }
];

// --- REVIEWS (each user rates a kitchen) ---
const reviews = [
  {
    userEmail: "uma.user@kitchenlink.com",
    kitchenName: "Olivia Commercial Kitchen",
    rating: 5,
    comment: "Fantastic kitchen! Very clean and fully equipped."
  },
  {
    userEmail: "umar.user@kitchenlink.com",
    kitchenName: "Oscar Home Kitchen",
    rating: 4,
    comment: "Cozy and affordable, but limited space."
  },
  {
    userEmail: "usha.user@kitchenlink.com",
    kitchenName: "Industrial Food Prep Hub",
    rating: 5,
    comment: "Perfect for our catering business bulk prep."
  }
];

// --- FAVORITES (users saving kitchens) ---
const favorites = [
  { userEmail: "uma.user@kitchenlink.com", kitchenName: "Oscar Home Kitchen" },
  { userEmail: "umar.user@kitchenlink.com", kitchenName: "Olivia Commercial Kitchen" },
  { userEmail: "usha.user@kitchenlink.com", kitchenName: "Industrial Food Prep Hub" }
];

// --- Helper to make dates look recent ---
const SEED_TODAY = new Date();
function randomRecentDate() {
  const daysAgo = Math.floor(Math.random() * 14);
  const d = new Date(SEED_TODAY);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

// --- SEED SCRIPT ---
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
    const ownerEmail = i === 0 ? "olivia.owner@kitchenlink.com" :
                       i === 1 ? "oscar.owner@kitchenlink.com" :
                                 "olivia.owner@kitchenlink.com"; // Olivia owns Industrial too
    const k = new Kitchen({
      ...kitchens[i],
      owner: userDocs[ownerEmail]._id,
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
    console.log(`Created booking for ${b.userEmail} at ${b.kitchenName}`);
  }

  for (const r of reviews) {
    const user = userDocs[r.userEmail];
    const kitchen = kitchenDocs[r.kitchenName];
    if (!user || !kitchen) continue;
    const review = new Review({
      user: user._id,
      kitchen: kitchen._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: randomRecentDate()
    });
    await review.save();
    console.log(`Added review by ${r.userEmail} for ${r.kitchenName}`);
  }

  for (const f of favorites) {
    const user = userDocs[f.userEmail];
    const kitchen = kitchenDocs[f.kitchenName];
    if (!user || !kitchen) continue;
    const favorite = new Favorite({
      user: user._id,
      kitchen: kitchen._id,
      createdAt: randomRecentDate()
    });
    await favorite.save();
    console.log(`Added favorite: ${f.kitchenName} for ${f.userEmail}`);
  }

  console.log('✅ Seeding complete.');
  await mongoose.disconnect();
}

seedDatabase().catch(err => {
  console.error('❌ Seed error:', err);
  mongoose.disconnect();
});
