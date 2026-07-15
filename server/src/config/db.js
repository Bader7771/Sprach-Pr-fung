import mongoose from 'mongoose';
import { requireMongoUri } from './env.js';

let cachedConnection = null;
let pendingConnection = null;

export async function connectDB() {
  mongoose.set('strictQuery', true);

  if (mongoose.connection.readyState === 1) {
    cachedConnection = mongoose.connection;
    return cachedConnection;
  }

  if (cachedConnection?.readyState === 1) {
    return cachedConnection;
  }

  if (!pendingConnection) {
    pendingConnection = mongoose
      .connect(requireMongoUri(), {
        serverSelectionTimeoutMS: 8000
      })
      .then((connection) => {
        cachedConnection = connection.connection;
        console.log(`MongoDB connected: ${connection.connection.name}`);
        return cachedConnection;
      })
      .catch((error) => {
        cachedConnection = null;
        throw error;
      })
      .finally(() => {
        pendingConnection = null;
      });
  }

  return pendingConnection;
}

export function getDatabaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

export async function requireDatabase(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
}
