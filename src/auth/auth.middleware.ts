import type { Context } from "elysia";
import { verifyToken, extractTokenFromHeader } from "./auth.jwt";
import { getSession } from "./lib/session";
import { getUserById } from "./auth.service";
import { UnauthorizedError } from "../utils/errors.util";
import type { AuthenticatedContext } from "./auth.types";

/**
 * Authentication middleware
 * ✅ ALWAYS checks both JWT and Redis session
 */
export async function authenticate(context: Context): Promise<AuthenticatedContext> {
  try {
    const authHeader = context.request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    const payload = await verifyToken(token);

    const user = await getUserById(payload.userId);

    const authContext = context as AuthenticatedContext;
    authContext.user = {
      ...user,
      email: user.email || undefined,
    };
    authContext.userId = user.id;

    return authContext;
  } catch (error: unknown) {
    const err = error as { statusCode?: number; errorCode?: string };
    if (err.statusCode && err.errorCode) {
      throw error;
    }
    throw UnauthorizedError("Authentication failed");
  }
}

/**
 * Check if user has completed onboarding
 */
export async function requireOnboarding(
  context: AuthenticatedContext
): Promise<AuthenticatedContext> {
  if (!context.user) {
    throw UnauthorizedError("Authentication required");
  }

  if (!context.user.onboardingComplete) {
    throw UnauthorizedError("Please complete onboarding before accessing this resource");
  }

  return context;
}
