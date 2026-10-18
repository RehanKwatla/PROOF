import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { prisma } from '../db/prisma.js';

const app = createApp();

describe('Authentication & Authorization Suite', () => {
  const testCandidate = {
    name: 'Ada Lovelace',
    email: 'ada.lovelace@test.proof.dev',
    password: 'ValidPassword123!',
    role: 'candidate',
  };

  const testRecruiter = {
    name: 'Charles Babbage',
    email: 'charles.babbage@test.proof.dev',
    password: 'ValidPassword123!',
    role: 'recruiter',
  };

  beforeAll(async () => {
    // Clean any prior test accounts
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testCandidate.email, testRecruiter.email, 'duplicate@test.proof.dev'],
        },
      },
    });
  });

  describe('POST /api/auth/register', () => {
    it('creates a new candidate account with hashed password and valid token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testCandidate);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        email: testCandidate.email,
        name: testCandidate.name,
        role: 'candidate',
        initials: 'AL',
      });

      // Verify password in DB is hashed and not plaintext
      const userInDb = await prisma.user.findUnique({
        where: { email: testCandidate.email },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb?.passwordHash).not.toBe(testCandidate.password);
      expect(userInDb?.passwordHash.startsWith('$2')).toBe(true);
    });

    it('creates a recruiter account when specified', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testRecruiter);

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('recruiter');
      expect(res.body.user.initials).toBe('CB');
    });

    it('rejects duplicate email registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testCandidate);

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('rejects invalid email formats', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid User',
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('rejects passwords shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Password User',
          email: 'shortpass@test.proof.dev',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates newly registered user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCandidate.email,
          password: testCandidate.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testCandidate.email);
    });

    it('authenticates seeded recruiter account (recruiter@proof.dev / password123)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'recruiter@proof.dev',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('recruiter');
    });

    it('authenticates seeded candidate account (candidate@proof.dev / password123)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'candidate@proof.dev',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('candidate');
    });

    it('rejects login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCandidate.email,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });

    it('rejects login for nonexistent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.proof.dev',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });
  });

  describe('Protected Routes & Session Expiration', () => {
    let candidateToken: string;

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCandidate.email,
          password: testCandidate.password,
        });
      candidateToken = loginRes.body.token;
    });

    it('GET /api/auth/me returns user profile with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testCandidate.email);
      expect(res.body.user.name).toBe(testCandidate.name);
    });

    it('GET /api/auth/me rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('GET /api/auth/me rejects invalid or expired tokens', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-garbage-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid or expired/i);
    });

    it('POST /api/auth/logout acknowledges session termination', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out/i);
    });
  });
});
