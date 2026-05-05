/**
 * Centralized Error Handling and Logging
 */

import { logger } from '@/lib/logger';

export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  NETWORK = 'network',
}

export interface AppError {
  type: ErrorType;
  message: string;
  name: string;
  stack?: string;
  statusCode: number;
  details?: any;
  userMessage?: string;
  timestamp: Date;
  requestId?: string;
}


export class APIError extends Error implements AppError {
  type: ErrorType;
  statusCode: number;
  details?: any;
  userMessage?: string;
  timestamp: Date;
  requestId?: string;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number = 500,
    details?: any,
    userMessage?: string
  ) {
    super(message);
    this.name = 'APIError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.userMessage = userMessage || message;
    this.timestamp = new Date();
    this.requestId = crypto.randomUUID();
  }
}

/**
 * Create standardized error responses
 */
export function createErrorResponse(error: AppError | Error) {
  if (error instanceof APIError) {
    return {
      error: {
        type: error.type,
        message: error.userMessage,
        statusCode: error.statusCode,
        requestId: error.requestId,
        timestamp: error.timestamp.toISOString(),
        ...(process.env.NODE_ENV === 'development' && { details: error.details }),
      },
    };
  }

  // Generic error
  return {
    error: {
      type: ErrorType.SERVER,
      message: 'An unexpected error occurred',
      statusCode: 500,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message,
        stack: error.stack,
      }),
    },
  };
}

/**
 * Log errors to console (in production, this would send to monitoring service)
 */
export function logError(error: AppError | Error, context?: any) {
  const errorData = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      name: error.name,
      ...(error instanceof APIError && {
        type: error.type,
        statusCode: error.statusCode,
        requestId: error.requestId,
        details: error.details,
      }),
    },
    context,
    environment: process.env.NODE_ENV,
  };

  logger.error('[ERROR]', errorData);

  // In production, send to monitoring service (Sentry, DataDog, etc.)
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: context });
  }
}

/**
 * Error factory functions
 */
export const Errors = {
  validation: (message: string, details?: any) =>
    new APIError(ErrorType.VALIDATION, message, 400, details, 'Invalid input data'),
  
  authentication: (message: string = 'Authentication required') =>
    new APIError(ErrorType.AUTHENTICATION, message, 401, undefined, 'Please sign in to continue'),
  
  authorization: (message: string = 'Insufficient permissions') =>
    new APIError(ErrorType.AUTHORIZATION, message, 403, undefined, 'You do not have permission to perform this action'),
  
  notFound: (resource: string = 'Resource') =>
    new APIError(ErrorType.NOT_FOUND, `${resource} not found`, 404, undefined, 'The requested resource was not found'),
  
  conflict: (message: string, details?: any) =>
    new APIError(ErrorType.CONFLICT, message, 409, details, 'This action conflicts with existing data'),
  
  rateLimit: (retryAfter?: number) =>
    new APIError(
      ErrorType.RATE_LIMIT,
      'Rate limit exceeded',
      429,
      { retryAfter },
      'Too many requests. Please try again later'
    ),
  
  server: (message: string = 'Internal server error', details?: any) =>
    new APIError(ErrorType.SERVER, message, 500, details, 'Something went wrong. Please try again'),
  
  network: (message: string = 'Network error') =>
    new APIError(ErrorType.NETWORK, message, 503, undefined, 'Unable to connect to the server'),
};

/**
 * Wrap async functions with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: any
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    if (error instanceof APIError) {
      logError(error, context);
      return { error };
    }
    
    const apiError = Errors.server(error instanceof Error ? error.message : 'Unknown error');
    logError(apiError, context);
    return { error: apiError };
  }
}
