export const env = {
  PORT: process.env.PORT!,
  NODE_ENV: process.env.NODE_ENV!,
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,

  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 5,
  OTP_MAX_ATTEMPTS: 3,
  OTP_RATE_LIMIT_MINUTES: 10,
  OTP_MAX_REQUESTS: 3,

  AWS_REGION: process.env.AWS_REGION!,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME!,
  AWS_S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID!,
  AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY!,

  // Redis
  REDIS_URL: process.env.REDIS_URL!,

  // MSG91 OTP
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY!,
  MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID!,

  // OTP Bypass (for testing - skips MSG91, always uses "123456")
  // Accepts: "true", "TRUE", "True", "1", or true
  BYPASS_OTP:
    process.env.BYPASS_OTP === "true",

  // Twilio (deprecated, keeping for backward compatibility)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID!,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET!,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET!,

  isDevelopment: () => env.NODE_ENV === "development",
  isProduction: () => env.NODE_ENV === "production",
} as const;

/**
 * Validates required environment variables
 */
export const validateEnv = (): void => {
  const required = [
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "AWS_REGION",
    "AWS_S3_BUCKET_NAME",
    "AWS_S3_ACCESS_KEY_ID",
    "AWS_S3_SECRET_ACCESS_KEY",
    "REDIS_URL",
    "MSG91_AUTH_KEY",
    "MSG91_TEMPLATE_ID",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
    console.error("Please create a .env file with all required variables");
    console.error("Application may not function correctly without these variables");
  }
};
