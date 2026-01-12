import type { Context } from "elysia";
import { authenticate } from "../auth/auth.middleware";
import { UnauthorizedError } from "../utils/errors.util";
import type { AuthenticatedContext } from "../auth/auth.types";

export const requireAdmin = async (context: Context): Promise<AuthenticatedContext> => {
  const authContext = await authenticate(context);

  if (authContext.user?.role !== "admin") {
    throw UnauthorizedError("Admin access required");
  }

  return authContext;
};
