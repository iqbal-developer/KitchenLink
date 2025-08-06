const fetch = require('node-fetch');

describe('Scalability Tests', () => {
  const baseUrl = 'https://kitchenlink-production.up.railway.app';

  test('Handles 100 concurrent requests', async () => {
    const requests = Array.from({ length: 100 }, () => fetch(baseUrl));
    const responses = await Promise.all(requests);
    responses.forEach(res => {
      expect(res.status).toBe(200);
    });
  });

  test('Handles 50 concurrent login page hits', async () => {
    const requests = Array.from({ length: 50 }, () => fetch(`${baseUrl}/auth/login`));
    const responses = await Promise.all(requests);
    responses.forEach(res => expect(res.status).toBe(200));
  });

  test('Handles 30 concurrent register page hits', async () => {
    const requests = Array.from({ length: 30 }, () => fetch(`${baseUrl}/auth/register`));
    const responses = await Promise.all(requests);
    responses.forEach(res => expect(res.status).toBe(200));
  });

  test('Handles mixed requests without failure', async () => {
    const endpoints = ['/', '/auth/login', '/auth/register', '/users/dashboard', '/nonexistent'];
    const requests = endpoints.flatMap(url =>
      Array.from({ length: 10 }, () => fetch(`${baseUrl}${url}`))
    );
    const responses = await Promise.all(requests);
    responses.forEach(res => expect([200, 302, 404, 401]).toContain(res.status));
  });

  test(
  'Handles sequential rapid requests',
  async () => {
    for (let i = 0; i < 20; i++) {
      const res = await fetch(baseUrl);
      expect(res.status).toBe(200);
    }
  },
  20000 // 20 seconds timeout
);

});
