import { z } from 'zod';
import { Types } from 'mongoose';


const objectIdSchema = z.string().refine(
  val => Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId format' }
);




export const orderIdSchema = z.object({
  id: objectIdSchema
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled'])
});


export const queryOrdersSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});


export type OrderIdParam = z.infer<typeof orderIdSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type QueryOrdersParams = z.infer<typeof queryOrdersSchema>;