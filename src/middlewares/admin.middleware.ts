import { authenticate } from "./auth.middleware";
import { UnauthorizedError } from "../utils/errors.util";

export const requireAdmin = async (context: any) => {
  await authenticate(context);

  if (context.user.role !== "admin") {
    throw UnauthorizedError("Admin access required");
  }

  return context;
};

export const adminPlugin = (app: any) => {
  return app.derive(async (context: any) => {
    await requireAdmin(context);
    return context;
  });
};
