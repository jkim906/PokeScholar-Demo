import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';

let mongoServer: MongoMemoryServer;
const profileImagesDir = path.join(__dirname, '../../public/profile-images');

// Set longer timeout for all tests
jest.setTimeout(30000);

// Connect to the in-memory database before running tests
beforeAll(async () => {
  // Create profile-images directory if it doesn't exist
  if (!fs.existsSync(profileImagesDir)) {
    fs.mkdirSync(profileImagesDir, { recursive: true });
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set mongoose options to prevent socket hang up
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 5
  });
});

// Clear all test data after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect and stop server after all tests
afterAll(async () => {
  try {
    // Clean up profile images after each test
    if (fs.existsSync(profileImagesDir)) {
      const files = fs.readdirSync(profileImagesDir);
      for (const file of files) {
        fs.unlinkSync(path.join(profileImagesDir, file));
      }
    }
    // Close all connections in the pool
    await mongoose.connection.close();
    // Stop the MongoDB server
    await mongoServer.stop();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}); 