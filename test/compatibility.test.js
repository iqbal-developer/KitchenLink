const fetch = require('node-fetch');

describe('Compatibility Tests', () => {
  const baseUrl = 'https://kitchenlink-production.up.railway.app';

  test('Page loads with correct HTML content-type', async () => {
    const res = await fetch(baseUrl);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
  });

  test('Supports modern browsers (has meta viewport tag)', async () => {
    const res = await fetch(baseUrl);
    const html = await res.text();
    expect(html).toMatch(/<meta\s+name="viewport"/i);
  });

  test('CSS is loaded correctly', async () => {
    const res = await fetch(baseUrl);
    const html = await res.text();
    expect(html).toMatch(/<link[^>]+rel=["']stylesheet["']/i);
  });

  test('Contains favicon link', async () => {
    const res = await fetch(baseUrl);
    const html = await res.text();
    expect(html).toMatch(/<link[^>]+rel=["']icon["']/i);
  });

  test('JavaScript scripts are linked properly', async () => {
    const res = await fetch(baseUrl);
    const html = await res.text();
    expect(html).toMatch(/<script[^>]+src=["']/i);
  });
});
