import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { prisma } from '../db/prisma.js';

const app = createApp();

describe('GitHub Integration Suite', () => {
  let candidateToken: string;
  let candidateId: string;

  beforeAll(async () => {
    // Authenticate candidate
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'candidate@proof.dev',
        password: 'password123',
      });
    candidateToken = loginRes.body.token;
    candidateId = loginRes.body.user.id;

    // Clean any prior GitHub connection for candidate
    await prisma.gitHubAccount.deleteMany({
      where: { userId: candidateId },
    });
  });

  describe('OAuth Initiation & State Validation', () => {
    it('GET /api/auth/github rejects unauthenticated callers', async () => {
      const res = await request(app).get('/api/auth/github');
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/github generates authorization URL with cryptographically secure state', async () => {
      const res = await request(app)
        .get('/api/auth/github?format=json')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('url');
      expect(res.body).toHaveProperty('state');
      expect(res.body.state).toContain(candidateId);
    });

    it('GET /api/auth/github/callback rejects missing code or state', async () => {
      const res = await request(app).get('/api/auth/github/callback');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/missing code or state/i);
    });

    it('GET /api/auth/github/callback handles authorization cancellation from GitHub', async () => {
      const res = await request(app)
        .get('/api/auth/github/callback?error=access_denied&error_description=The+user+has+denied+your+application')
        .redirects(0);

      // Should redirect back to frontend with error parameter
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('github_error');
    });

    it('GET /api/auth/github/callback successfully connects account with valid state', async () => {
      // 1. Generate valid state
      const stateRes = await request(app)
        .get('/api/auth/github?format=json')
        .set('Authorization', `Bearer ${candidateToken}`);
      const validState = stateRes.body.state;

      // 2. Execute callback with test code and valid state
      const callbackRes = await request(app)
        .get(`/api/auth/github/callback?code=mock_code_test_123&state=${encodeURIComponent(validState)}`)
        .set('Accept', 'application/json');

      expect(callbackRes.status).toBe(200);
      expect(callbackRes.body.success).toBe(true);
      expect(callbackRes.body.username).toBeDefined();

      // Verify in DB that account exists
      const account = await prisma.gitHubAccount.findUnique({
        where: { userId: candidateId },
      });
      expect(account).toBeDefined();
      expect(account?.accessToken).toBeDefined();
    });
  });

  describe('Connection Status & Security Controls', () => {
    it('GET /api/auth/github/status returns connected state without exposing accessToken', async () => {
      const res = await request(app)
        .get('/api/auth/github/status')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(true);
      expect(res.body.account).toBeDefined();
      expect(res.body.account.username).toBeDefined();

      // CRITICAL: Ensure access token and secrets are NEVER exposed in response
      expect(res.body.account.accessToken).toBeUndefined();
      expect(res.body.account.token).toBeUndefined();
      expect(res.body.account.clientSecret).toBeUndefined();
    });
  });

  describe('Repository Listing & Selection', () => {
    it('GET /api/auth/github/repos returns list of accessible repositories', async () => {
      const res = await request(app)
        .get('/api/auth/github/repos')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.repositories)).toBe(true);
      expect(res.body.repositories.length).toBeGreaterThan(0);

      const repo = res.body.repositories[0];
      expect(repo).toHaveProperty('name');
      expect(repo).toHaveProperty('fullName');
      expect(repo).toHaveProperty('defaultBranch');
      expect(repo).toHaveProperty('stars');
      expect(repo).toHaveProperty('isPrivate');
    });

    it('POST /api/auth/github/select-repo updates chosen repository and emits BuildTrail event', async () => {
      const repoToSelect = 'rehankwatla/PROOF';
      const branchToSelect = 'main';

      const res = await request(app)
        .post('/api/auth/github/select-repo')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          repoFullName: repoToSelect,
          defaultBranch: branchToSelect,
          sessionId: 'ASM-3088-TASK',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.selectedRepo).toBe(repoToSelect);
      expect(res.body.selectedBranch).toBe(branchToSelect);
      expect(res.body.event).toBeDefined();
      expect(res.body.event.title).toContain('Connected GitHub Repository');

      // Verify event was saved in Session telemetry
      const eventInDb = await prisma.sessionEvent.findFirst({
        where: {
          session: { submissionId: 'ASM-3088-TASK' },
          title: { contains: 'Connected GitHub' },
        },
      });
      expect(eventInDb).toBeDefined();
      expect(eventInDb?.detail).toContain(repoToSelect);
    });
  });

  describe('Disconnect & Reconnect Flow', () => {
    it('DELETE /api/auth/github disconnects connected account', async () => {
      const res = await request(app)
        .delete('/api/auth/github')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify status is now disconnected
      const statusRes = await request(app)
        .get('/api/auth/github/status')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(statusRes.body.connected).toBe(false);
      expect(statusRes.body.account).toBeNull();
    });

    it('GET /api/auth/github/repos returns error when disconnected', async () => {
      const res = await request(app)
        .get('/api/auth/github/repos')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/no github account connected/i);
    });
  });
});
