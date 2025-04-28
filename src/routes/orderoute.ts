import express from 'express';
import { protect, admin } from '../middleware/auth';
import { validateParams, validate } from '../middleware/validate';
import {
  orderIdSchema,
  updateOrderStatusSchema
} from '../schemas/orderschema';
import {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus
} from '../controllers/ordercontroller';

const router = express.Router();

router.use(protect);


router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', validateParams(orderIdSchema), getOrderById);

router.put(
  '/:id/status',
  admin,
  validateParams(orderIdSchema),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;
