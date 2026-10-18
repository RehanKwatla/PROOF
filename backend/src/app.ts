import cors from 'cors';
import express, { type Express } from 'express';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import githubRoutes from './routes/githubRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

export function createApp(): Express {
  const app = express();

  // CORS configuration
  const allowedOrigins = config.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, postman)
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Allow for development resilience
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Demo-Role'],
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic request logger in dev
  if (config.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
      });
      next();
    });
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'proof-backend',
      timestamp: new Date().toISOString(),
      env: config.NODE_ENV,
    });
  });

  // Mount API routes
  app.use('/api/auth/github', githubRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/assessments', assessmentRoutes);
  app.use('/api/candidates', candidateRoutes);
  app.use('/api/sessions', sessionRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
