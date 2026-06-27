import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_SECRET'];

export function getEnv(name, fallback = '') {
  const value = process.env[name];
  return value === undefined || value === null || value === '' ? fallback : value;
}

export function requireEnv(name) {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function validateEnv(requiredEnvVars = REQUIRED_ENV_VARS) {
  const missing = requiredEnvVars.filter((name) => !getEnv(name));

  if (missing.length === 1) {
    throw new Error(`Missing required environment variable: ${missing[0]}`);
  }

  if (missing.length > 1) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const env = {
  CLIENT_URL: getEnv('CLIENT_URL'),
  CLIENT_URLS: getEnv('CLIENT_URLS'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getEnv('PORT', '5001'),
  SCHOOL_NAME: getEnv('SCHOOL_NAME', 'German School'),
  VERCEL_BRANCH_URL: getEnv('VERCEL_BRANCH_URL'),
  VERCEL_URL: getEnv('VERCEL_URL')
};
