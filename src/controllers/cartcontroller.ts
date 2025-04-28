import { Request, Response, NextFunction } from 'express';
import * as cartService from '../services/cartservice';
import { asyncHandler } from '../middleware/errorhandler';
import { AddToCartInput, UpdateCartItemInput, RemoveFromCartInput } from '../schemas/cartschema';

export const getCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  const cart = await cartService.getCart(userId);
  
  res.status(200).json({
    success: true,
    data: cart
  });
});

export const addToCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  const item = req.body as AddToCartInput;
  const cart = await cartService.addToCart(userId, item);
  
  res.status(200).json({
    success: true,
    data: cart
  });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  const item = req.body as UpdateCartItemInput;
  const cart = await cartService.updateCartItem(userId, item);
  
  res.status(200).json({
    success: true,
    data: cart
  });
});

export const removeFromCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  const item = req.body as RemoveFromCartInput;
  const cart = await cartService.removeFromCart(userId, item);
  
  res.status(200).json({
    success: true,
    data: cart
  });
});

export const clearCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  await cartService.clearCart(userId);
  
  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully'
  });
});