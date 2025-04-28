export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    errorCode: string;
    
    constructor(message: string, statusCode: number, errorCode?: string) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true; 
      this.errorCode = errorCode || this.constructor.name.replace('Error', '').toUpperCase();
      Error.captureStackTrace(this, this.constructor);
    }

   
    toJSON() {
      return {
        success: false,
        error: {
          code: this.errorCode,
          message: this.message,
        }
      };
    }
  }
  

  export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request', errorCode: string = 'BAD_REQUEST') {
      super(message, 400, errorCode);
    }
  }
  
  export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access', errorCode: string = 'UNAUTHORIZED') {
      super(message, 401, errorCode);
    }
  }
  
  export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden access', errorCode: string = 'FORBIDDEN') {
      super(message, 403, errorCode);
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND') {
      super(message, 404, errorCode);
    }
  }
  
  export class ConflictError extends AppError {
    constructor(message: string = 'Resource conflict', errorCode: string = 'CONFLICT') {
      super(message, 409, errorCode);
    }
  }
  
  
  export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error', errorCode: string = 'INTERNAL_SERVER_ERROR') {
      super(message, 500, errorCode);
    }
  }
  
  export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed', errorCode: string = 'DATABASE_ERROR') {
      super(message, 500, errorCode);
    }
  }
  
  
  
 
  export class InsufficientStockError extends AppError {
    constructor(message: string = 'Insufficient stock available', errorCode: string = 'INSUFFICIENT_STOCK') {
      super(message, 400, errorCode);
    }
  }
  
  export class PaymentError extends AppError {
    constructor(message: string = 'Payment processing failed', errorCode: string = 'PAYMENT_ERROR') {
      super(message, 400, errorCode);
    }
  }
  