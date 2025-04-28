import { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/orderservice';
import { asyncHandler } from '../middleware/errorhandler';


export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id as string;
  const order = await orderService.createOrder(userId);
  res.status(201).json({
    success: true,
    data: order
  });
});


export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id as string;
  const orderId = req.params.id;
  const order = await orderService.getOrderById(orderId, userId);
  res.status(200).json({
    success: true,
    data: order
  });
});

export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id as string;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const { orders, totalOrders, totalPages } = await orderService.getUserOrders(userId, page, limit);

  res.status(200).json({
    success: true,
    count: orders.length,
    totalOrders,
    totalPages,
    currentPage: page,
    data: orders
  });
});


export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const { status } = req.body as { status: string };
  const updatedOrder = await orderService.updateOrderStatus(orderId, status);

  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});
