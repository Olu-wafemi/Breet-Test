import request from 'supertest';
import app from '../../src/app';
import mongoose from 'mongoose';
import Product from '../../src/models/product'; // Direct import of the Product model

jest.setTimeout(30000);

describe('Cart → Order Flow', () => {
  let token: string;
  let productId: string;

  beforeAll(async () => {
    try {
     
      const uniqueEmail = `flow-test-${Date.now()}@example.com`;
      
      
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ 
          name: 'Flow Test User', 
          email: uniqueEmail, 
          password: 'Password1' 
        });
        
      expect(registerRes.statusCode).toBe(201);
      token = registerRes.body.data.token;
      
     
      const testProduct = new Product({
        name: 'Test Product',
        description: 'Test Description',
        price: 10,
        stockQuantity: 10,
        category: 'test'
      });
      
      const savedProduct = await testProduct.save();
      productId = savedProduct._id.toString();
      console.log('Created test product with ID:', productId);
      
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });


  afterAll(async () => {
    if (productId) {
      try {
        await Product.findByIdAndDelete(productId);
        console.log('Test product deleted');
      } catch (err) {
        console.error('Error deleting test product:', err);
      }
    }
  });

  it('completes checkout successfully', async () => {
  
    expect(productId).toBeDefined();
    
  
    const cartRes = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 1 });
    
    expect(cartRes.status).toBe(200);

  
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`);
    
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.items).toHaveLength(1);
    expect(orderRes.body.data.status).toBe('pending');
    
  
    const productRes = await request(app)
      .get(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(productRes.status).toBe(200);
    expect(productRes.body.data.stockQuantity).toBe(9); 
  });
});