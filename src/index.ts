import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { testConnection } from "./db";
import { swagger } from "@elysiajs/swagger";
import authRoutes from "./auth/auth.routes";
import { env, validateEnv } from "./config/env.config";
import { globalErrorHandler } from "./middlewares/errorHandler.middleware";

// Validate environment variables
validateEnv();

// Create Elysia app instance
const app = new Elysia();

// Swagger documentation
app.use(
  swagger({
    documentation: {
      info: {
        title: "Student Tribe API",
        version: "1.0.0",
        description: "Student Tribe API - Authentication System",
      },
      tags: [
        {
          name: "Authentication",
          description: "OTP-based mobile authentication with JWT + Redis sessions",
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT token received from /auth/verify-otp endpoint",
          },
        },
      },
    },
  })
);

// Global error handler
// @ts-ignore
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
app.group("/api", (app) => app.use(authRoutes));

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
console.log(`📚 Swagger docs: http://localhost:${env.PORT}/swagger`);
