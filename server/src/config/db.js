import mongoose from 'mongoose';
import { requireMongoUri } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const connection = await mongoose.connect(requireMongoUri());
  console.log(`MongoDB connected: ${connection.connection.name}`);
  return connection.connection;
}
