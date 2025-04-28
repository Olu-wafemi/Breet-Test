import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import mongoose from 'mongoose';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncFunction) => 
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const isTrustedError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  console.error(`[ERROR] ${new Date().toISOString()} - [${req.method} ${req.path}]`, {
    userId: req.user?.id || 'unauthenticated',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    errorMessage: err.message,
    errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  let statusCode = 500;
  let message = 'Something went wrong';
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let details = undefined;
  
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.constructor.name.replace('Error', '').toUpperCase();
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    errorCode = 'VALIDATION_ERROR';
    
    details = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
  } else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
    errorCode = 'DUPLICATE_ENTRY';
    
    const field = Object.keys((err as any).keyValue)[0];
    details = { field };
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details: details || undefined
    }
  });
  
  
  if (!isTrustedError(err)) {
    console.error('UNHANDLED ERROR:', err);
    
   
    if (process.env.NODE_ENV === 'production') {
        console.error('UNHANDLED ERROR:', err);
    }
  }
};