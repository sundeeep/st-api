import { SuccessResponse } from "../types/response.types";

/**
 * Creates a standardized success response
 */
export const successResponse = <T = any>(
  data?: T,
  message?: string,
  meta?: any
): SuccessResponse<T> => {
  const response: SuccessResponse<T> = {
    success: true,
  };

  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  if (meta) response.meta = meta;

  return response;
};

/**
 * Creates a paginated success response
 */
export const paginatedResponse = <T = any>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): SuccessResponse<T[]> => {
  return successResponse(data, message, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

/**
 * Creates a simple success message response (no data)
 */
export const messageResponse = (message: string): SuccessResponse => {
  return successResponse(undefined, message);
};
