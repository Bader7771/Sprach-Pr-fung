import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET'];

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

export function getMongoUri() {
  return sanitizeMongoUri(getEnv('MONGO_URI') || getEnv('MONGODB_URI'));
}

export function requireMongoUri() {
  const value = getMongoUri();
  if (!value) {
    throw new Error('Missing required environment variable: MONGO_URI');
  }
  return value;
}

export function hasMongoDatabaseName(mongoUri) {
  try {
    const parsed = new URL(mongoUri);
    return parsed.pathname && parsed.pathname !== '/';
  } catch {
    const match = mongoUri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
    return Boolean(match?.[1]);
  }
}

export function hasMongoScheme(mongoUri) {
  return mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://');
}

function sanitizeMongoUri(mongoUri) {
  const trimmed = mongoUri.trim();
  const isQuoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return isQuoted ? trimmed.slice(1, -1).trim() : trimmed;
}

export function validateEnv(requiredEnvVars = REQUIRED_ENV_VARS) {
  const missing = requiredEnvVars.filter((name) => {
    if (name === 'MONGO_URI') return !getMongoUri();
    return !getEnv(name);
  });

  if (missing.length === 1) {
    throw new Error(`Missing required environment variable: ${missing[0]}`);
  }

  if (missing.length > 1) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const mongoUri = getMongoUri();
  if (mongoUri && mongoUri.startsWith('MONGO_URI=')) {
    throw new Error('MONGO_URI must contain only the MongoDB connection string, not MONGO_URI=...');
  }

  if (mongoUri && !hasMongoScheme(mongoUri)) {
    throw new Error('MONGO_URI must start with mongodb:// or mongodb+srv://');
  }

  if (mongoUri && !hasMongoDatabaseName(mongoUri)) {
    throw new Error('MONGO_URI must include a database name after the host, for example mongodb+srv://.../sprach_prufung?retryWrites=true&w=majority');
  }
}

export const env = {
  CLIENT_URL: getEnv('CLIENT_URL'),
  CLIENT_URLS: getEnv('CLIENT_URLS'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  MONGO_URI: getMongoUri(),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getEnv('PORT', '5001'),
  SCHOOL_NAME: getEnv('SCHOOL_NAME', 'German School'),
  VERCEL_BRANCH_URL: getEnv('VERCEL_BRANCH_URL'),
  VERCEL_URL: getEnv('VERCEL_URL')
};
