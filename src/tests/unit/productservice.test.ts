import { createProduct, getProductById, getAllProducts } from '../../services/productservice';
import Product from '../../models/product';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';


jest.mock('../../src/models/product', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn().mockReturnValue({
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn()
  }),
  countDocuments: jest.fn()
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = await mongoServer.getUri();
  
 
  if (mongoose.connection.readyState === 0) { 
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  } else {
    console.log('MongoDB is already connected');
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('MongoDB disconnected');
});

describe('Product Service', () => {
  let createdId: string;
  
  beforeEach(() => {
   
    jest.clearAllMocks();
  });

  it('should create a product', async () => {
    const data = { name: 'Test', description: 'Desc', price: 10, stockQuantity: 5, category: 'test' };
    const mockProduct = { _id: new mongoose.Types.ObjectId(), ...data };
    
    (Product.create as jest.Mock).mockResolvedValue(mockProduct);
    
    const product = await createProduct(data);
    createdId = product._id.toString();
    
    expect(product.name).toBe(data.name);
    expect(Product.create).toHaveBeenCalledWith(data);
  });

  it('should retrieve the product by ID', async () => {
    const mockId = new mongoose.Types.ObjectId();
    const idString = mockId.toString();
    const mockProduct = { _id: mockId, name: 'Test', description: 'Desc' };
    
    (Product.findById as jest.Mock).mockResolvedValue(mockProduct);
    
    const product = await getProductById(idString);
    
    expect(product._id.toString()).toBe(idString);
    expect(Product.findById).toHaveBeenCalledWith(idString);
  });
});