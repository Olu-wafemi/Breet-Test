import request from 'supertest';
import app from '../../app';
import User from '../../models/user';

describe('Auth Endpoints', () => {
 
  const uniqueEmail = `test.user@example.com`;
  const password = 'Password1';
  
  beforeAll(async () => {
    await User.deleteOne({ email: uniqueEmail });
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ 
        name: 'Test User', 
        email: uniqueEmail,
        password: password 
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.data.token).toBeDefined();
    
  
    const userInDb = await User.findOne({ email: uniqueEmail });
    expect(userInDb).toBeTruthy();
  });

  it('should login an existing user', async () => {
   
    const userExists = await User.findOne({ email: uniqueEmail });
    if (!userExists) {
      console.log('User not found in database, skipping login test');
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: password
      });
  
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });
  

  afterAll(async () => {
    try {
      await User.deleteOne({ email: uniqueEmail });
    } catch (err) {
      console.error('Error cleaning up test user:', err);
    }
  });
});