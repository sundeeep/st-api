import { AUTH_CONFIG } from "../auth.config";

const MSG91_BASE_URL = AUTH_CONFIG.MSG91.BASE_URL;

interface MSG91Response {
  type: string;
  message: string;
  request_id?: string;
}

interface OTPResult {
  success: boolean;
  message: string;
  requestId?: string;
}

/**
 * Send OTP via MSG91 (with custom OTP)
 */
export async function sendOTP(phone: string, otp: string): Promise<OTPResult> {
  try {
    const response = await fetch(`${MSG91_BASE_URL}/otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: process.env.MSG91_AUTH_KEY!,
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID!,
        mobile: phone,
        otp: otp, // ✅ Send our custom OTP
        otp_expiry: AUTH_CONFIG.OTP.EXPIRY_MINUTES,
      }),
    });

    const data: MSG91Response = await response.json();

    if (data.type === "success") {
      return {
        success: true,
        message: "OTP sent successfully",
        requestId: data.request_id,
      };
    }

    throw new Error(data.message || "Failed to send OTP");
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to send OTP",
    };
  }
}

/**
 * Verify OTP via MSG91
 * Note: We don't use MSG91's verify API since we verify against our hash in Redis
 * This function is kept for future reference if needed
 */

/**
 * Resend OTP via MSG91
 * Note: For custom OTP, we just send a new OTP instead of using retry API
 */
export async function resendOTP(phone: string, otp: string): Promise<OTPResult> {
  // For custom OTP, we send a new OTP instead of using retry endpoint
  return sendOTP(phone, otp);
}
