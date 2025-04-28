import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../utils/errors';

export const validate = <T>(schema: z.ZodType<T>) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      return next(new BadRequestError(`Validation error: ${JSON.stringify(formattedErrors)}`));
    }
    next(error);
  }
};


export const validateQuery = <T>(schema: z.ZodType<T>) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.query = schema.parse(req.query) as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      return next(new BadRequestError(`Query validation error: ${JSON.stringify(formattedErrors)}`));
    }
    next(error);
  }
};


export const validateParams = <T>(schema: z.ZodType<T>) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.params = schema.parse(req.params) as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      return next(new BadRequestError(`Params validation error: ${JSON.stringify(formattedErrors)}`));
    }
    next(error);
  }
};