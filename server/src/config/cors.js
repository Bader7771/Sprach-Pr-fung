import { env } from './env.js';

const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const CORS_HEADERS = ['Content-Type', 'Authorization'];

export function normalizeOrigin(origin) {
  if (!origin) return '';
  return origin.trim().replace(/\/+$/, '');
}

const configuredOrigins = [env.CLIENT_URL, env.ALLOWED_ORIGINS, env.CLIENT_URLS]
  .filter(Boolean)
  .join(',')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const vercelOrigins = [env.VERCEL_URL, env.VERCEL_BRANCH_URL]
  .filter(Boolean)
  .map((origin) => `https://${origin}`);

const localOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const allowedOrigins = new Set([
  'https://sprach-pr-fung-client.vercel.app',
  'https://sprach-pr-fung-client-git-main-bader7771s-projects.vercel.app',
  ...configuredOrigins,
  ...vercelOrigins,
  ...localOrigins
]);

export function isOriginAllowed(origin) {
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);

  return (
    allowedOrigins.has(normalized) ||
    /^https:\/\/sprach-pr-fung-client.*\.vercel\.app$/.test(normalized)
  );
}

export const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: CORS_METHODS,
  allowedHeaders: CORS_HEADERS,
  optionsSuccessStatus: 204
};

export function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', CORS_METHODS.join(','));
  res.setHeader('Access-Control-Allow-Headers', CORS_HEADERS.join(','));
}
