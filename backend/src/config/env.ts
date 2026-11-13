// src/config/env.ts
// Parses and validates environment variables at startup.
import fs from 'fs';
import path from 'path';

// Native lightweight .env loader to ensure env variables are loaded even without dotenv package
function loadDotEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch {
        // Fallback to process.env if reading file fails
      }
    }
  }
}

loadDotEnv();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

function getEnvInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer, got: ${value}`);
  }
  return parsed;
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: getEnv('JWT_SECRET', 'flowguard-dev-secret-change-in-production'),
  PORT: getEnvInt('PORT', 3000),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  MAX_RETRIES: getEnvInt('MAX_RETRIES', 3),
  CORS_ORIGIN: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
} as const;

export type Env = typeof env;
