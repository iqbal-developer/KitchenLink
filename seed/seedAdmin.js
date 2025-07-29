const mongoose = require('mongoose');
const User = require('../models/User');
const Kitchen = require('../models/Kitchen');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://sahiniqbal054:sahiniqbal054@cluster0.rb3qei2.mongodb.net/kitchenlink';
// Sample data for seeding
// This data is used to populate the database with initial values for testing and development 

const users = [
  // Admins
  {
    name: 'Admin',
    email: 'admin@kitchenlink.com',
    password: 'admin123',
    role: 'admin',
    phone: '0700000000',
  },
  // Owners
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
  // Regular Users
  {
    name: 'Uma User',
    email: 'uma.user@kitchenlink.com',
    password: 'user123',
    role: 'user',
    phone: '0733333333',
  },
  {
    name: 'Umar User',
    email: 'umar.user@kitchenlink.com',
    password: 'user123',
    role: 'user',
    phone: '0744444444',
  },
  {
    name: 'Usha User',
    email: 'usha.user@kitchenlink.com',
    password: 'user123',
    role: 'user',
    phone: '0755555555',
  },
];

const kitchens = [
  {
    name: 'Olivia Commercial Kitchen',
    description: 'A modern, fully-equipped commercial kitchen in Nairobi.',
    location: 'Nairobi, Kenya',
    latitude: -1.286389,
    longitude: 36.817223,
    capacity: 20,
    kitchenType: 'commercial',
    amenities: [
      { name: 'Oven', description: 'Large convection oven', pricePerHour: 200 },
      { name: 'Fridge', description: 'Walk-in fridge', pricePerHour: 100 }
    ],
    hourlyRate: 1500,
    availability: true,
    images: ['/images/hero-image.jpg'],
    rules: ['No smoking', 'Clean after use'],
  },
  {
    name: 'Oscar Home Kitchen',
    description: 'Cozy home kitchen, perfect for small events.',
    location: 'Westlands, Nairobi',
    latitude: -1.2648,
    longitude: 36.8001,
    capacity: 8,
    kitchenType: 'home',
    amenities: [
      { name: 'Microwave', description: 'Standard microwave', pricePerHour: 50 },
      { name: 'Coffee Maker', description: 'Brews great coffee', pricePerHour: 30 }
    ],
    hourlyRate: 600,
    availability: true,
    images: ['/images/hero-image.jpg'],
    rules: ['No pets', 'No loud music'],
  },
];

const bookings = [
  // Uma books Olivia's kitchen
  {
    userEmail: 'uma.user@kitchenlink.com',
    kitchenName: 'Olivia Commercial Kitchen',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    startTime: '10:00',
    endTime: '14:00',
    guests: 10,
    totalCost: 6000,
    status: 'confirmed',
  },
  // Umar books Oscar's kitchen
  {
    userEmail: 'umar.user@kitchenlink.com',
    kitchenName: 'Oscar Home Kitchen',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    startTime: '12:00',
    endTime: '15:00',
    guests: 5,
    totalCost: 1800,
    status: 'pending',
  },
];

// Use a hardcoded 'today' date for consistent seeding
const SEED_TODAY = new Date();
function randomRecentDate() {
  const daysAgo = Math.floor(Math.random() * 14);
  const d = new Date(SEED_TODAY);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function seedAll() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  // Seed users
  const userDocs = {};
  for (const userData of users) {
    let user = await User.findOne({ email: userData.email });
    if (!user) {
      user = new User({ ...userData, createdAt: randomRecentDate() });
      await user.save();
      console.log('Created user:', user.email, 'Role:', user.role);
    } else {
      console.log('User already exists:', user.email);
    }
    userDocs[user.email] = user;
  }
  // Seed kitchens
  const kitchenDocs = {};
  for (let i = 0; i < kitchens.length; i++) {
    const kitchenData = { ...kitchens[i], createdAt: randomRecentDate() };
    // Assign owner
    kitchenData.owner = i === 0 ? userDocs['olivia.owner@kitchenlink.com']._id : userDocs['oscar.owner@kitchenlink.com']._id;
    let kitchen = await Kitchen.findOne({ name: kitchenData.name });
    if (!kitchen) {
      kitchen = new Kitchen(kitchenData);
      await kitchen.save();
      console.log('Created kitchen:', kitchen.name);
    } else {
      console.log('Kitchen already exists:', kitchen.name);
    }
    kitchenDocs[kitchen.name] = kitchen;
  }
  // Seed bookings
  for (const bookingData of bookings) {
    const user = userDocs[bookingData.userEmail];
    const kitchen = kitchenDocs[bookingData.kitchenName];
    if (!user || !kitchen) continue;
    // Check for existing booking
    const exists = await Booking.findOne({ user: user._id, kitchen: kitchen._id, date: bookingData.date });
    if (exists) {
      console.log('Booking already exists for', user.email, 'and', kitchen.name);
      continue;
    }
    const booking = new Booking({
      user: user._id,
      kitchen: kitchen._id,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      guests: bookingData.guests,
      totalCost: bookingData.totalCost,
      status: bookingData.status,
      createdAt: randomRecentDate()
    });
    await booking.save();
    console.log('Created booking for', user.email, 'at', kitchen.name);
  }
  // Seed bookings for user@gmail.com
  const userId = '687a2eec848980fc95f4dfc7';
  const userEmail = 'user@gmail.com';
  const user = await User.findOne({ _id: userId }) || await User.findOne({ email: userEmail });
  if (user) {
    const kitchenList = await Kitchen.find({});
    for (let i = 0; i < 3; i++) {
      const kitchen = kitchenList[i % kitchenList.length];
      const booking = new Booking({
        user: user._id,
        kitchen: kitchen._id,
        date: randomRecentDate(),
        startTime: '09:00',
        endTime: '12:00',
        guests: 2 + i,
        totalCost: 1000 + i * 500,
        status: i % 2 === 0 ? 'confirmed' : 'pending',
        createdAt: randomRecentDate()
      });
      await booking.save();
      console.log('Seeded booking for user@gmail.com at', kitchen.name);
    }
    // Seed reviews
    for (let i = 0; i < 3; i++) {
      const kitchen = kitchenList[i % kitchenList.length];
      const review = new Review({
        user: user._id,
        kitchen: kitchen._id,
        rating: 3 + (i % 3),
        comment: `Sample review ${i + 1} for ${kitchen.name}`,
        createdAt: randomRecentDate()
      });
      await review.save();
      console.log('Seeded review for user@gmail.com at', kitchen.name);
    }
    // Seed favorites
    for (let i = 0; i < 3; i++) {
      const kitchen = kitchenList[(i + 1) % kitchenList.length];
      const favorite = new Favorite({
        user: user._id,
        kitchen: kitchen._id,
        createdAt: randomRecentDate()
      });
      await favorite.save();
      console.log('Seeded favorite for user@gmail.com at', kitchen.name);
    }
  }
  mongoose.disconnect();
}

seedAll().catch(err => {
  console.error('Error seeding data:', err);
  mongoose.disconnect();
});

if (require.main === module && process.argv.includes('--print-dates')) {
  (async () => {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const users = await User.find({}, 'name email createdAt role');
    const kitchens = await Kitchen.find({}, 'name location createdAt');
    const bookings = await Booking.find({}, 'user kitchen createdAt date startTime endTime');
    console.log('USERS:');
    users.forEach(u => console.log(`${u.name} (${u.email}, ${u.role}): ${u.createdAt}`));
    console.log('\nKITCHENS:');
    kitchens.forEach(k => console.log(`${k.name} (${k.location}): ${k.createdAt}`));
    console.log('\nBOOKINGS:');
    for (const b of bookings) {
      const user = await User.findById(b.user);
      const kitchen = await Kitchen.findById(b.kitchen);
      console.log(`${user?.email || b.user} -> ${kitchen?.name || b.kitchen}: ${b.createdAt} (date: ${b.date}, ${b.startTime}-${b.endTime})`);
    }
    mongoose.disconnect();
  })();
} 