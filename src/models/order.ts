import mongoose, { Document, Schema } from 'mongoose';

/**
 * Order Item Interface
 * 
 * Represents an individual item in a completed order.
 * Captures product reference, quantity, and price at time of purchase.
 */
interface OrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

/**
 * Order Model Interface
 * 
 * ASSUMPTIONS & DESIGN DECISIONS:
 * 1. Orders are created from cart data
 * 2. Total amount is calculated and stored at order creation
 * 3. Timestamps track order creation and updates
 * 4. Orders are permanent records and cannot be deleted
 * 
 * @interface IOrder
 * @extends Document
 */
export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order Schema for MongoDB
 * 
 * TECHNICAL CHALLENGES ADDRESSED:
 * 1. Data Integrity: Stores complete order information including prices
 * 2. State Management: Uses status enum to track order lifecycle
 * 3. Performance: Multiple indexes for different query patterns
 * 4. Relationships: References to User and Product models
 */
const OrderSchema: Schema = new Schema(
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
    ],
    totalAmount: { 
      type: Number, 
      required: true 
    },
    status: { 
      type: String, 
      required: true, 
      enum: ['pending', 'processing', 'completed', 'cancelled'], 
      default: 'pending' 
    }
  },
  { timestamps: true }
);

// Index for retrieving user's orders
OrderSchema.index({ user: 1 });
// Index for filtering orders by status
OrderSchema.index({ status: 1 });
// Index for sorting by creation date
OrderSchema.index({ createdAt: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);