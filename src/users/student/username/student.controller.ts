import { Context } from "elysia";
import * as usernameService from "./student.service";
import { successResponse } from "../../../utils/response.util";
import type { SuccessResponse } from "../../../types/response.types";
import type { AuthenticatedContext } from "../../../auth/auth.types";
import type { UpdateUsernameBody } from "./student.types";

export const updateUsernameHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const body = context.body as UpdateUsernameBody;
  const userId = context.user.id;

  const result = await usernameService.updateUsername(userId, body.username);
  return successResponse(result, "Username updated successfully");
};