import { Context } from "elysia";
import * as profileService from "./student.service";
import { successResponse } from "../../../utils/response.util";
import type { SuccessResponse } from "../../../types/response.types";
import type { AuthenticatedContext } from "../../../auth/auth.types";
import type { UpdateProfileBody } from "./student.types";

export const updateProfileHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const body = context.body as UpdateProfileBody;
  const userId = context.user.id;

  const result = await profileService.updateProfile(userId, body);
  return successResponse(result, "Profile updated successfully");
};