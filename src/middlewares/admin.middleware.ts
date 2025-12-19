import type { Context, Elysia } from "elysia";
import { authenticate } from "./auth.middleware";
import { UnauthorizedError } from "../utils/errors.util";

interface AdminContext extends Context {
  user: {
    id: string;
    phoneNumber: string;
    phoneVerified: boolean;
    onboardingComplete: boolean;
    role: string;
  };
  userId: string;
}

export const requireAdmin = async (context: Context): Promise<AdminContext> => {
  const authContext = await authenticate(context as AdminContext);

  if (authContext.user?.role !== "admin") {
    throw UnauthorizedError("Admin access required");
  }

  return authContext as AdminContext;
};

export const adminPlugin = (app: Elysia) => {
  return app.derive(async (context: Context) => {
    await requireAdmin(context);
    return context;
  });
};
