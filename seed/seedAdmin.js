require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Kitchen = require('../models/Kitchen');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');
const Activity = require('../models/Activity');

const MONGO_URI = process.env.MONGO_URI || 'mongodb.railway.internal';

if (!MONGO_URI) {
  console.error('❌ Missing Mongo URI');
  process.exit(1);
}

const SEED_TODAY = new Date();
function randomRecentDate() {
  const daysAgo = Math.floor(Math.random() * 14);
  const d = new Date(SEED_TODAY);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

const kitchenImages = [
  '/images/kitchens/kitchen1.jpg',
  '/images/kitchens/kitchen2.jpg',
  '/images/kitchens/kitchen3.jpg',
  '/images/kitchens/kitchen4.jpg',
];

// Added Nairobi specific locations
const nairobiLocations = [
  'Kilimani', 'Westlands', 'Karen', 'Lavington', 'Upper Hill',
  'Ngong Road', 'Gigiri', 'Parklands', 'Spring Valley', 'Kileleshwa'
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}),
      Kitchen.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      Favorite.deleteMany({}),
      Activity.deleteMany({})
    ]);
    console.log('✅ Cleared existing data');

    // Admin
    const admin = new User({
      name: 'Admin User',
      email: 'admin@kitchenlink.com',
      password: 'AdminPass123',
      role: 'admin',
      createdAt: randomRecentDate()
    });
    await admin.save();
    console.log('✅ Created admin');

    // Kitchen Owners
    const owners = [];
    for (let i = 1; i <= 4; i++) {
      const owner = new User({
        name: `Owner ${i}`,
        email: `owner${i}@kitchenlink.com`,
        password: `OwnerPass${i}`,
        role: 'owner',
        createdAt: randomRecentDate()
      });
      await owner.save();
      owners.push(owner);
      console.log(`✅ Created owner ${i}`);
    }

    // Users
    const users = [];
    for (let i = 1; i <= 6; i++) {
      const user = new User({
        name: `User ${i}`,
        email: `user${i}@kitchenlink.com`,
        password: `UserPass${i}`,
        role: 'user',
        createdAt: randomRecentDate()
      });
      await user.save();
      users.push(user);
      console.log(`✅ Created user ${i}`);
    }

    // Kitchens (multiple per owner)
    const kitchens = [];
    const kitchenNamePrefixes = ['Gourmet', 'Chef\'s', 'Artisan', 'The Community', 'Pro-Chef'];
    const kitchenNameSuffixes = ['Hub', 'Studio', 'Works', 'Kitchens', 'Place'];

    for (let i = 0; i < owners.length; i++) {
      const numKitchens = 2; // Each owner has 2 kitchens
      for (let j = 0; j < numKitchens; j++) {
        const randomLocation = nairobiLocations[Math.floor(Math.random() * nairobiLocations.length)];
        const randomPrefix = kitchenNamePrefixes[Math.floor(Math.random() * kitchenNamePrefixes.length)];
        const randomSuffix = kitchenNameSuffixes[Math.floor(Math.random() * kitchenNameSuffixes.length)];
        
        const kitchenName = `${randomPrefix} ${randomLocation} ${randomSuffix}`;

        const kitchen = new Kitchen({
          name: kitchenName,
          description: `A well-equipped kitchen in ${randomLocation} perfect for culinary professionals and enthusiasts.`,
          location: randomLocation,
          capacity: 15 + i * 5 + j,
          kitchenType: 'commercial',
          amenities: [
            { name: 'Convection Oven', description: 'High-capacity commercial convection oven', pricePerHour: 7 },
            { name: 'Walk-in Freezer', description: 'Large walk-in freezer for bulk storage', pricePerHour: 5 },
            { name: 'Prep Tables', description: 'Stainless steel prep tables with ample space', pricePerHour: 3 },
            { name: 'Industrial Mixer', description: 'Heavy-duty industrial planetary mixer', pricePerHour: 6 }
          ],
          hourlyRate: 40 + i * 10 + j * 5,
          availability: true,
          images: [kitchenImages[(i + j) % kitchenImages.length]],
          owner: owners[i]._id,
          rules: ['No smoking', 'Clean after use', 'Respect others', 'Bookings are per hour'],
          createdAt: randomRecentDate()
        });
        await kitchen.save();
        kitchens.push(kitchen);
        console.log(`✅ Created kitchen: ${kitchen.name}`);
      }
    }

    // Bookings
    const bookings = [];
    for (let i = 0; i < 12; i++) {
      const user = users[i % users.length];
      const kitchen = kitchens[i % kitchens.length];
      const booking = new Booking({
        user: user._id,
        kitchen: kitchen._id,
        date: randomRecentDate(),
        startTime: '10:00',
        endTime: '14:00',
        guests: 5 + (i % 3),
        totalCost: 200 + i * 10,
        status: 'confirmed',
        createdAt: randomRecentDate()
      });
      await booking.save();
      bookings.push(booking);
    }
    console.log('✅ Created 12 bookings');

    // Reviews
    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length];
      const kitchen = kitchens[i % kitchens.length];
      await new Review({
        user: user._id,
        kitchen: kitchen._id,
        rating: (i % 5) + 1,
        comment: `Excellent experience #${i + 1} at this well-maintained kitchen.`,
        createdAt: randomRecentDate()
      }).save();
    }
    console.log('✅ Created 10 reviews');

    // Favorites
    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length];
      const kitchen = kitchens[(i + 2) % kitchens.length];
      await new Favorite({
        user: user._id,
        kitchen: kitchen._id,
        createdAt: randomRecentDate()
      }).save();
    }
    console.log('✅ Created 10 favorites');

    // Activities
    const actions = ['booking', 'review', 'favorite'];
    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length];
      await new Activity({
        user: user._id,
        action: actions[i % actions.length],
        details: `Activity log #${i + 1}`,
        createdAt: randomRecentDate()
      }).save();
    }
    console.log('✅ Created 10 activities');

    await mongoose.disconnect();
    console.log('🎉 Seeding complete and disconnected from MongoDB');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    await mongoose.disconnect();
  }
}

seedDatabase();