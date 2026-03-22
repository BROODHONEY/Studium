const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('../routes/auth');

// Mock Supabase
jest.mock('../config/db', () => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}));

const supabase = require('../config/db');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes - Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid email and password', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        phone: null,
        role: 'student',
        password_hash: await bcrypt.hash('password123', 10),
        created_at: '2024-01-01T00:00:00Z'
      };

      // Mock the database query
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          }))
        }))
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password_hash');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should login successfully with valid phone and password', async () => {
      const mockUser = {
        id: '456',
        name: 'Test User 2',
        email: null,
        phone: '+1234567890',
        role: 'teacher',
        password_hash: await bcrypt.hash('password456', 10),
        created_at: '2024-01-01T00:00:00Z'
      };

      // Mock the database query
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          }))
        }))
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+1234567890',
          password: 'password456'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.phone).toBe('+1234567890');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password and email or phone are required');
    });

    it('should return 400 if neither email nor phone is provided', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password and email or phone are required');
    });

    it('should return 401 if user does not exist', async () => {
      // Mock the database query to return no user
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          }))
        }))
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        phone: null,
        role: 'student',
        password_hash: await bcrypt.hash('correctpassword', 10),
        created_at: '2024-01-01T00:00:00Z'
      };

      // Mock the database query
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          }))
        }))
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 500 if database error occurs', async () => {
      // Mock the database query to throw an error
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockRejectedValue(new Error('Database error'))
          }))
        }))
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Something went wrong');
    });

    it('should generate a valid JWT token', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        phone: null,
        role: 'student',
        password_hash: await bcrypt.hash('password123', 10),
        created_at: '2024-01-01T00:00:00Z'
      };

      // Mock the database query
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          }))
        }))
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);

      // Verify the JWT token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe('123');
      expect(decoded.role).toBe('student');
    });
  });
});