// fixBookingData.js

const mongoose = require('mongoose');

// TODO: Replace with your actual MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/kitchenlink'; 

const bookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model('Booking', bookingSchema, 'bookings');

async function fixBookings() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const result = await Booking.updateMany(
    {
      $or: [
        { "payment.method": { $in: ["visa", "credit_card", "none"] } },
        { totalCost: { $exists: false } },
        { guests: { $exists: false } },
        { endTime: { $exists: false } },
        { startTime: { $exists: false } },
        { date: { $exists: false } }
      ]
    },
    {
      $set: {
        "payment.method": "stripe",
        totalCost: 0, // or a sensible default
        guests: 1,    // or a sensible default
        endTime: "00:00", // or a sensible default
        startTime: "00:00", // or a sensible default
        date: new Date("2000-01-01") // or a sensible default
      }
    }
  );

  console.log(`Updated ${result.nModified || result.modifiedCount} bookings.`);
  await mongoose.disconnect();
}

fixBookings().catch(err => {
  console.error('Error updating bookings:', err);
  process.exit(1);
});
