import app from '../src/server.js';
import { connectDB } from '../src/config/db.js';

let dbConnection;

export default async function handler(req, res) {
  if (!req.url.startsWith('/api/')) {
    const pathParam = req.query?.path;
    const path = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
    req.url = `/api/${path || ''}`;
  }

  dbConnection ||= connectDB();
  await dbConnection;
  return app(req, res);
}
