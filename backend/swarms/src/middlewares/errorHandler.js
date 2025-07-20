import { NODE_ENV } from '../config/environment.js';

// Custom class for application errors
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware to handle Sequelize errors
const handleSequelizeError = (err) => {
  let message = 'Database error';
  let statusCode = 500;

  // Validation error
  if (err.name === 'SequelizeValidationError') {
    message = err.errors.map(e => e.message).join(', ');
    statusCode = 400;
  }
  
  // Unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    message = 'Record already exists';
    statusCode = 409;
  }
  
  // Foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    message = 'Invalid database reference';
    statusCode = 400;
  }
  
  // Connection error
  if (err.name === 'SequelizeConnectionError') {
    message = 'Database connection error';
    statusCode = 503;
  }

  return new AppError(message, statusCode);
};

// Middleware to handle JWT errors
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your session has expired. Please log in again', 401);
};

// Send error in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Send error in production
const sendErrorProd = (err, res) => {
  // Operational error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming error: don't leak error details to client
    console.error('ERROR 💥', err);
    
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

// Main error handling middleware
const errorHandler = (err, req, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle different types of errors
    if (err.name === 'SequelizeValidationError' || 
        err.name === 'SequelizeUniqueConstraintError' ||
        err.name === 'SequelizeForeignKeyConstraintError' ||
        err.name === 'SequelizeConnectionError') {
      error = handleSequelizeError(error);
    }
    
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, res);
  }
};

// Middleware to catch not found routes
export const notFound = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(err);
};

// Function to catch async errors
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default errorHandler;