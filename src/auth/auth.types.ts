import type { Context } from "elysia";

/**
 * Request body types
 */
export interface SendOTPBody {
  mobile: string;
}

export interface VerifyOTPBody {
  mobile: string;
  otp: string;
  otpId: string;
}

export interface ResendOTPBody {
  mobile: string;
  retryType?: "text" | "voice";
}

/**
 * JWT Payload
 */
export interface JWTPayload {
  userId: string;
  mobile: string;
  email?: string;
  role: string;
  sessionId: string; // ✅ CRITICAL: sessionId in JWT
}

/**
 * Session data stored in Redis
 */
export interface SessionData {
  userId: string;
  mobile: string;
  email?: string;
  role: string;
  createdAt: number;
  lastActivity: number;
}

/**
 * Authenticated context (after middleware)
 */
export interface AuthenticatedContext extends Context {
  user: {
    id: string;
    mobile: string;
    email?: string;
    role: string;
    onboardingComplete: boolean;
  };
  userId: string;
}

/**
 * Response types
 */
export interface OTPResponse {
  mobile: string;
  otpId: string;
  expiresIn: number;
}

export interface LoginResponse {
  accessToken: string;
  sessionId: string;
  user: {
    id: string;
    mobile: string;
    email?: string;
    fullName?: string;
    isNewUser: boolean;
    onboardingComplete: boolean;
    onboardingStep: number;
  };
}
