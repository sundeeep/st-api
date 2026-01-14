import { SuccessResponse } from "../types/response.types";

/**
 * Creates a standardized success response
 */
export const successResponse = <T = unknown>(data?: T, message?: string): SuccessResponse<T> => {
  const response: SuccessResponse<T> = {
    success: true,
  };

  if (message) response.message = message;
  if (data !== undefined) response.data = data;

  return response;
};

/**
 * Creates a paginated success response
 * Central pagination utility - use this for all paginated responses
 */
export const paginatedResponse = <T = unknown>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): SuccessResponse<T[]> => {
  const response: SuccessResponse<T[]> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  if (message) response.message = message;

  return response;
};

/**
 * Creates a simple success message response (no data)
 */
export const messageResponse = (message: string): SuccessResponse => {
  return successResponse(undefined, message);
};
