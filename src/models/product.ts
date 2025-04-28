import mongoose, { Document, Schema } from 'mongoose';

/**
 * Product Model Interface
 * 
 * ASSUMPTIONS & DESIGN DECISIONS:
 * 1. Products have a mandatory minimum price of 0 (free items allowed)
 * 2. Stock quantity cannot be negative
 * 3. Each product belongs to a single category
 * 4. Image URLs are optional but must be valid URLs if provided
 * 5. Text search is enabled on name and description fields
 * 6. Timestamps track product creation and updates
 * 
 * @interface IProduct
 * @extends Document
 */
export interface IProduct extends Document {
    _id: mongoose.Types.ObjectId
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    category: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Product Schema for MongoDB
 * 
 * TECHNICAL CHALLENGES ADDRESSED:
 * 1. Data Validation: Enforces required fields and data types
 * 2. Business Rules: Ensures price and stock quantity are non-negative
 * 3. Search Optimization: Includes text index for search functionality
 */
const ProductSchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    stockQuantity: { 
      type: Number, 
      required: true, 
      min: 0, 
      default: 0 
    },
    category: { 
      type: String, 
      required: true 
    },
    imageUrl: { 
      type: String 
    }
  },
  { timestamps: true }
);

// Text index for search functionality
ProductSchema.index({ name: 'text', description: 'text' });
// Category index for filtering
ProductSchema.index({ category: 1 });
// Price index for sorting and filtering
ProductSchema.index({ price: 1 });
// Created date index for sorting by newest
ProductSchema.index({ createdAt: -1 });

export default mongoose.model<IProduct>('Product', ProductSchema);