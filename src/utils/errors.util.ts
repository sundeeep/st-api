import { ErrorCode, HttpStatus } from "../types/response.types";

/**
 * Create error with status code and error code
 */
export const createError = (
  message: string,
  statusCode: HttpStatus,
  errorCode: ErrorCode,
  details?: any
) => {
  const error = new Error(message) as any;
  error.statusCode = statusCode;
  error.errorCode = errorCode;
  error.details = details;
  return error;
};

// Validation error (400)
export const ValidationError = (message: string, details?: any) =>
  createError(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, details);

// Not found error (404)
export const NotFoundError = (message: string, details?: any) =>
  createError(message, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, details);

// Unauthorized error (401)
export const UnauthorizedError = (message: string, details?: any) =>
  createError(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, details);

// Forbidden error (403)
export const ForbiddenError = (message: string, details?: any) =>
  createError(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, details);

// Conflict error (409)
export const ConflictError = (message: string, details?: any) =>
  createError(message, HttpStatus.CONFLICT, ErrorCode.CONFLICT, details);

// Bad request error (400)
export const BadRequestError = (message: string, details?: any) =>
  createError(message, HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, details);

// Database error (500)
export const DatabaseError = (message: string, details?: any) =>
  createError(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.DATABASE_ERROR, details);

// Internal server error (500)
export const InternalServerError = (message: string, details?: any) =>
  createError(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, details);
