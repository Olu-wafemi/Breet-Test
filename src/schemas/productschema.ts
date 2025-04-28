import { z } from 'zod';
import { Types } from 'mongoose';


const objectIdSchema = z.string().refine(
  val => Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId format' }
);


const parseNumber = (val: unknown, defaultValue?: number) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Number(val);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};


export const createProductSchema = z.object({
  name: z.string()
    .min(2, 'Product name must be at least 2 characters')
    .max(100, 'Product name cannot exceed 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters'),
  price: z.number()
    .positive('Price must be positive')
    .transform(val => Number(val.toFixed(2))),
  stockQuantity: z.number()
    .int('Stock quantity must be an integer')
    .nonnegative('Stock cannot be negative'),
  category: z.string()
    .min(2, 'Category must be at least 2 characters'),
  imageUrl: z.string()
    .url('Image URL must be a valid URL')
    .optional()
});


export const updateProductSchema = createProductSchema.partial();

export const productIdSchema = z.object({
  id: objectIdSchema
});


export const queryProductsSchema = z.object({
  page: z.union([
    z.number(),
    z.string().transform(val => parseNumber(val, 1))
  ]).default(1),
  
  limit: z.union([
    z.number(),
    z.string().transform(val => parseNumber(val, 10))
  ]).default(10),
  
  category: z.string().optional(),
  
  minPrice: z.union([
    z.number(),
    z.string().transform(val => parseNumber(val))
  ]).optional(),
  
  maxPrice: z.union([
    z.number(),
    z.string().transform(val => parseNumber(val))
  ]).optional(),
  
  sort: z.enum([
    'price_asc',
    'price_desc',
    'name_asc',
    'name_desc',
    'newest'
  ]).optional(),
  
  search: z.string().optional()
});



export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductIdParam = z.infer<typeof productIdSchema>;
export type QueryProductsParams = z.infer<typeof queryProductsSchema>;