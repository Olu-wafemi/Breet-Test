import Cart, { ICart } from '../models/cart';
import Product from '../models/product';
import { 
  AddToCartInput, 
  UpdateCartItemInput, 
  RemoveFromCartInput 
} from '../schemas/cartschema';
import { 
  NotFoundError, 
  DatabaseError, 
  InsufficientStockError 
} from '../utils/errors';
import { redisClient } from '../config/redis';
import mongoose from 'mongoose';


const CACHE_EXPIRY = 1800;

/**
 * Retrieves or creates a user's shopping cart
 * 
 * TECHNICAL CHALLENGES ADDRESSED:
 * 1. Performance: Uses Redis caching to reduce database load
 * 2. Data Freshness: Uses shorter cache expiry for frequently changing cart data
 * 
 * @param userId The ID of the user whose cart to retrieve
 * @returns The user's cart with populated product data
 */
export const getCart = async (userId: string): Promise<ICart | null> => {
  try {
    // Try to fetch from cache first
    const cacheKey = `cart:${userId}`;
    const cachedCart = await redisClient.get(cacheKey);
    
    if (cachedCart) {
      return JSON.parse(cachedCart);
    }
    
    // If not in cache, fetch from database
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart) {
      // Create new cart if user doesn't have one
      cart = await Cart.create({ user: userId, items: [] });
    }
    
    // Cache for future requests
    await redisClient.setEx(cacheKey, CACHE_EXPIRY, JSON.stringify(cart));
    
    return cart;
  } catch (error) {
    throw new DatabaseError(`Failed to get cart: ${(error as Error).message}`);
  }
};

/**
 * Adds an item to the user's cart
 * 
 * TECHNICAL CHALLENGES ADDRESSED:
 * 1. Concurrency: Uses MongoDB transactions to ensure atomic operations
 * 2. Data Consistency: Validates stock availability before adding to cart
 * 3. Cache Management: Updates cache with new cart data
 * 
 * @param userId The ID of the user whose cart to update
 * @param item The item to add to the cart
 * @returns The updated cart with populated product data
 */
export const addToCart = async (userId: string, item: AddToCartInput): Promise<ICart> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get product details and validate availability
    const product = await Product.findById(item.productId);
    
    if (!product) {
      throw new NotFoundError(`Product with ID ${item.productId} not found`);
    }
    
    if (product.stockQuantity < item.quantity) {
      throw new InsufficientStockError(
        `Not enough stock available. Requested: ${item.quantity}, Available: ${product.stockQuantity}`
      );
    }
    
    // Get or create user's cart within the transaction
    let cart = await Cart.findOne({ user: userId }).session(session);
    
    if (!cart) {
      // Create new cart if user doesn't have one
      cart = new Cart({
        user: userId,
        items: [] 
      });
    }
    
    // Check if product already exists in cart
    const cartItemIndex = cart.items.findIndex(
      (cartItem) => cartItem.product.toString() === item.productId
    );
    
    if (cartItemIndex > -1) {
      // Update quantity if product already in cart
      const newQuantity = cart.items[cartItemIndex].quantity + item.quantity;
      
      // Validate total quantity against available stock
      if (product.stockQuantity < newQuantity) {
        throw new InsufficientStockError(
          `Not enough stock available. Current cart: ${cart.items[cartItemIndex].quantity}, Requested: ${item.quantity}, Available: ${product.stockQuantity}`
        );
      }
      
      cart.items[cartItemIndex].quantity = newQuantity;
    } else {
      // Add new item to cart
      cart.items.push({
        product: new mongoose.Types.ObjectId(item.productId),
        quantity: item.quantity,
        price: product.price
      });
    }
    
    // Save cart changes within transaction
    await cart.save({ session });
    
    // Commit all changes atomically
    await session.commitTransaction();
    session.endSession();
    
    // Get fully populated cart for response
    const populatedCart = await Cart.findById(cart._id).populate('items.product');
    
    if (!populatedCart) {
      throw new NotFoundError('Cart not found after update');
    }
    
    // Update cache with new cart data
    const cacheKey = `cart:${userId}`;
    await redisClient.setEx(cacheKey, CACHE_EXPIRY, JSON.stringify(populatedCart));
    
    return populatedCart;
  } catch (error) {
    // Roll back all changes if any operation fails
    await session.abortTransaction();
    session.endSession();
    
    if (error instanceof NotFoundError || error instanceof InsufficientStockError) {
      throw error;
    }
    throw new DatabaseError(`Failed to add item to cart: ${(error as Error).message}`);
  }
};

/**
 * Updates the quantity of an item in the user's cart
 * 
 * TECHNICAL CHALLENGES ADDRESSED:
 * 1. Concurrency: Uses MongoDB transactions to ensure atomic operations
 * 2. Data Consistency: Validates stock availability before updating quantity
 * 3. Cache Invalidation: Updates cache with new cart data
 * 
 * @param userId The ID of the user whose cart to update
 * @param item The item with updated quantity
 * @returns The updated cart with populated product data
 */
export const updateCartItem = async (userId: string, item: UpdateCartItemInput): Promise<ICart> => {
  // Start MongoDB transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get product details and validate availability
    const product = await Product.findById(item.productId);
    
    if (!product) {
      throw new NotFoundError(`Product with ID ${item.productId} not found`);
    }
    
    if (product.stockQuantity < item.quantity) {
      throw new InsufficientStockError(
        `Not enough stock available. Requested: ${item.quantity}, Available: ${product.stockQuantity}`
      );
    }
    
    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).session(session);
    
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }
    
    const cartItemIndex = cart.items.findIndex(
      (cartItem) => cartItem.product.toString() === item.productId
    );
    
    if (cartItemIndex === -1) {
      throw new NotFoundError(`Item with product ID ${item.productId} not found in cart`);
    }
    
    // Update item quantity
    cart.items[cartItemIndex].quantity = item.quantity;
    
    // Save changes within transaction
    await cart.save({ session });
    
    // Commit all changes atomically
    await session.commitTransaction();
    session.endSession();
    
    // Get fully populated cart for response
    const populatedCart = await Cart.findById(cart._id).populate('items.product');
    
    if (!populatedCart) {
      throw new NotFoundError('Cart not found after update');
    }
    
    // Update cache with new cart data
    const cacheKey = `cart:${userId}`;
    await redisClient.setEx(cacheKey, CACHE_EXPIRY, JSON.stringify(populatedCart));
    
    return populatedCart;
  } catch (error) {
    // Roll back all changes if any operation fails
    await session.abortTransaction();
    session.endSession();
    
    if (error instanceof NotFoundError || error instanceof InsufficientStockError) {
      throw error;
    }
    throw new DatabaseError(`Failed to update cart item: ${(error as Error).message}`);
  }
};

export const removeFromCart = async (userId: string, item: RemoveFromCartInput): Promise<ICart> => {
  try {
    
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }
    
    
    cart.items = cart.items.filter(
      (cartItem) => cartItem.product.toString() !== item.productId
    );
    
    
    await cart.save();
    

    const populatedCart = await Cart.findById(cart._id).populate('items.product');
    
    if (!populatedCart) {
      throw new NotFoundError('Cart not found after update');
    }
    
   
    const cacheKey = `cart:${userId}`;
    await redisClient.setEx(cacheKey, CACHE_EXPIRY, JSON.stringify(populatedCart));
    
    return populatedCart;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError(`Failed to remove item from cart: ${(error as Error).message}`);
  }
};

export const clearCart = async (userId: string): Promise<void> => {
  try {

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return; 
    }
    
  
    cart.items = [];
    
    
    await cart.save();
    
  
    const cacheKey = `cart:${userId}`;
    await redisClient.setEx(cacheKey, CACHE_EXPIRY, JSON.stringify(cart));
  } catch (error) {
    throw new DatabaseError(`Failed to clear cart: ${(error as Error).message}`);
  }
};