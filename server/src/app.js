import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { env } from './config/env.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';

function normalizeOrigin(origin) {
  if (!origin) return '';
  return origin.trim().replace(/\/$/, '');
}

const configuredOrigins = (env.CLIENT_URLS || env.CLIENT_URL || '')
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
  ...(env.NODE_ENV === 'production' ? [] : localOrigins)
]);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);

    const isAllowed =
      allowedOrigins.has(normalized) ||
      /^https:\/\/sprach-pr-fung-client.*\.vercel\.app$/.test(normalized);

    if (isAllowed) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
