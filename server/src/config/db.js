import mongoose from 'mongoose';
import { requireEnv } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(requireEnv('MONGODB_URI'));
  console.log('MongoDB connected');
}
