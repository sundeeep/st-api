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
    // 1. Get Authorization header
    const authHeader = context.request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    // 2. Verify JWT
    const payload = await verifyToken(token);

    // 3. Get sessionId from header
    const sessionId = context.request.headers.get("x-session-id");
    if (!sessionId) {
      throw UnauthorizedError("Missing X-Session-Id header");
    }

    // 4. ✅ CRITICAL: Check Redis session
    const session = await getSession(sessionId);
    if (!session) {
      throw UnauthorizedError("Session expired or invalid");
    }

    // 5. Verify sessionId matches JWT
    if (payload.sessionId !== sessionId) {
      throw UnauthorizedError("Session mismatch");
    }

    // 6. Verify userId matches
    if (payload.userId !== session.userId) {
      throw UnauthorizedError("User mismatch");
    }

    // 7. Get user from database
    const user = await getUserById(session.userId);

    // 8. Attach user to context (convert null to undefined for consistency)
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
