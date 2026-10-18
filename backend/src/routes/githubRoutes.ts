import { Router } from 'express';
import { config } from '../config/index.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { gitHubService } from '../services/githubService.js';
import { SelectRepoRequestSchema } from '../types/assessment.js';

const router = Router();

/**
 * GET /api/auth/github
 * Initiates GitHub OAuth authorization flow
 */
router.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { url, state } = gitHubService.generateAuthUrl(req.user.id);

  if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
    return res.json({ url, state });
  }

  res.redirect(url);
});

/**
 * GET /api/auth/github/callback
 * Handles OAuth callback from GitHub
 */
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query as {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };

    if (error) {
      const frontendUrl = new URL(config.CORS_ORIGIN.split(',')[0]);
      frontendUrl.searchParams.set('github_error', error_description || error);
      return res.redirect(frontendUrl.toString());
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    const result = await gitHubService.handleCallback(code, state);

    // If client requested JSON, return JSON
    if (req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html')) {
      return res.json(result);
    }

    // Otherwise redirect back to frontend with query param
    const frontendUrl = new URL(config.CORS_ORIGIN.split(',')[0]);
    frontendUrl.searchParams.set('github', 'connected');
    frontendUrl.searchParams.set('username', result.username);
    res.redirect(frontendUrl.toString());
  } catch (err: any) {
    console.error('[OAuth Callback Error]:', err);
    if (req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html')) {
      return res.status(500).json({ error: err.message || 'OAuth callback failed' });
    }
    const frontendUrl = new URL(config.CORS_ORIGIN.split(',')[0]);
    frontendUrl.searchParams.set('github_error', err.message || 'OAuth callback failed');
    res.redirect(frontendUrl.toString());
  }
});

/**
 * GET /api/auth/github/status
 * Check connection status of current user's GitHub account
 */
router.get('/status', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const status = await gitHubService.getStatus(req.user.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/github/repos
 * List candidate repositories
 */
router.get('/repos', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const repos = await gitHubService.listRepositories(req.user.id);
    res.json({ repositories: repos, total: repos.length });
  } catch (err: any) {
    if (err.message.includes('expired') || err.message.includes('reconnect')) {
      return res.status(401).json({ error: err.message, requiresReconnect: true });
    }
    if (err.message.includes('rate limit')) {
      return res.status(429).json({ error: err.message });
    }
    next(err);
  }
});

/**
 * POST /api/auth/github/select-repo
 * Select repository and log to telemetry/BuildTrail
 */
router.post(
  '/select-repo',
  authenticate,
  validateBody(SelectRepoRequestSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const { repoFullName, defaultBranch, sessionId } = req.body;
      const result = await gitHubService.selectRepository(
        req.user.id,
        repoFullName,
        defaultBranch,
        sessionId,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/auth/github
 * Disconnect GitHub account
 */
router.delete('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const result = await gitHubService.disconnect(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
