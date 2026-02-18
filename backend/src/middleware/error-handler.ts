import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ApiResponse } from '../types';
import { I18nUtils } from '../utils/i18n';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const language = (request as any).language || 'en';
  
  // Log error
  request.log.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    body: request.body,
    query: request.query,
    params: request.params,
    headers: request.headers,
    userId: (request as any).user?.id
  });

  // Handle different error types
  let statusCode = 500;
  let message = I18nUtils.translate('general.server_error', language);
  let details: any = undefined;

  if (error.validation) {
    // Validation errors
    statusCode = 400;
    message = I18nUtils.translate('general.validation_error', language);
    details = error.validation.map((err: any) => ({
      field: err.instancePath || err.path,
      message: err.message,
      value: err.params?.allowedValues || err.value
    }));
  } else if (error.statusCode) {
    // HTTP errors
    statusCode = error.statusCode;
    message = error.message || I18nUtils.translate('general.error', language);
  } else if (error.code === '23505') {
    // PostgreSQL unique constraint violation
    statusCode = 409;
    message = I18nUtils.translate('general.conflict', language) || 'Resource already exists';
  } else if (error.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = I18nUtils.translate('general.foreign_key_violation', language) || 'Referenced resource not found';
  } else if (error.code === '23502') {
    // PostgreSQL not null violation
    statusCode = 400;
    message = I18nUtils.translate('general.required_field', language);
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = I18nUtils.translate('general.unauthorized', language);
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = I18nUtils.translate('general.forbidden', language);
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = I18nUtils.translate('general.not_found', language);
  }

  // Prepare error response
  const errorResponse: ApiResponse = {
    success: false,
    message,
    error: error.message,
    ...(details && { details })
  };

  // Add request ID if available
  if (request.id) {
    (errorResponse as any).requestId = request.id;
  }

  // Add timestamp
  (errorResponse as any).timestamp = new Date().toISOString();

  // Send error response
  reply.status(statusCode).send(errorResponse);
}

// Custom error classes
export class ValidationError extends Error {
  public statusCode = 400;
  public name = 'ValidationError';
  
  constructor(message: string, public details?: any[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  public statusCode = 401;
  public name = 'UnauthorizedError';
  
  constructor(message?: string) {
    super(message || 'Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  public statusCode = 403;
  public name = 'ForbiddenError';
  
  constructor(message?: string) {
    super(message || 'Forbidden');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  public statusCode = 404;
  public name = 'NotFoundError';
  
  constructor(message?: string) {
    super(message || 'Not found');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  public statusCode = 409;
  public name = 'ConflictError';
  
  constructor(message?: string) {
    super(message || 'Conflict');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  public statusCode = 429;
  public name = 'RateLimitError';
  
  constructor(message?: string) {
    super(message || 'Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends Error {
  public statusCode = 500;
  public name = 'DatabaseError';
  
  constructor(message?: string, public originalError?: any) {
    super(message || 'Database error');
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error {
  public statusCode = 502;
  public name = 'ExternalServiceError';
  
  constructor(message?: string, public service?: string) {
    super(message || 'External service error');
    this.name = 'ExternalServiceError';
  }
}

// Helper function to create standardized error responses
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  details?: any
): ApiResponse {
  return {
    success: false,
    message,
    error: message,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  };
}

// Helper function to handle async errors in routes
export function asyncHandler<T extends FastifyRequest>(
  handler: (request: T, reply: FastifyReply) => Promise<any>
) {
  return async (request: T, reply: FastifyReply) => {
    try {
      return await handler(request, reply);
    } catch (error) {
      throw error;
    }
  };
}
