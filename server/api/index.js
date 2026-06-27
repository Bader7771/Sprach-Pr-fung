import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let dbConnection;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return app(req, res);
  }

  dbConnection ||= connectDB();
  await dbConnection;
  return app(req, res);
}
