import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { env } from "../config/env.config";
import { UnauthorizedError } from "../utils/errors.util";
import type { JWTPayload } from "./auth.types";

/**
 * JWT instance
 */
const app = new Elysia().use(
  jwt({
    name: "jwt",
    secret: env.JWT_SECRET,
    exp: "15m", // Short-lived token
  })
);

const jwtMethods = app.decorator.jwt;

/**
 * Generate JWT token with sessionId
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  return await jwtMethods.sign(payload as any);
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const payload = await jwtMethods.verify(token);

    if (!payload) {
      throw UnauthorizedError("Invalid token");
    }

    const { userId, mobile, email, role, sessionId } = payload as any;

    if (!userId || !mobile || !sessionId) {
      throw UnauthorizedError("Invalid token payload");
    }

    return { userId, mobile, email, role, sessionId };
  } catch (error: any) {
    if (error.statusCode && error.errorCode) {
      throw error;
    }
    throw UnauthorizedError("Invalid or expired token");
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string {
  if (!authHeader) {
    throw UnauthorizedError("Authorization header missing");
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw UnauthorizedError("Invalid authorization header format. Use: Bearer <token>");
  }

  return parts[1];
}
