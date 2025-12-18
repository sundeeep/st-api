import { Context } from "elysia";
import { verifyToken, extractTokenFromHeader } from "../services/jwt.service";
import { getUserById } from "../services/user.service";
import { UnauthorizedError, NotFoundError } from "../utils/errors.util";

/**
 * Authenticate user from JWT token
 * Attaches user data to request context
 */
export const authenticate = async (context: any) => {
  try {
    // Extract token from Authorization header
    const authHeader = context.request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    // Verify token and get payload
    const payload = await verifyToken(token);

    // Get user from database
    const user = await getUserById(payload.userId);

    if (!user) {
      throw NotFoundError("User not found");
    }

    // Check if phone is verified
    if (!user.phoneVerified) {
      throw UnauthorizedError("Phone number not verified");
    }

    // Attach user to context
    context.user = user;
    context.userId = user.id;

    return context;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      throw error;
    }
    throw UnauthorizedError("Authentication failed");
  }
};

/**
 * Check if user has completed onboarding
 */
export const requireOnboarding = async (context: any) => {
  if (!context.user) {
    throw UnauthorizedError("Authentication required");
  }

  if (!context.user.onboardingComplete) {
    throw UnauthorizedError("Please complete onboarding before accessing this resource");
  }

  return context;
};

/**
 * Elysia plugin for authentication
 */
export const authPlugin = (app: any) => {
  return app.derive(async (context: any) => {
    await authenticate(context);
    return context;
  });
};
