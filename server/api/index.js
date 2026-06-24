import app from '../src/server.js';
import { connectDB } from '../src/config/db.js';

let dbConnection;

export default async function handler(req, res) {
  dbConnection ||= connectDB();
  await dbConnection;
  return app(req, res);
}
