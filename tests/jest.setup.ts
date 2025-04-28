import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';


process.env.NODE_ENV = 'test';


jest.mock('../src/config/redis', () => {
  const mockClient = require('redis-mock').createClient();
  

  mockClient.setEx = jest.fn().mockImplementation((key, seconds, value) => {
    return Promise.resolve('OK');
  });
  

  const originalDel = mockClient.del;
  mockClient.del = jest.fn().mockImplementation((...args) => {
    return Promise.resolve(originalDel.apply(mockClient, args) || 1);
  });
  
  mockClient.get = mockClient.get || jest.fn().mockResolvedValue(null);
  mockClient.set = mockClient.set || jest.fn().mockResolvedValue('OK');
  mockClient.expire = mockClient.expire || jest.fn().mockResolvedValue(1);
  mockClient.scan = mockClient.scan || jest.fn().mockResolvedValue([0, []]);
  mockClient.keys = mockClient.keys || jest.fn().mockResolvedValue([]);
  mockClient.quit = mockClient.quit || jest.fn().mockResolvedValue('OK');
  
  return {
    redisClient: mockClient,
    connectRedis: jest.fn().mockImplementation(() => Promise.resolve())
  };
});

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  
  mongoServer = await MongoMemoryServer.create();
  const uri = await mongoServer.getUri();
  
  try {
  
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
      console.log('MongoDB connected successfully');
    } else {
      console.log('MongoDB is already connected');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
});

afterEach(async () => {

  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoServer.stop();
  console.log('MongoDB disconnected');
});