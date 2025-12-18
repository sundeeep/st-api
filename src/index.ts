import { Elysia } from "elysia";
import { testConnection } from "./db";
import { cors } from "@elysiajs/cors";
import otpRoutes from "./routes/otp.routes";
import optionsRoutes from "./routes/options.routes";
import authRoutes from "./routes/auth.routes";
import onboardingRoutes from "./routes/onboarding.routes";
import { env, validateEnv } from "./config/env.config";
import { globalErrorHandler } from "./middlewares/errorHandler.middleware";

// Validate environment variables
validateEnv();

// Create Elysia app instance
const app = new Elysia();

// Global error handler
app.onError(globalErrorHandler);

// CORS middleware
app.use(cors());

// Health check endpoint
app.get("/health", () => ({
  success: true,
  message: "Server is healthy",
  data: {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  },
}));

// API routes
app.group("/api", (app) =>
  app.use(otpRoutes).use(optionsRoutes).use(onboardingRoutes).use(authRoutes)
);

// 404 handler
app.all("*", () => {
  throw new Error("Route not found");
});

// Start server
app.listen(env.PORT);

// Test database connection on startup
testConnection().then((connected) => {
  if (!connected) {
    console.warn("⚠️  Server started but database connection failed");
  }
});

console.log(`🦊 Elysia is running at http://localhost:${env.PORT}`);
console.log(`📝 Environment: ${env.NODE_ENV}`);
console.log(`🔗 Health check: http://localhost:${env.PORT}/health`);
