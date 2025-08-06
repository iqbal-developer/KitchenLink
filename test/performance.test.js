const fetch = require('node-fetch');

describe('Performance Tests', () => {
  const baseUrl = 'https://kitchenlink-production.up.railway.app';

  test('Homepage responds within 2 seconds', async () => {
    const start = Date.now();
    const res = await fetch(baseUrl);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });

  test('Login page responds quickly', async () => {
    const start = Date.now();
    const res = await fetch(`${baseUrl}/login`);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });

  test('Dashboard page handles response time under 3 seconds', async () => {
    const start = Date.now();
    const res = await fetch(`${baseUrl}/dashboard`);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(3000);
  });

  test('Multiple requests don’t exceed 5 seconds each', async () => {
    const res = await Promise.all(
      Array.from({ length: 5 }, () => {
        const start = Date.now();
        return fetch(baseUrl).then(r => Date.now() - start);
      })
    );
    res.forEach(duration => expect(duration).toBeLessThan(5000));
  });

  test('404 page responds in reasonable time (<1500ms)', async () => {
    const start = Date.now();
    await fetch(`${baseUrl}/notfound`);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1500);
  });
});
