const fetch = require('node-fetch');
const baseUrl = 'https://kitchenlink-production.up.railway.app';

describe('Usability Tests', () => {
  test('Homepage contains KitchenLink title or text', async () => {
    const res = await fetch(`${baseUrl}`);
    const html = await res.text();
    expect(html).toMatch(/KitchenLink/i);
  });

  test('Login form is present', async () => {
    const res = await fetch(`${baseUrl}/auth/login`);
    const html = await res.text();
    expect(html).toMatch(/<form[^>]*action="\/auth\/login"/);
  });

  test('Register form is present', async () => {
    const res = await fetch(`${baseUrl}/auth/register`);
    const html = await res.text();
    expect(html).toMatch(/<form[^>]*action="\/auth\/register"/);
  });

  test('Page contains navigation links', async () => {
    const res = await fetch(`${baseUrl}`);
    const html = await res.text();
    expect(html).toMatch(/<nav/i);
    expect(html).toMatch(/href="\/auth\/login"/);
    expect(html).toMatch(/href="\/auth\/register"/);
  });

  test('Homepage contains a call to action', async () => {
    const res = await fetch(`${baseUrl}`);
    const html = await res.text();
    expect(html).toMatch(/book (a )?kitchen/i);
  });
});
