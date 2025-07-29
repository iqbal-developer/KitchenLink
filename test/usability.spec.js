const { test, expect } = require('@playwright/test');

test('User can register and book in 5 clicks', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Register');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  // Continue to booking and count clicks...
  // Assert booking confirmation
});

test('Navigation is simple and intuitive', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Simulate a new user flow to book a kitchen
  // Assert that user can complete the task without confusion
}); 