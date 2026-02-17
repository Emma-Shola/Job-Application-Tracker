const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const { 
  BadRequestError, 
  NotFoundError, 
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError 
} = require('../errors');

const errorHandlerMiddleware = (err, req, res, next) => {
  // Default error response
  let error = {
    success: false,
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || 'Something went wrong, please try again later',
    error: err.name || 'InternalServerError',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };

  // Add details if available
  if (err.details) error.details = err.details;
  if (err.errors) error.errors = err.errors;
  if (err.field) error.field = err.field;
  if (err.resource) error.resource = err.resource;
  if (err.id) error.id = err.id;

  // Handle specific error types
  if (err instanceof BadRequestError) {
    error.statusCode = StatusCodes.BAD_REQUEST;
  } else if (err instanceof UnauthorizedError) {
    error.statusCode = StatusCodes.UNAUTHORIZED;
  } else if (err instanceof ForbiddenError) {
    error.statusCode = StatusCodes.FORBIDDEN;
  } else if (err instanceof NotFoundError) {
    error.statusCode = StatusCodes.NOT_FOUND;
  } else if (err instanceof ConflictError) {
    error.statusCode = StatusCodes.CONFLICT;
  } else if (err instanceof ValidationError) {
    error.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError') {
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = 'VALIDATION_ERROR';
    error.message = 'Validation failed';
    error.errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }

  // Handle Mongoose duplicate key errors
  else if (err.code === 11000) {
    error.statusCode = StatusCodes.CONFLICT;
    error.code = 'DUPLICATE_KEY';
    error.message = 'Duplicate field value entered';
    const field = Object.keys(err.keyPattern)[0];
    error.field = field;
    error.value = err.keyValue[field];
  }

  // Handle Mongoose CastError (invalid ObjectId)
  else if (err.name === 'CastError') {
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = 'INVALID_ID';
    error.message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    error.statusCode = StatusCodes.UNAUTHORIZED;
    error.code = 'INVALID_TOKEN';
    error.message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    error.statusCode = StatusCodes.UNAUTHORIZED;
    error.code = 'TOKEN_EXPIRED';
    error.message = 'Authentication token has expired';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      user: req.user || 'No user'
    });
  } else {
    // Log important errors in production (but not all)
    if (error.statusCode >= 500) {
      console.error('🚨 Server Error:', {
        name: err.name,
        message: err.message,
        path: req.path,
        method: req.method,
        userId: req.user?.userId
      });
    }
  }

  // Send response
  return res.status(error.statusCode).json({
    success: false,
    status: error.statusCode,
    error: error.code,
    message: error.message,
    ...(error.details && { details: error.details }),
    ...(error.errors && { errors: error.errors }),
    ...(error.field && { field: error.field }),
    ...(error.resource && { resource: error.resource }),
    ...(error.id && { id: error.id }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      path: req.path,
      method: req.method 
    }),
  });
};

module.exports = errorHandlerMiddleware;