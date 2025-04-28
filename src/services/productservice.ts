import { CreateProductInput, UpdateProductInput, QueryProductsParams } from '../schemas/productschema';
import { NotFoundError, DatabaseError } from '../utils/errors';
import { redisClient } from '../config/redis';
import Product, { IProduct } from '../models/product';


const CACHE_EXPIRY = 3600;

export const createProduct = async (productData: CreateProductInput): Promise<IProduct> => {
  try {
    const product = await Product.create(productData);
    
    // Invalidate product listing cache
    await redisClient.del('products:all');
    
    return product;
  } catch (error) {
    throw new DatabaseError(`Failed to create product: ${(error as Error).message}`);
  }
};

export const getAllProducts = async (queryParams: QueryProductsParams): Promise<{products: IProduct[], totalProducts: number, totalPages: number}> => {
  try {
    const { page = 1, limit = 10, category, minPrice, maxPrice, sort } = queryParams;
    
    
    const filters: any = {};
    
    if (category) {
      filters.category = category;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.price = {};
      if (minPrice !== undefined) filters.price.$gte = minPrice;
      if (maxPrice !== undefined) filters.price.$lte = maxPrice;
    }
    
   
    let sortOptions = {};
    
    switch (sort) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'name_asc':
        sortOptions = { name: 1 };
        break;
      case 'name_desc':
        sortOptions = { name: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 }; 
    }
    
    
    const cacheKey = `products:${JSON.stringify({ page, limit, filters, sortOptions })}`;
    
 
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
  
    const skip = (page - 1) * limit;
    
    const [products, totalProducts] = await Promise.all([
      Product.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filters)
    ]);
    
    const totalPages = Math.ceil(totalProducts / limit);
    
    const result = {
      products,
      totalProducts,
      totalPages
    };
    
   
    await redisClient.setEx(cacheKey, CACHE_EXPIRY, JSON.stringify(result));
    
    return result;
  } catch (error) {
    throw new DatabaseError(`Failed to fetch products: ${(error as Error).message}`);
  }
};

export const getProductById = async (productId: string): Promise<IProduct> => {
  try {
    // Try to fetch from cache first
    const cacheKey = `product:${productId}`;
    const cachedProduct = await redisClient.get(cacheKey);
    
    if (cachedProduct) {
      return JSON.parse(cachedProduct);
    }
    
    // If not in cache, fetch from database
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found`);
    }
    
    // Cache for future requests
    await redisClient.setEx(cacheKey, CACHE_EXPIRY, JSON.stringify(product));
    
    return product;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError(`Failed to get product: ${(error as Error).message}`);
  }
};

export const updateProduct = async (productId: string, updateData: UpdateProductInput): Promise<IProduct> => {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found`);
    }
    
    // Invalidate relevant caches
    await redisClient.del(`product:${productId}`);
    await redisClient.del('products:all');
    
    return product;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError(`Failed to update product: ${(error as Error).message}`);
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(productId);
    
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found`);
    }
    
  
    
    await redisClient.del(`product:${productId}`);
    await redisClient.del('products:all');
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError(`Failed to delete product: ${(error as Error).message}`);
  }
};