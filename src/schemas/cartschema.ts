import { z } from 'zod';
import { Types } from 'mongoose';


const objectIdSchema = z.string().refine(
  val => Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId format' }
);


export const addToCartSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive')
});


export const updateCartItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive')
});

export const removeFromCartSchema = z.object({
  productId: objectIdSchema
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>;