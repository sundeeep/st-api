import type { Context } from "elysia";
import * as userService from "./admin.service";
import { paginatedResponse } from "../../utils/response.util";
import type { SuccessResponse } from "../../types/response.types";
import type { UserFilters } from "./admin.types";

export const getUsersHandler = async (context: Context): Promise<SuccessResponse> => {
  const filters: UserFilters = {
    role: context.query?.role as "student" | "admin" | undefined,
    isActive: context.query?.isActive as "true" | "false" | undefined,
    onboardingComplete: context.query?.onboardingComplete as "true" | "false" | undefined,
    search: context.query?.search as string | undefined,
    page: context.query?.page as string | undefined,
    limit: context.query?.limit as string | undefined,
  };

  const result = await userService.getUsers(filters);

  return paginatedResponse(
    result.users,
    parseInt(filters.page || "1"),
    parseInt(filters.limit || "10"),
    result.total,
    "Users fetched successfully"
  );
};
