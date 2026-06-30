const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');

jest.setTimeout(30000);

describe('Auth Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.password).toBeUndefined();

      // Verify in DB
      const userInDb = await User.findOne({ email: newUser.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.name).toBe(newUser.name);
    });

    it('should fail if email already exists', async () => {
      const user = new User({
        name: 'Existing',
        email: 'testuser@example.com',
        password: 'password123',
        role: 'student'
      });
      await user.save();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another',
          email: 'testuser@example.com',
          password: 'password123',
          role: 'student'
        })
        .expect(400);

      expect(response.body.message).toMatch(/đã được sử dụng/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const user = new User({
        name: 'Login User',
        email: 'login@example.com',
        password: 'password123',
        role: 'student'
      });
      await user.save();
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.token).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.message).toMatch(/không chính xác/i);
    });
  });
});
