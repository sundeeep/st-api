import { Elysia, t } from "elysia";
import {
  sendOTPHandler,
  verifyOTPHandler,
  resendOTPHandler,
  logoutHandler,
  getProfileHandler,
  refreshTokenHandler,
} from "./auth.controller";
import { authenticate } from "./auth.middleware";

const authRoutes = new Elysia({ prefix: "/auth" })
  /**
   * Send OTP to mobile number
   */
  .post("/send-otp", sendOTPHandler, {
    body: t.Object({
      mobile: t.String({
        minLength: 10,
        maxLength: 10,
        pattern: "^[6-9]\\d{9}$",
        description: "10-digit Indian mobile number (e.g., 9876543210)",
      }),
    }),
    detail: {
      tags: ["Authentication"],
      summary: "Send OTP to mobile number",
      description:
        "Generates and sends OTP via MSG91 to the provided mobile number. Backend automatically adds +91 prefix.",
    },
  })

  /**
   * Verify OTP and login
   */
  .post("/verify-otp", verifyOTPHandler, {
    body: t.Object({
      mobile: t.String({
        minLength: 10,
        maxLength: 10,
        pattern: "^[6-9]\\d{9}$",
        description: "10-digit Indian mobile number (e.g., 9876543210)",
      }),
      otp: t.String({
        minLength: 6,
        maxLength: 6,
        pattern: "^[0-9]{6}$",
        description: "6-digit OTP received via SMS",
      }),
      otpId: t.String({ description: "OTP ID from send-otp response" }),
    }),
    detail: {
      tags: ["Authentication"],
      summary: "Verify OTP and login",
      description: "Verifies OTP and returns JWT token with session ID for authenticated user",
    },
  })

  /**
   * Resend OTP
   */
  .post("/resend-otp", resendOTPHandler, {
    body: t.Object({
      mobile: t.String({
        minLength: 10,
        maxLength: 10,
        pattern: "^[6-9]\\d{9}$",
        description: "10-digit Indian mobile number (e.g., 9876543210)",
      }),
      retryType: t.Optional(
        t.Union([t.Literal("text"), t.Literal("voice")], {
          description: "Retry type: text or voice",
        })
      ),
    }),
    detail: {
      tags: ["Authentication"],
      summary: "Resend OTP",
      description: "Resends OTP via SMS. Backend automatically adds +91 prefix.",
    },
  })

  /**
   * Logout
   */
  .post("/logout", logoutHandler, {
    detail: {
      tags: ["Authentication"],
      summary: "Logout",
      description: "Deletes the current session. Requires X-Session-Id header",
    },
  })

  /**
   * Get current user profile
   */
  .get(
    "/profile",
    async (context) => {
      const authContext = await authenticate(context);
      return getProfileHandler(authContext);
    },
    {
      detail: {
        tags: ["Authentication"],
        summary: "Get current user profile",
        description: "Returns the authenticated user's profile. Requires Authorization header",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  /**
   * Refresh access token
   */
  .post("/refresh", refreshTokenHandler, {
    detail: {
      tags: ["Authentication"],
      summary: "Refresh access token",
      description: "Get new access token using session ID. Requires X-Session-Id header",
    },
  });

export default authRoutes;
