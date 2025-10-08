import { Response } from 'express';

// Standard API response format
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Success responses
export const sendSuccess = <T>(res: Response, data?: T, message?: string, statusCode: number = 200) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message: string = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

export const sendUpdated = <T>(res: Response, data: T, message: string = 'Resource updated successfully') => {
  return sendSuccess(res, data, message, 200);
};

export const sendDeleted = (res: Response, message: string = 'Resource deleted successfully') => {
  return sendSuccess(res, null, message, 200);
};

// Error responses
export const sendError = (res: Response, message: string, statusCode: number = 400, errors?: any[]) => {
  const response: ApiResponse = {
    success: false,
    error: message,
    errors,
  };
  return res.status(statusCode).json(response);
};

export const sendNotFound = (res: Response, message: string = 'Resource not found') => {
  return sendError(res, message, 404);
};

export const sendUnauthorized = (res: Response, message: string = 'Unauthorized access') => {
  return sendError(res, message, 401);
};

export const sendForbidden = (res: Response, message: string = 'Forbidden access') => {
  return sendError(res, message, 403);
};

export const sendValidationError = (res: Response, errors: any[], message: string = 'Validation failed') => {
  return sendError(res, message, 422, errors);
};

export const sendServerError = (res: Response, message: string = 'Internal server error') => {
  return sendError(res, message, 500);
};

// Pagination helper
export const sendPaginated = <T>(
  res: Response, 
  data: T[], 
  page: number, 
  limit: number, 
  total: number, 
  message?: string
) => {
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  return res.json(response);
};

// Handle async route errors
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
