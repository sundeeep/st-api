import { ErrorResponse, ErrorCode, HttpStatus } from "../types/response.types";
import { env } from "../config/env.config";

interface ErrorContext {
  code: string;
  error: any;
  set: {
    status?: number | string;
  };
  path: string;
}

export const globalErrorHandler = ({ code, error, set, path }: ErrorContext): ErrorResponse => {
  // console.error("Error occurred:", error);

  // Handle custom errors (with statusCode and errorCode)
  if (error.statusCode && error.errorCode) {
    set.status = error.statusCode;
    return {
      success: false,
      error: {
        code: error.errorCode,
        message: error.message,
        details: error.details,
        ...(env.isDevelopment() && { stack: error.stack }),
      },
      timestamp: new Date().toISOString(),
      path,
    };
  }

  // Handle validation errors from Elysia/Zod
  if (code === "VALIDATION" || error.name === "ValidationError") {
    set.status = HttpStatus.BAD_REQUEST;
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Validation failed",
        details: error.all || error.errors || error.message,
        ...(env.isDevelopment() && { stack: error.stack }),
      },
      timestamp: new Date().toISOString(),
      path,
    };
  }

  // Handle NOT_FOUND errors
  if (code === "NOT_FOUND") {
    set.status = HttpStatus.NOT_FOUND;
    return {
      success: false,
      error: {
        code: ErrorCode.NOT_FOUND,
        message: "Route not found",
        details: `The requested route ${path} does not exist`,
      },
      timestamp: new Date().toISOString(),
      path,
    };
  }

  // Handle parse errors
  if (code === "PARSE") {
    set.status = HttpStatus.BAD_REQUEST;
    return {
      success: false,
      error: {
        code: ErrorCode.BAD_REQUEST,
        message: "Invalid request body",
        details: error.message,
      },
      timestamp: new Date().toISOString(),
      path,
    };
  }

  // Handle database errors (PostgresError, etc.)
  if (
    error.name === "PostgresError" ||
    error.code === "42703" ||
    error.cause?.name === "PostgresError"
  ) {
    const dbErrorCode = error.code || error.cause?.code;
    const dbErrorMessage = error.message || error.cause?.message || "";

    // Detect UUID validation errors (invalid input syntax for type uuid)
    // PostgreSQL error code: 22P02
    if (dbErrorCode === "22P02" && dbErrorMessage.includes("uuid")) {
      set.status = HttpStatus.BAD_REQUEST;
      return {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Invalid ID format. Please provide a valid UUID.",
          ...(env.isDevelopment() && {
            details: {
              message: dbErrorMessage,
              code: dbErrorCode,
            },
            stack: error.stack,
          }),
        },
        timestamp: new Date().toISOString(),
        path,
      };
    }

    // Detect missing column errors (schema mismatch)
    // PostgreSQL error code: 42703
    if (dbErrorCode === "42703") {
      // Log full error for debugging (server-side only)
      console.error("Database schema error:", {
        message: dbErrorMessage,
        code: dbErrorCode,
        query: error.query,
        path,
      });

      set.status = HttpStatus.INTERNAL_SERVER_ERROR;
      return {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: "Database schema mismatch. Please contact support.",
          // Only show details in development
          ...(env.isDevelopment() && {
            details: {
              message: dbErrorMessage,
              code: dbErrorCode,
              query: error.query,
            },
            stack: error.stack,
          }),
        },
        timestamp: new Date().toISOString(),
        path,
      };
    }

    // Other database errors
    // Log full error for debugging (server-side only)
    console.error("Database error:", {
      message: dbErrorMessage,
      code: dbErrorCode,
      query: error.query,
      path,
    });

    set.status = HttpStatus.INTERNAL_SERVER_ERROR;
    return {
      success: false,
      error: {
        code: ErrorCode.DATABASE_ERROR,
        message: "A database error occurred. Please try again later.",
        // Only show details in development
        ...(env.isDevelopment() && {
          details: {
            message: dbErrorMessage,
            code: dbErrorCode,
            query: error.query,
          },
          stack: error.stack,
        }),
      },
      timestamp: new Date().toISOString(),
      path,
    };
  }

  // Handle unknown errors
  set.status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;

  // Log error for debugging (server-side only)
  console.error("Unhandled error:", {
    message: error.message,
    name: error.name,
    code: error.code,
    path,
    stack: error.stack,
  });

  return {
    success: false,
    error: {
      code: error.errorCode || ErrorCode.INTERNAL_ERROR,
      message: env.isDevelopment()
        ? error.message || "An unexpected error occurred"
        : "An unexpected error occurred. Please try again later.",
      // Only show details in development
      ...(env.isDevelopment() && {
        details: error,
        stack: error.stack,
      }),
    },
    timestamp: new Date().toISOString(),
    path,
  };
};
