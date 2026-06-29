import mongoose from 'mongoose';
import { requireMongoUri } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(requireMongoUri());
    console.log(`MongoDB connected: ${connection.connection.name}`);
    return connection.connection;
  } catch (error) {
    console.error('MongoDB connection failed', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}
