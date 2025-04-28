import mongoose, { Document, Schema } from 'mongoose';

/**
 * Cart Item Interface
 * 
 * Represents an individual item in a user's shopping cart.
 * Contains product reference, quantity, and price at time of addition.
 */
interface CartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

/**
 * Cart Model Interface
 * 
 * ASSUMPTIONS & DESIGN DECISIONS:
 * 1. Each user has only one active cart
 * 2. Cart items store the price at time of addition (not dynamic pricing)
 * 3. Quantity must be at least 1 for all cart items
 * 4. Cart is retained between sessions until order is created
 * 5. Timestamps track cart creation and updates
 * 
 * @interface ICart
 * @extends Document
 */
export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: CartItem[];
  updatedAt: Date;
}

/**
 * Cart Schema for MongoDB
 * 
 * TECHNICAL CHALLENGES ADDRESSED:
 * 1. Performance: Indexed by user for quick retrieval
 * 2. Data Validation: Enforces minimum quantity rules

 */
const CartSchema: Schema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    items: [
      {
        product: { 
          type: Schema.Types.ObjectId, 
          ref: 'Product', 
          required: true 
        },
        quantity: { 
          type: Number, 
          required: true, 
          min: 1 
        },
        price: { 
          type: Number, 
          required: true 
        }
      }
    ]
  },
  { timestamps: true }
);

// Index for quick cart lookup by user
CartSchema.index({ user: 1 });

export default mongoose.model<ICart>('Cart', CartSchema);