import { Elysia, t } from "elysia";
import { sendOTPHandler, verifyOTPHandler, resendOTPHandler } from "../controllers/otpController";

const otpRoutes = new Elysia({ prefix: "/otp" })
  .post("/send", sendOTPHandler, {
    body: t.Object({
      phoneNumber: t.String({
        minLength: 10,
        maxLength: 20,
        pattern: "^\\+?[1-9]\\d{1,14}$",
        description: "Phone number with country code (e.g., +919876543210)",
      }),
    }),
    detail: {
      tags: ["Authentication"],
      summary: "Send OTP to phone number",
      description: "Generates and sends OTP to the provided phone number",
    },
  })
  .post("/verify", verifyOTPHandler, {
    body: t.Object({
      phoneNumber: t.String({
        minLength: 10,
        maxLength: 20,
        description: "Phone number used for OTP",
      }),
      otp: t.String({
        minLength: 6,
        maxLength: 6,
        pattern: "^[0-9]{6}$",
        description: "6-digit OTP received via SMS",
      }),
      otpId: t.String({ format: "uuid", description: "OTP ID from send response" }),
    }),
    detail: {
      tags: ["Authentication"],
      summary: "Verify OTP and login",
      description: "Verifies OTP and returns JWT token for authenticated user",
    },
  })
  .post("/resend", resendOTPHandler, {
    body: t.Object({
      phoneNumber: t.String({
        minLength: 10,
        maxLength: 20,
        pattern: "^\\+?[1-9]\\d{1,14}$",
        description: "Phone number with country code",
      }),
    }),
    detail: {
      tags: ["Authentication"],
      summary: "Resend OTP",
      description: "Invalidates previous OTPs and sends a new one",
    },
  });

export default otpRoutes;
