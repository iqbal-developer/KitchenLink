const fetch = require('node-fetch');

describe('Availability Tests', () => {
  const baseUrl = 'https://kitchenlink-production.up.railway.app';

  test('Homepage returns 200 OK', async () => {
    const res = await fetch(`${baseUrl}`);
    expect(res.status).toBe(200);
  });

  test('Login page is reachable', async () => {
    const res = await fetch(`${baseUrl}/auth/login`);
    expect(res.status).toBe(200);
  });

  test('Register page is reachable', async () => {
    const res = await fetch(`${baseUrl}/auth/register`);
    expect(res.status).toBe(200);
  });

  test('Dashboard returns a response (unauthenticated)', async () => {
    const res = await fetch(`${baseUrl}/users/dashboard`);
    expect([200, 302, 401]).toContain(res.status); // Allow redirect or unauthorized
  });

  test('404 page on invalid route', async () => {
    const res = await fetch(`${baseUrl}/nonexistentpage`);
    expect(res.status).toBe(404);
  });
});
