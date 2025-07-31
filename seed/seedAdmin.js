// seedAdmin.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Kitchen = require('../models/Kitchen');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');
const Activity = require('../models/Activity');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:sAacdlHgAoLCBUqrqBHkoTKAPPshleLm@switchyard.proxy.rlwy.net:57608';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Mongo connection error:', err);
    process.exit(1);
  }
};

const clearData = async () => {
  await User.deleteMany({});
  await Kitchen.deleteMany({});
  await Booking.deleteMany({});
  await Review.deleteMany({});
  await Favorite.deleteMany({});
  await Activity.deleteMany({});
};

const seedData = async () => {
  try {
    // Seed Users
    const users = await User.insertMany([
      // Admin
      { name: 'Admin User', email: 'admin@example.com', role: 'admin', password: '$2b$12$UqAv8ADHjVRpKdpCLL.frODT8ztGqF/tdLamPX80aEN6tNjC/t.Rq' },
      // Kitchen Owners
      { name: 'Owner One', email: 'owner1@example.com', role: 'owner', password: '$2b$12$UgzRPKhmvEbKuqhUDgnOYOJoaDmbXNH8rUNzbDTjNYyf91dKzGy12' },
      { name: 'Owner Two', email: 'owner2@example.com', role: 'owner', password: '$2b$12$7Zu94XqYOXjRzBikHw5vFegIuyM98OdUW0YcEkiB/Hd2Z/PyqHb/O' },
      { name: 'Owner Three', email: 'owner3@example.com', role: 'owner', password: '$2b$12$2FPCHFWW.gofuGsgAOK2ee5Q.fEim4JuPDB09LH2q/LLrRjzalb8O' },
      { name: 'Owner Four', email: 'owner4@example.com', role: 'owner', password: '$2b$12$9UirhPEVM.5nwMkMi3iv.O2yc9b99w8tCzqJ5Fk61yGG4N19BIDKi' },
      // Users
      { name: 'User One', email: 'user1@example.com', role: 'user', password: '$2b$12$.WM5gCfxs/vI8Sbqlm9iEuQhfQHVU7U3C8WDYZCcFPGCskOhzgBxG' },
      { name: 'User Two', email: 'user2@example.com', role: 'user', password: '$2b$12$Y62Lk.ZJCJYJDQk9yzc/tOA7eoBGKcKoPCAoE/ZC/2E9O27QmL9Gy' },
      { name: 'User Three', email: 'user3@example.com', role: 'user', password: '$2b$12$odD3mBoTozH3q3DigFSvheiLxFxdqQ5hs1AMhRlgP4WJXO0QIeb8O' },
      { name: 'User Four', email: 'user4@example.com', role: 'user', password: '$2b$12$qYmhle0ZkFP1JY7.WZV9C.mpORSgVDF98BH3PBFQXiCfJQmITLk6e' },
      { name: 'User Five', email: 'user5@example.com', role: 'user', password: '$2b$12$xAXqmSQZ8lbFDzwI1t5pqudTN2NSNXiA4AouHocRDO6laFTuSLcXi' },
      { name: 'User Six', email: 'user6@example.com', role: 'user', password: '$2b$12$jPP4MJgAwczQAXtu0lG4bOl0jG/ApVVTtbyqkNH5Y5jh7J0IUXQFK' }
    ]);

    // Seed Kitchens for each owner
    const kitchens = await Kitchen.insertMany(users.slice(1, 5).map((owner, i) => ({
      name: `Kitchen ${i + 1}`,
      description: `Modern kitchen space ${i + 1}`,
      location: `Location ${i + 1}`,
      capacity: 10 + i,
      kitchenType: 'shared',
      amenities: ['fridge', 'oven', 'grill'],
      hourlyRate: 500 + (i * 50),
      availability: true,
      owner: owner._id,
      images: [`image${i + 1}a.jpg`, `image${i + 1}b.jpg`],
      rules: ['Keep clean', 'No pets', 'Close door after use']
    })));

    // Seed Bookings
    const bookings = await Booking.insertMany([...Array(10)].map((_, i) => ({
      user: users[5 + (i % 6)]._id,
      kitchen: kitchens[i % kitchens.length]._id,
      date: new Date(),
      hoursBooked: 2 + (i % 3),
      status: 'confirmed'
    })));

    // Seed Reviews
    await Review.insertMany([...Array(10)].map((_, i) => ({
      user: users[5 + (i % 6)]._id,
      kitchen: kitchens[i % kitchens.length]._id,
      rating: 3 + (i % 3),
      comment: `Nice kitchen ${i}`
    })));

    // Seed Favorites
    await Favorite.insertMany([...Array(10)].map((_, i) => ({
      user: users[5 + (i % 6)]._id,
      kitchen: kitchens[i % kitchens.length]._id
    })));

    // Seed Activities
    await Activity.insertMany([...Array(10)].map((_, i) => ({
      user: users[5 + (i % 6)]._id,
      action: 'booked a kitchen',
      metadata: `Booking ${i}`
    })));

    console.log('✅ Database seeded successfully');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    mongoose.disconnect();
  }
};

(async () => {
  await connectDB();
  await clearData();
  await seedData();
})();
