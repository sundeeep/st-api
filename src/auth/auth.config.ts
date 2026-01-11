/**
 * Authentication Configuration
 * All auth-related constants in one place
 */

export const AUTH_CONFIG = {
  /**
   * OTP Settings
   */
  OTP: {
    LENGTH: 6, // OTP length
    EXPIRY_SECONDS: 300, // 5 minutes
    EXPIRY_MINUTES: 5, // For MSG91 API
    MAX_ATTEMPTS_PER_OTP: 3, // Max verification attempts per OTP
    MAX_ATTEMPTS_PER_PHONE: 5, // Max failed OTP attempts per phone (5 min window)
  },

  /**
   * Rate Limiting
   */
  RATE_LIMIT: {
    OTP_PER_HOUR: 5, // Max OTP requests per phone per hour
    RATE_LIMIT_WINDOW: 3600, // 1 hour in seconds
  },

  /**
   * Session Settings
   */
  SESSION: {
    TTL_SECONDS: 30 * 24 * 60 * 60, // 30 days
    TTL_DAYS: 30,
    SESSION_ID_BYTES: 32, // Random bytes for session ID
    OTP_ID_BYTES: 16, // Random bytes for OTP ID
  },

  /**
   * Redis Key Prefixes
   */
  REDIS_KEYS: {
    SESSION: "session:",
    USER_SESSION: "user_session:",
    OTP: "otp:",
    OTP_LIMIT: "otp_limit:",
    OTP_ATTEMPTS: "otp_attempts:",
  },

  /**
   * User Defaults
   */
  USER: {
    DEFAULT_ROLE: "user",
    INITIAL_ONBOARDING_STEP: 0,
  },

  /**
   * Phone Number
   */
  PHONE: {
    COUNTRY_CODE: "91", // India
    MIN_DIGITS: 10,
    MAX_DIGITS: 10,
    VALID_START_DIGITS: ["6", "7", "8", "9"],
  },

  /**
   * MSG91 Configuration
   */
  MSG91: {
    BASE_URL: "https://control.msg91.com/api/v5",
  },
} as const;
