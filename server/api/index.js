import app from '../src/app.js';
import { applyCorsHeaders } from '../src/config/cors.js';
import { connectDB } from '../src/config/db.js';
import { env, getMongoUri, hasMongoDatabaseName, hasMongoScheme, validateEnv } from '../src/config/env.js';

let dbConnection;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    applyCorsHeaders(req, res);
    return res.status(204).end();
  }

  if (req.url?.startsWith('/api/debug/env')) {
    const mongoUri = getMongoUri();
    applyCorsHeaders(req, res);
    return res.status(200).json({
      nodeEnv: env.NODE_ENV,
      hasMongoUri: Boolean(mongoUri),
      mongoUriHasValidScheme: mongoUri ? hasMongoScheme(mongoUri) : false,
      mongoUriHasDatabaseName: mongoUri ? hasMongoDatabaseName(mongoUri) : false,
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      clientUrl: env.CLIENT_URL || null,
      hasClientUrls: Boolean(env.CLIENT_URLS)
    });
  }

  try {
    validateEnv();
    dbConnection ||= connectDB();
    await dbConnection;
    return app(req, res);
  } catch (error) {
    dbConnection = undefined;
    console.error('Startup failed', {
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url
    });
    applyCorsHeaders(req, res);
    return res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Server startup failed' : error.message
    });
  }
}
