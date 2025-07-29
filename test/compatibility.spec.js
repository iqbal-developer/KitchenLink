const { test } = require('@playwright/test');

test.describe('Cross-browser compatibility', () => {
  for (const browserType of ['chromium', 'firefox', 'webkit']) {
    test(`works in ${browserType}`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto('http://localhost:3000');
      // Perform key actions and assertions
      await context.close();
    });
  }
});

test('Responsive layout on desktop and mobile', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
  // Assert layout is usable
  await page.setViewportSize({ width: 1280, height: 800 }); // Desktop
  // Assert layout is usable
}); 