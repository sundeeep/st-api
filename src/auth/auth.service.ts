import { eq } from "drizzle-orm";
import { db } from "../db";
import { usersProfile, type NewUserProfile } from "./auth.schema";
import { sendOTP as sendMsg91OTP, resendOTP as resendMsg91OTP } from "./lib/msg91";
import {
  createSession,
  deleteSession,
  checkOTPRateLimit,
  trackOTPAttempt,
  resetOTPAttempts,
  storeOTP,
  getOTP,
  incrementOTPAttempts,
  deleteOTP,
} from "./lib/session";
import { ValidationError, BadRequestError, NotFoundError } from "../utils/errors.util";
import { generateOTP, hashOTP, verifyOTP as verifyOTPHash } from "../utils/otp.util";
import { env } from "../config/env.config";
import { AUTH_CONFIG } from "./auth.config";

/**
 * Format and validate Indian phone number
 * Frontend sends: "9876543210" (10 digits)
 * Backend converts: "+919876543210"
 */
function formatPhone(phone: string): string {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If already has country code, remove it
  if (cleaned.startsWith(AUTH_CONFIG.PHONE.COUNTRY_CODE) && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }

  // Add country code prefix
  return `+${AUTH_CONFIG.PHONE.COUNTRY_CODE}${cleaned}`;
}

function isValidPhone(phone: string): boolean {
  // After formatting, should be exactly 10 digits (excluding country code)
  const cleaned = phone.replace(/\D/g, "");
  const withoutCountryCode =
    cleaned.startsWith(AUTH_CONFIG.PHONE.COUNTRY_CODE) && cleaned.length === 12
      ? cleaned.substring(2)
      : cleaned;

  // Indian mobile: exactly 10 digits, starts with 6-9
  const validStartPattern = AUTH_CONFIG.PHONE.VALID_START_DIGITS.join("");
  const regex = new RegExp(`^[${validStartPattern}]\\d{${AUTH_CONFIG.PHONE.MIN_DIGITS - 1}}$`);
  return regex.test(withoutCountryCode);
}

/**
 * Send OTP to mobile number
 */
export async function sendOTP(mobile: string) {
  const formattedMobile = formatPhone(mobile);

  if (!isValidPhone(formattedMobile)) {
    throw ValidationError("Invalid mobile number. Must be 10 digits starting with 6-9");
  }

  // Check rate limiting
  const canSend = await checkOTPRateLimit(formattedMobile);
  if (!canSend) {
    throw BadRequestError("Too many OTP requests. Please try again after 1 hour");
  }

  // Generate OTP
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);

  // Store OTP in Redis
  const otpId = await storeOTP(formattedMobile, otpHash);

  // Send OTP via MSG91 or log to console in development
  if (env.isProduction()) {
    const result = await sendMsg91OTP(formattedMobile, otp);
    if (!result.success) {
      throw BadRequestError(result.message);
    }
  } else {
    // Development: Log OTP to console
    console.log("\n" + "=".repeat(50));
    console.log("📱 OTP GENERATED (DEV MODE)");
    console.log("=".repeat(50));
    console.log(`📞 Mobile: ${formattedMobile}`);
    console.log(`🔑 OTP: ${otp}`);
    console.log(`🆔 OTP ID: ${otpId}`);
    console.log(`⏰ Expires in: 5 minutes`);
    console.log("=".repeat(50) + "\n");
  }

  return {
    mobile: formattedMobile,
    otpId,
    expiresIn: AUTH_CONFIG.OTP.EXPIRY_SECONDS,
  };
}

/**
 * Verify OTP and login/register user
 */
export async function verifyOTPAndLogin(mobile: string, otp: string, otpId: string) {
  const formattedMobile = formatPhone(mobile);

  // Check OTP attempts (prevent brute force)
  const attempts = await trackOTPAttempt(formattedMobile);
  if (attempts > AUTH_CONFIG.OTP.MAX_ATTEMPTS_PER_PHONE) {
    throw BadRequestError("Too many failed attempts. Please request a new OTP");
  }

  // Get OTP from Redis
  const otpData = await getOTP(formattedMobile, otpId);
  if (!otpData) {
    throw NotFoundError("OTP not found or expired");
  }

  // Check max attempts per OTP
  if (otpData.attempts >= AUTH_CONFIG.OTP.MAX_ATTEMPTS_PER_OTP) {
    throw BadRequestError("Maximum verification attempts exceeded. Please request a new OTP");
  }

  // Verify OTP
  const isValid = await verifyOTPHash(otp.trim(), otpData.otpHash);

  if (!isValid) {
    // Increment attempts
    await incrementOTPAttempts(formattedMobile, otpId);

    const remainingAttempts = AUTH_CONFIG.OTP.MAX_ATTEMPTS_PER_OTP - (otpData.attempts + 1);
    throw BadRequestError(`Invalid OTP. ${remainingAttempts} attempt(s) remaining`);
  }

  // Reset OTP attempts on success
  await resetOTPAttempts(formattedMobile);
  await deleteOTP(formattedMobile, otpId);

  // Find or create user
  const [existingUser] = await db
    .select()
    .from(usersProfile)
    .where(eq(usersProfile.mobile, formattedMobile));

  let user: typeof usersProfile.$inferSelect;
  let isNewUser = false;

  if (existingUser) {
    // Update existing user
    const [updatedUser] = await db
      .update(usersProfile)
      .set({ updatedAt: new Date() })
      .where(eq(usersProfile.mobile, formattedMobile))
      .returning();
    user = updatedUser;
  } else {
    // Create new user with mobile only (email optional, added during onboarding)
    const [newUser] = await db
      .insert(usersProfile)
      .values({
        mobile: formattedMobile,
        onboardingStep: AUTH_CONFIG.USER.INITIAL_ONBOARDING_STEP,
        onboardingComplete: false,
      })
      .returning();
    user = newUser;
    isNewUser = true;
  }

  // Create session in Redis
  const sessionId = await createSession(user.id, user.mobile!, user.email || undefined, user.role);

  return {
    sessionId,
    user: {
      id: user.id,
      mobile: user.mobile!,
      email: user.email || undefined,
      fullName: user.fullName || undefined,
      isNewUser,
      onboardingComplete: user.onboardingComplete || false,
      onboardingStep: user.onboardingStep || 0,
    },
  };
}

/**
 * Resend OTP
 */
export async function resendOTP(mobile: string, retryType: "text" | "voice" = "text") {
  const formattedMobile = formatPhone(mobile);

  if (!isValidPhone(formattedMobile)) {
    throw ValidationError("Invalid mobile number format");
  }

  // Check rate limiting
  const canSend = await checkOTPRateLimit(formattedMobile);
  if (!canSend) {
    throw BadRequestError("Too many OTP requests. Please try again after 1 hour");
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);

  // Store new OTP in Redis
  const otpId = await storeOTP(formattedMobile, otpHash);

  // Send OTP via MSG91 or log to console in development
  if (env.isProduction()) {
    const result = await resendMsg91OTP(formattedMobile, otp);
    if (!result.success) {
      throw BadRequestError(result.message);
    }
  } else {
    // Development: Log OTP to console
    console.log("\n" + "=".repeat(50));
    console.log("📱 OTP RESENT (DEV MODE)");
    console.log("=".repeat(50));
    console.log(`📞 Mobile: ${formattedMobile}`);
    console.log(`🔑 OTP: ${otp}`);
    console.log(`🆔 OTP ID: ${otpId}`);
    console.log(`⏰ Expires in: 5 minutes`);
    console.log("=".repeat(50) + "\n");
  }

  return {
    mobile: formattedMobile,
    otpId,
    expiresIn: AUTH_CONFIG.OTP.EXPIRY_SECONDS,
  };
}

/**
 * Logout (delete session)
 */
export async function logout(sessionId: string): Promise<boolean> {
  return await deleteSession(sessionId);
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const [user] = await db.select().from(usersProfile).where(eq(usersProfile.id, userId));

  if (!user) {
    throw NotFoundError("User not found");
  }

  return {
    id: user.id,
    mobile: user.mobile!,
    email: user.email || undefined,
    fullName: user.fullName,
    role: user.role,
    onboardingComplete: user.onboardingComplete || false,
  };
}
