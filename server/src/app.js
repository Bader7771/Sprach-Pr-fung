import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { corsOptions } from './config/cors.js';
import { getDatabaseStatus } from './config/db.js';
import { getEnv } from './config/env.js';
import Admin from './models/Admin.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';
import { requestId } from './middleware/requestId.js';

const app = express();

app.set('trust proxy', 1);
app.use(requestId);
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

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sprach Prüfung API is running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'Sprach Prüfung API',
    database: getDatabaseStatus(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/auth', (req, res) => {
  const mongoReadyState = mongoose.connection.readyState;
  res.json({
    success: true,
    databaseConnected: mongoReadyState === 1,
    mongoReadyState,
    jwtSecretConfigured: Boolean(getEnv('JWT_SECRET')),
    mongoUriConfigured: Boolean(getEnv('MONGO_URI')),
    userCollection: Admin.collection.name
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
