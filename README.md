# KitchenLink

KitchenLink is a web platform that connects food entrepreneurs with commercial kitchen spaces in Kenya. It provides a marketplace where kitchen owners can list their spaces and food businesses can find and book kitchen facilities.

## Tech Stack

**Frontend:**
- HTML5, CSS3
- Bootstrap 5
- JavaScript
- Handlebars.js (templating)
- Chart.js (interactive charts)
- Google Maps API (location visualization)

**Backend:**
- Node.js
- Express.js
- MongoDB
- Mongoose (ODM)

**Supporting Libraries & Tools:**
- Express-session (session management)
- Connect-flash (flash messages)
- Bcrypt (password hashing)
- Multer (file uploads)
- dotenv (environment variables)
- Seed scripts for demo/test data

## Features

- **User Authentication**
  - Sign up and login for both kitchen owners and food entrepreneurs
  - Secure password management
  - User profiles and dashboards

- **Kitchen Listings**
  - Detailed kitchen profiles with photos and amenities
  - Search and filter functionality
  - Location-based search with Google Maps integration
  - Availability calendar

- **Booking System**
  - Real-time availability checking
  - Instant booking confirmation
  - Booking management dashboard
  - Payment integration

- **User Dashboard & Analytics**
  - Manage listings (for kitchen owners)
  - Track bookings
  - View booking history
  - Update profile information
  - **Interactive charts**: Visualize your bookings, reviews, and favorites per month, plus all-time comparison stats

- **Owner Dashboard**
  - View total kitchens, bookings, and earnings
  - Comparative bar charts (Kitchens vs Bookings, Kitchens vs Earnings, Bookings vs Earnings)
  - Booking status distribution pie chart

- **Admin Dashboard**
  - View total users, kitchens, and bookings
  - Comparative bar charts (Users vs Kitchens, Users vs Bookings, Kitchens vs Bookings)
  - User role distribution pie chart
  - Recent users and kitchens

## Architecture: MVC Pattern

KitchenLink follows the **MVC (Model-View-Controller)** architectural pattern:

- **Models (`models/`)**: Define the data structure and handle database operations (e.g., User, Kitchen, Booking, Review, Favorite).
- **Views (`views/`)**: Handlebars templates for rendering HTML pages for users, owners, and admins.
- **Controllers (`routes/`)**: Express route handlers that process requests, interact with models, and render views or return JSON.

This separation makes the codebase organized, maintainable, and scalable.

## Demo Data & Seeding

To populate the app with demo data for testing charts and dashboards:

1. Edit `seed/seedAdmin.js` if you want to customize users or kitchens.
2. Run the seed script:
   ```bash
   node seed/seedAdmin.js
   ```
   This will create users, kitchens, bookings, reviews, and favorites with recent dates so charts display data.

## Google Maps Integration
- Kitchen listings and details include Google Maps for location visualization.
- Owners and admins can set kitchen locations using an interactive map in the add/edit forms.

## Troubleshooting

- **Charts not showing data?**
  - Make sure you have seeded data with recent dates (see above).
  - Ensure Chart.js is loaded before any inline scripts (see `views/layouts/main.hbs`).
  - If you see a `Chart is not defined` error, check the script order in your layout.
- **Avatar not showing?**
  - Add a `default-avatar.png` to `public/images/` for users without a profile image.
- **Favicon 404?**
  - Add a `favicon.ico` to your `public/` directory to remove the warning.

## Installation

1. Clone the repository:
   ```