import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { validateEnv } from '../src/config/env.js';

let dbConnection;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return app(req, res);
  }

  try {
    validateEnv();
    dbConnection ||= connectDB();
    await dbConnection;
    return app(req, res);
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
}
