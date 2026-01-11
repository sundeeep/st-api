import redis from "./redis";
import { randomBytes } from "crypto";
import { AUTH_CONFIG } from "../auth.config";

interface SessionData {
  userId: string;
  mobile: string;
  email?: string;
  role: string;
  createdAt: number;
  lastActivity: number;
}

const { SESSION, USER_SESSION, OTP, OTP_LIMIT, OTP_ATTEMPTS } = AUTH_CONFIG.REDIS_KEYS;
const SESSION_TTL = AUTH_CONFIG.SESSION.TTL_SECONDS;

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return randomBytes(AUTH_CONFIG.SESSION.SESSION_ID_BYTES).toString("hex");
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

  const sessionKey = `${SESSION}${sessionId}`;
  const userSessionKey = `${USER_SESSION}${userId}`;

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
  const sessionKey = `${SESSION}${sessionId}`;
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
  const sessionKey = `${SESSION}${sessionId}`;

  // Get session data to find userId
  const data = await redis.get(sessionKey);
  if (data) {
    const session: SessionData = JSON.parse(data);
    const userSessionKey = `${USER_SESSION}${session.userId}`;
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
  const userSessionKey = `${USER_SESSION}${userId}`;

  // Get existing sessionId for this user
  const existingSessionId = await redis.get(userSessionKey);

  if (existingSessionId) {
    // Delete the old session
    const oldSessionKey = `${SESSION}${existingSessionId}`;
    await redis.del(oldSessionKey);
    await redis.del(userSessionKey);
  }
}

/**
 * OTP rate limiting
 */
export async function checkOTPRateLimit(phone: string): Promise<boolean> {
  const key = `${OTP_LIMIT}${phone}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, AUTH_CONFIG.RATE_LIMIT.RATE_LIMIT_WINDOW);
  }

  return attempts <= AUTH_CONFIG.RATE_LIMIT.OTP_PER_HOUR;
}

/**
 * Track OTP verification attempts (prevent brute force)
 */
export async function trackOTPAttempt(phone: string): Promise<number> {
  const key = `${OTP_ATTEMPTS}${phone}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, AUTH_CONFIG.OTP.EXPIRY_SECONDS);
  }

  return attempts;
}

/**
 * Reset OTP attempts after successful verification
 */
export async function resetOTPAttempts(phone: string): Promise<void> {
  await redis.del(`${OTP_ATTEMPTS}${phone}`);
}

/**
 * Store OTP in Redis
 */
export async function storeOTP(phone: string, otpHash: string): Promise<string> {
  const otpId = randomBytes(AUTH_CONFIG.SESSION.OTP_ID_BYTES).toString("hex");
  const key = `${OTP}${phone}:${otpId}`;

  await redis.setex(
    key,
    AUTH_CONFIG.OTP.EXPIRY_SECONDS,
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
  const key = `${OTP}${phone}:${otpId}`;
  const data = await redis.get(key);

  if (!data) return null;

  return JSON.parse(data);
}

/**
 * Increment OTP verification attempts
 */
export async function incrementOTPAttempts(phone: string, otpId: string): Promise<void> {
  const key = `${OTP}${phone}:${otpId}`;
  const data = await redis.get(key);

  if (!data) return;

  const otpData = JSON.parse(data);
  otpData.attempts += 1;

  const ttl = await redis.ttl(key);
  await redis.setex(key, ttl > 0 ? ttl : AUTH_CONFIG.OTP.EXPIRY_SECONDS, JSON.stringify(otpData));
}

/**
 * Delete OTP after successful verification
 */
export async function deleteOTP(phone: string, otpId: string): Promise<void> {
  const key = `${OTP}${phone}:${otpId}`;
  await redis.del(key);
}
