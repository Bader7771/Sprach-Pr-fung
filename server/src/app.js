import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { corsOptions } from './config/cors.js';
import { env, getMongoUri } from './config/env.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';

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
app.get('/api/debug/env', (req, res) => {
  res.json({
    nodeEnv: env.NODE_ENV,
    hasMongoUri: Boolean(getMongoUri()),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    clientUrl: env.CLIENT_URL || null,
    hasClientUrls: Boolean(env.CLIENT_URLS)
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
