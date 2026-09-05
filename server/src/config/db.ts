import mongoose from 'mongoose';
import { env } from './env';
import { autoSeedIfEmpty } from '../utils/autoSeed';

export const connectDB = async (): Promise<void> => {
  // 1. Try configured URI (Atlas or custom local MongoDB)
  let connected = false;
  if (env.MONGODB_URI) {
    try {
      console.log('📡 Attempting connection to MongoDB...');
      const conn = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      connected = true;
    } catch (error: any) {
      console.warn(`⚠️ Could not connect to remote MongoDB Atlas: ${error.message}`);
      console.log('📦 Falling back to embedded in-memory MongoDB for seamless offline/local use...');
    }
  }

  // 2. Fallback to embedded in-memory MongoDB if remote failed or not configured
  if (!connected) {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: { dbName: 'egowshala', storageEngine: 'wiredTiger' },
        binary: { version: '7.0.0' },
      });
      const memoryUri = mongod.getUri();
      process.env.MONGODB_URI = memoryUri;
      await mongoose.connect(memoryUri);
      console.log(`✅ Embedded in-memory MongoDB running at: ${memoryUri}`);
      connected = true;
    } catch (memErr: any) {
      console.error('❌ Failed to start embedded in-memory MongoDB:', memErr.message);
      throw memErr;
    }
  }

  // 3. Ensure essential seed data exists so admin login never fails
  await autoSeedIfEmpty();

  // 4. Lifecycle listeners to ensure connection stability
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected successfully.');
  });
};

