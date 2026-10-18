import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file from backend root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().default('proof_development_jwt_secret_key_change_in_production_32chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  RUNNER_TIMEOUT_MS: z.coerce.number().default(5000),
  GITHUB_CLIENT_ID: z.string().default(''),
  GITHUB_CLIENT_SECRET: z.string().default(''),
  GITHUB_REDIRECT_URI: z.string().default('http://localhost:4000/api/auth/github/callback'),
});

export const config = ConfigSchema.parse(process.env);
