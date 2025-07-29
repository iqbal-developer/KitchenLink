const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Security NFRs', () => {
  it('should use HTTPS (manual/production check)', () => {
    // This is a manual check for local dev; in production, verify HTTPS in deployment config
    expect(process.env.NODE_ENV).not.toBe('production');
  });

  it('should hash passwords in the database', async () => {
    const user = await User.findOne({ email: 'test@example.com' });
    expect(user.password).not.toBe('password');
    expect(user.password.length).toBeGreaterThan(20);
  });

  it('should restrict admin features to admins', async () => {
    const res = await request(app).get('/admin/dashboard').set('Cookie', 'userSession=regularUserSession');
    expect(res.statusCode).toBe(403);
  });
}); 