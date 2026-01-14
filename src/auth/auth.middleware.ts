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

    // 1. Verify JWT token (signature, expiry)
    const payload = await verifyToken(token);

    // 2. Verify session still exists in Redis (prevents use of logged-out tokens)
    const session = await getSession(payload.sessionId);
    if (!session) {
      throw UnauthorizedError("Session expired or invalid. Please login again.");
    }

    // 3. Verify session userId matches JWT userId (security check)
    if (session.userId !== payload.userId) {
      throw UnauthorizedError("Session mismatch. Please login again.");
    }

    // 4. Get user data
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
