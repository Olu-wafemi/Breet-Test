import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authservice';
import { asyncHandler } from '../middleware/errorhandler';
import { RegisterUserInput, LoginUserInput } from '../schemas/userschema';

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userData = req.body as RegisterUserInput;
  const { user, token } = await authService.registerUser(userData);
  
  res.status(201).json({
    success: true,
    data: {
      user,
      token
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const credentials = req.body as LoginUserInput;
  const { user, token } = await authService.loginUser(credentials);
  
  res.status(200).json({
    success: true,
    data: {
      user,
      token
    }
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});