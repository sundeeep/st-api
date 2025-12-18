/**
 * Environment configuration
 * Centralizes all environment variables
 */
export const env = {
  // Server
  PORT: process.env.PORT!,
  NODE_ENV: process.env.NODE_ENV!,

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,

  // OTP Configuration
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 5,
  OTP_MAX_ATTEMPTS: 3,
  OTP_RATE_LIMIT_MINUTES: 10,
  OTP_MAX_REQUESTS: 3,

  // Helpers
  isDevelopment: () => env.NODE_ENV === "development",
  isProduction: () => env.NODE_ENV === "production",
} as const;

/**
 * Validates required environment variables
 */
export const validateEnv = (): void => {
  const required = ["DATABASE_URL"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️  Warning: Missing environment variables: ${missing.join(", ")}`);
    console.warn("Please create a .env file based on .env.example");
  }
};
