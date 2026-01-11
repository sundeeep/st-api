import redis from "./redis";
import { randomBytes } from "crypto";

interface SessionData {
  userId: string;
  mobile: string;
  email?: string;
  role: string;
  createdAt: number;
  lastActivity: number;
}

const SESSION_PREFIX = "session:";
const USER_SESSION_PREFIX = "user_session:"; // Maps userId -> sessionId
const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create new session in Redis (ONE session per user)
 */
export async function createSession(
  userId: string,
  mobile: string,
  email?: string,
  role: string = "user"
): Promise<string> {
  // Delete any existing session for this user (enforce single session)
  await deleteUserSession(userId);

  const sessionId = generateSessionId();
  const sessionData: SessionData = {
    userId,
    mobile,
    email,
    role,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  const sessionKey = `${SESSION_PREFIX}${sessionId}`;
  const userSessionKey = `${USER_SESSION_PREFIX}${userId}`;

  // Store session with TTL
  await redis.setex(sessionKey, SESSION_TTL, JSON.stringify(sessionData));

  // Store userId -> sessionId mapping (for single session enforcement)
  await redis.setex(userSessionKey, SESSION_TTL, sessionId);

  return sessionId;
}

/**
 * Get session and update last activity
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const sessionKey = `${SESSION_PREFIX}${sessionId}`;
  const data = await redis.get(sessionKey);

  if (!data) {
    return null;
  }

  const session: SessionData = JSON.parse(data);

  // Update last activity
  session.lastActivity = Date.now();
  await redis.setex(sessionKey, SESSION_TTL, JSON.stringify(session));

  return session;
}

/**
 * Delete session (logout)
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const sessionKey = `${SESSION_PREFIX}${sessionId}`;

  // Get session data to find userId
  const data = await redis.get(sessionKey);
  if (data) {
    const session: SessionData = JSON.parse(data);
    const userSessionKey = `${USER_SESSION_PREFIX}${session.userId}`;
    await redis.del(userSessionKey); // Delete userId mapping
  }

  const result = await redis.del(sessionKey);
  return result > 0;
}

/**
 * Delete user session by userId (used when creating new session)
 * ✅ FIXED: No longer uses redis.keys() - uses direct lookup instead
 */
async function deleteUserSession(userId: string): Promise<void> {
  const userSessionKey = `${USER_SESSION_PREFIX}${userId}`;

  // Get existing sessionId for this user
  const existingSessionId = await redis.get(userSessionKey);

  if (existingSessionId) {
    // Delete the old session
    const oldSessionKey = `${SESSION_PREFIX}${existingSessionId}`;
    await redis.del(oldSessionKey);
    await redis.del(userSessionKey);
  }
}

/**
 * OTP rate limiting (max 5 OTP per hour per phone)
 */
export async function checkOTPRateLimit(phone: string): Promise<boolean> {
  const key = `otp_limit:${phone}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 3600); // 1 hour
  }

  return attempts <= 5; // Max 5 OTP per hour
}

/**
 * Track OTP verification attempts (prevent brute force)
 */
export async function trackOTPAttempt(phone: string): Promise<number> {
  const key = `otp_attempts:${phone}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 300); // 5 minutes (OTP validity)
  }

  return attempts;
}

/**
 * Reset OTP attempts after successful verification
 */
export async function resetOTPAttempts(phone: string): Promise<void> {
  await redis.del(`otp_attempts:${phone}`);
}

/**
 * Store OTP in Redis
 */
export async function storeOTP(phone: string, otpHash: string): Promise<string> {
  const otpId = randomBytes(16).toString("hex");
  const key = `otp:${phone}:${otpId}`;

  await redis.setex(
    key,
    300, // 5 minutes expiry
    JSON.stringify({
      otpHash,
      attempts: 0,
    })
  );

  return otpId;
}

/**
 * Get OTP from Redis
 */
export async function getOTP(
  phone: string,
  otpId: string
): Promise<{ otpHash: string; attempts: number } | null> {
  const key = `otp:${phone}:${otpId}`;
  const data = await redis.get(key);

  if (!data) return null;

  return JSON.parse(data);
}

/**
 * Increment OTP verification attempts
 */
export async function incrementOTPAttempts(phone: string, otpId: string): Promise<void> {
  const key = `otp:${phone}:${otpId}`;
  const data = await redis.get(key);

  if (!data) return;

  const otpData = JSON.parse(data);
  otpData.attempts += 1;

  const ttl = await redis.ttl(key);
  await redis.setex(key, ttl > 0 ? ttl : 300, JSON.stringify(otpData));
}

/**
 * Delete OTP after successful verification
 */
export async function deleteOTP(phone: string, otpId: string): Promise<void> {
  const key = `otp:${phone}:${otpId}`;
  await redis.del(key);
}
