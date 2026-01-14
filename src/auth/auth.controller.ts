import type { Context } from "elysia";
import * as authService from "./auth.service";
import { successResponse, messageResponse } from "../utils/response.util";
import type { SuccessResponse } from "../types/response.types";
import type { SendOTPBody, VerifyOTPBody, ResendOTPBody, AuthenticatedContext } from "./auth.types";
import { generateToken } from "./auth.jwt";
import { AUTH_CONFIG } from "./auth.config";
import { UnauthorizedError } from "../utils/errors.util";

/**
 * Send OTP to mobile number
 */
export const sendOTPHandler = async (context: Context): Promise<SuccessResponse> => {
  const body = context.body as SendOTPBody;
  const result = await authService.sendOTP(body.mobile);
  return successResponse(result, "OTP sent successfully");
};

/**
 * Verify OTP and login
 */
export const verifyOTPHandler = async (context: Context): Promise<SuccessResponse> => {
  const body = context.body as VerifyOTPBody;
  const result = await authService.verifyOTPAndLogin(body.mobile, body.otp, body.otpId);

  // Generate JWT with sessionId
  const accessToken = await generateToken({
    userId: result.user.id,
    mobile: result.user.mobile!,
    email: result.user.email,
    role: AUTH_CONFIG.USER.DEFAULT_ROLE,
    sessionId: result.sessionId,
  });

  return successResponse(
    {
      accessToken,
      sessionId: result.sessionId,
      user: result.user,
    },
    "Login successful"
  );
};

/**
 * Resend OTP
 */
export const resendOTPHandler = async (context: Context): Promise<SuccessResponse> => {
  const body = context.body as ResendOTPBody;
  const result = await authService.resendOTP(body.mobile, body.retryType);
  return successResponse(result, "OTP resent successfully");
};

/**
 * Logout (delete session)
 */
export const logoutHandler = async (context: Context): Promise<SuccessResponse> => {
  const sessionId = context.request.headers.get("x-session-id");

  if (!sessionId) {
    throw UnauthorizedError("No session found. Please provide X-Session-Id header.");
  }

  const deleted = await authService.logout(sessionId);

  if (!deleted) {
    throw UnauthorizedError("Session not found or already logged out.");
  }

  return messageResponse("Logged out successfully");
};

/**
 * Get current user profile
 */
export const getProfileHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  return successResponse(context.user, "User profile fetched successfully");
};

/**
 * Refresh access token
 */
export const refreshTokenHandler = async (context: Context): Promise<SuccessResponse> => {
  const sessionId = context.request.headers.get("x-session-id");

  if (!sessionId) {
    throw UnauthorizedError("Missing X-Session-Id header");
  }

  const tokenData = await authService.refreshAccessToken(sessionId);
  const accessToken = await generateToken(tokenData);

  return successResponse(
    {
      accessToken,
      sessionId: tokenData.sessionId,
    },
    "Token refreshed successfully"
  );
};
