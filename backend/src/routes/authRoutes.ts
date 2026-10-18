import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { authenticate, signToken, type AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { LoginRequestSchema, RegisterRequestSchema } from '../types/assessment.js';

const router = Router();

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'U';
}

/**
 * POST /api/auth/register
 * Create a new candidate or recruiter account
 */
router.post('/register', validateBody(RegisterRequestSchema), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const initials = getInitials(name);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: role || 'candidate',
        initials,
      },
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role as 'candidate' | 'recruiter' | 'admin',
      name: user.name,
    });

    res.status(201).json({
      message: 'Account successfully created',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        initials: user.initials,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user with secure password verification
 */
router.post('/login', validateBody(LoginRequestSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { gitHubAccount: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role as 'candidate' | 'recruiter' | 'admin',
      name: user.name,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        initials: user.initials,
        githubConnected: Boolean(user.gitHubAccount),
        githubUsername: user.gitHubAccount?.username || null,
        selectedRepo: user.gitHubAccount?.selectedRepo || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        gitHubAccount: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
            profileUrl: true,
            selectedRepo: true,
            selectedBranch: true,
            repoMetadata: true,
            connectedAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.json({
        user: req.user,
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        initials: user.initials,
        gitHubAccount: user.gitHubAccount,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Client token invalidation acknowledgement
 */
router.post('/logout', (_req, res) => {
  res.json({ message: 'Successfully logged out' });
});

export default router;
