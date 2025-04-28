import Order, { IOrder } from '../models/order';
import Cart from '../models/cart';
import Product from '../models/product';
import { 
  NotFoundError, 
  DatabaseError, 
  InsufficientStockError,
  BadRequestError,
} from '../utils/errors';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis';

/**
 * Cache expiry time in seconds
 * ASSUMPTION: Order data changes infrequently, so longer cache duration is appropriate
 */
const CACHE_EXPIRY = 3600; 

/**
 * Creates a new order from the user's cart
 * 
 * TECHNICAL CHALLENGES ADDRESSED:
 * 1. Concurrency: Uses MongoDB transactions to ensure atomic operations
 * 2. Data Consistency: Validates stock availability before committing the order
 * 3. Cache Invalidation: Clears relevant caches after successful order creation
 * 4. Optimized Queries: Uses session-based queries to maintain transaction integrity
 * 
 * @param userId The ID of the user creating the order
 * @returns The created order object with populated product data
 */
export const createOrder = async (userId: string): Promise<IOrder> => {
  // Start MongoDB transaction to ensure atomicity of the entire operation
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get cart with product details in a single query to minimize DB round trips
    const cart = await Cart.findOne({ user: userId }).populate('items.product').session(session);
    
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }
    
    
    let totalAmount = 0;
    const orderItems = [];
    
    // Process each cart item, checking stock and updating inventory atomically
    for (const item of cart.items) {
      const product = await Product.findById(item.product, null, { session });
      
      if (!product) {
        throw new NotFoundError(`Product not found: ${item.product}`);
      }
      
      // Ensure stock availability before creating order
      if (product.stockQuantity < item.quantity) {
        throw new InsufficientStockError(
          `Not enough stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`
        );
      }
      
      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price
      });
      
      totalAmount += product.price * item.quantity;
      
      // Update product stock atomically within the transaction
      product.stockQuantity -= item.quantity;
      await product.save({ session });
      
      // Invalidate product cache to ensure latest stock is reflected
      await redisClient.del(`product:${product._id}`);
    }
    
    // Create order within the transaction
    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      status: 'pending'
    });
    
    await order.save({ session });
    
    // Clear cart after order creation
    cart.items = [];
    await cart.save({ session });
    
    // Commit all changes atomically
    await session.commitTransaction();
    session.endSession();
    
    // Return populated order for API response
    const populatedOrder = await Order.findById(order._id).populate('items.product');
    
    if (!populatedOrder) {
      throw new NotFoundError('Order not found after creation');
    }
    
    // Invalidate relevant caches
    await redisClient.del(`cart:${userId}`);
    await redisClient.del('products:all');
    
    return populatedOrder;
  } catch (error) {
    // Roll back all changes if any operation fails
    await session.abortTransaction();
    session.endSession();
    
    if (error instanceof NotFoundError || 
        error instanceof InsufficientStockError || 
        error instanceof BadRequestError) {
      throw error;
    }
    
    
    throw new DatabaseError(`Failed to create order: ${(error as Error).message}`);
  }
};

/**
 * Retrieves an order by ID with caching for performance
 * 
 * TECHNICAL CHALLENGES ADDRESSED:
 * 1. Performance Optimization: Uses Redis caching to reduce database load
 * 2. Data Access Security: Validates user ownership before returning results
 * 
 * @param orderId The ID of the order to retrieve
 * @param userId The ID of the requesting user
 * @returns The requested order object with populated product data
 */
export const getOrderById = async (orderId: string, userId: string): Promise<IOrder> => {
  try {
    // Try to fetch from cache first to reduce database load
    const cacheKey = `order:${orderId}`;
    const cachedOrder = await redisClient.get(cacheKey);
    
    if (cachedOrder) {
      const order = JSON.parse(cachedOrder);
      
      // Ensure user can only access their own orders
      if (order.user.toString() !== userId) {
        throw new NotFoundError('Order not found');
      }
      
      return order;
    }
    
    // If not in cache, fetch from database
    const order = await Order.findById(orderId).populate('items.product');
    
    if (!order) {
      throw new NotFoundError(`Order with ID ${orderId} not found`);
    }
    
    if (order.user.toString() !== userId) {
      throw new NotFoundError('Order not found');
    }

    // Cache for future requests
    await redisClient.setEx(cacheKey, CACHE_EXPIRY, JSON.stringify(order));
    
    return order;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError(`Failed to get order: ${(error as Error).message}`);
  }
};

/**
 * Retrieves a paginated list of user orders
 * 
 * TECHNICAL CHALLENGES ADDRESSED:
 * 1. Query Optimization: Uses pagination to limit result size
 * 2. Performance: Uses Promise.all for parallel execution of count and find
 * 
 * @param userId The ID of the user whose orders to retrieve
 * @param page The page number for pagination
 * @param limit The number of items per page
 * @returns Object containing orders array, total count, and pagination info
 */
export const getUserOrders = async (userId: string, page = 1, limit = 10): Promise<{orders: IOrder[], totalOrders: number, totalPages: number}> => {
  try {
    const skip = (page - 1) * limit;
    
    // Execute queries in parallel for better performance
    const [orders, totalOrders] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.product'),
      Order.countDocuments({ user: userId })
    ]);
    
    const totalPages = Math.ceil(totalOrders / limit);
    
    return {
      orders,
      totalOrders,
      totalPages
    };
  } catch (error) {
    throw new DatabaseError(`Failed to get user orders: ${(error as Error).message}`);
  }
};

/**
 * Updates the status of an order
 * 
 * TECHNICAL CHALLENGES ADDRESSED:
 * 1. Data Consistency: Uses findByIdAndUpdate with validators
 * 2. Cache Management: Updates cache with latest data
 * 
 * @param orderId The ID of the order to update
 * @param status The new status to set
 * @returns The updated order object
 */
export const updateOrderStatus = async (
    orderId: string,
    status: string
  ): Promise<IOrder> => {
    try {
      // Update in a single operation with validation
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true, runValidators: true }
      ).populate('items.product');
  
      if (!order) {
        throw new NotFoundError(`Order with ID ${orderId} not found`);
      }
  
      // Update cache with new data
      const cacheKey = `order:${orderId}`;
      await redisClient.setEx(cacheKey, CACHE_EXPIRY, JSON.stringify(order));
  
      return order;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update order status: ${(error as Error).message}`);
    }
  };
  