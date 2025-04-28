import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db';
import { redisClient, connectRedis } from '../config/redis';
import User from '../models/user';
import Product from '../models/product';
import Cart from '../models/cart';
import Order from '../models/order';

dotenv.config();

const seedData = async () => {
  try {
   
    await connectDB();
    await connectRedis();

    
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await redisClient.flushAll();

    console.log('Existing data cleared');

   
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin1234',
        role: 'admin'
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password1',
        role: 'customer'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'Password1',
        role: 'customer'
      }
    ];
    const createdUsers = await User.insertMany(users);
    console.log(`Seeded ${createdUsers.length} users`);

   
    const customerUsers = createdUsers.filter(user => user.role === 'customer');
    
   
    const products = [
     
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with adjustable DPI and long battery life.',
        price: 29.99,
        stockQuantity: 150,
        category: 'Electronics',
        imageUrl: 'https://example.com/images/wireless-mouse.jpg'
      },
      {
        name: 'Mechanical Keyboard',
        description: 'RGB backlit mechanical keyboard with blue switches.',
        price: 79.99,
        stockQuantity: 80,
        category: 'Electronics',
        imageUrl: 'https://example.com/images/mechanical-keyboard.jpg'
      },
      {
        name: 'Wireless Earbuds',
        description: 'Bluetooth 5.0 earbuds with noise cancellation.',
        price: 49.99,
        stockQuantity: 120,
        category: 'Electronics',
        imageUrl: 'https://example.com/images/earbuds.jpg'
      },
      
     
      {
        name: 'Cotton T-Shirt',
        description: 'Premium cotton t-shirt, available in multiple colors.',
        price: 19.99,
        stockQuantity: 200,
        category: 'Clothing',
        imageUrl: 'https://example.com/images/tshirt.jpg'
      },
      {
        name: 'Denim Jeans',
        description: 'Classic fit denim jeans with stretch fabric.',
        price: 39.99,
        stockQuantity: 100,
        category: 'Clothing',
        imageUrl: 'https://example.com/images/jeans.jpg'
      },
      
     
      {
        name: 'Running Shoes',
        description: 'Lightweight running shoes with breathable mesh upper.',
        price: 59.99,
        stockQuantity: 120,
        category: 'Footwear',
        imageUrl: 'https://example.com/images/running-shoes.jpg'
      },
      {
        name: 'Casual Sneakers',
        description: 'Versatile canvas sneakers for everyday wear.',
        price: 44.99,
        stockQuantity: 150,
        category: 'Footwear',
        imageUrl: 'https://example.com/images/sneakers.jpg'
      },
      
     
      {
        name: 'Water Bottle',
        description: 'Insulated stainless steel water bottle, 1L capacity.',
        price: 19.99,
        stockQuantity: 300,
        category: 'Accessories',
        imageUrl: 'https://example.com/images/water-bottle.jpg'
      },
      {
        name: 'Backpack',
        description: 'Durable backpack with laptop compartment and multiple pockets.',
        price: 49.99,
        stockQuantity: 80,
        category: 'Accessories',
        imageUrl: 'https://example.com/images/backpack.jpg'
      },
    ];
    
    const createdProducts = await Product.insertMany(products);
    console.log(`Seeded ${createdProducts.length} products`);

    const carts = [];
    for (const user of customerUsers) {
      
      const cartItems = [];
      const numItems = Math.floor(Math.random() * 2) + 2; 
      
      for (let i = 0; i < numItems; i++) {
        const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const quantity = Math.floor(Math.random() * 3) + 1; 
        
        cartItems.push({
          product: randomProduct._id,
          quantity,
          price: randomProduct.price
        });
      }
      
      carts.push({
        user: user._id,
        items: cartItems
      });
    }
    
    const createdCarts = await Cart.insertMany(carts);
    console.log(`Seeded ${createdCarts.length} carts`);

    const orders = [];
    for (const user of customerUsers) {
      
      const numOrders = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < numOrders; i++) {
       
        const orderItems = [];
        const numItems = Math.floor(Math.random() * 3) + 1;
        let totalAmount = 0;
        
        for (let j = 0; j < numItems; j++) {
          const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
          const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
          const price = randomProduct.price;
          
          orderItems.push({
            product: randomProduct._id,
            quantity,
            price
          });
          
          totalAmount += price * quantity;
        }
        
        
        const statuses = ['pending', 'processing', 'completed', 'cancelled'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        orders.push({
          user: user._id,
          items: orderItems,
          totalAmount,
          status: randomStatus,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) 
        });
      }
    }
    
    const createdOrders = await Order.insertMany(orders);
    console.log(`Seeded ${createdOrders.length} orders`);

    console.log(' Seed data successfully loaded');
    
   
    await mongoose.connection.close();
    await redisClient.quit();
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    
 
    try {
      await mongoose.connection.close();
      await redisClient.quit();
    } catch (err) {
      console.error('Error closing connections:', err);
    }
    
    process.exit(1);
  }
};


seedData();
