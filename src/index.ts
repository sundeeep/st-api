import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { testConnection } from "./db";
import { swagger } from "@elysiajs/swagger";
import authRoutes from "./auth/auth.routes";
import adminQuizRoutes from "./quiz/admin/admin.routes";
import studentQuizRoutes from "./quiz/student/student.routes";
import adminEventRoutes from "./events/admin/admin.routes";
import studentEventRoutes from "./events/student/student.routes";
import paymentRoutes from "./events/shared/payment.routes";
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
        description: "Student Tribe API - Authentication, Quiz & Event Management System",
      },
      tags: [
        {
          name: "Authentication",
          description: "OTP-based mobile authentication with JWT + Redis sessions",
        },
        {
          name: "Admin - Quiz Categories",
          description: "Manage quiz categories",
        },
        {
          name: "Admin - Quizzes",
          description: "Create and manage quizzes",
        },
        {
          name: "Admin - Quiz Questions",
          description: "Add and manage quiz questions",
        },
        {
          name: "Admin - Analytics",
          description: "View quiz statistics and participant data",
        },
        {
          name: "Student - Quizzes",
          description: "Browse and participate in quizzes",
        },
        {
          name: "Student - Quiz Attempts",
          description: "Start, submit answers, and complete quizzes",
        },
        {
          name: "Student - Leaderboard",
          description: "View quiz rankings and scores",
        },
        {
          name: "Admin - Event Categories",
          description: "Manage event categories",
        },
        {
          name: "Admin - Events",
          description: "Create and manage events",
        },
        {
          name: "Admin - Event Tickets",
          description: "Manage event ticket categories",
        },
        {
          name: "Admin - Event Orders",
          description: "View and manage event orders",
        },
        {
          name: "Admin - Event Attendees",
          description: "View and check-in event attendees",
        },
        {
          name: "Student - Events",
          description: "Browse and view event details",
        },
        {
          name: "Student - Event Booking",
          description: "Book event tickets",
        },
        {
          name: "Student - Event Orders",
          description: "View booking history",
        },
        {
          name: "Student - Event Tickets",
          description: "View and manage event tickets",
        },
        {
          name: "Payments",
          description: "Payment webhooks and order expiry management",
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

// Debug endpoint to check outbound IP
app.get("/debug-ip", async () => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return {
      success: true,
      data: {
        outboundIp: data.ip,
        message: "This is the outbound IP seen by external services (e.g., MSG91, Redis)",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch IP address",
    };
  }
});

// API routes
app.group("/api", (app) =>
  app
    .use(authRoutes)
    .use(adminQuizRoutes)
    .use(studentQuizRoutes)
    .use(adminEventRoutes)
    .use(studentEventRoutes)
    .use(paymentRoutes)
);

// Handle favicon requests silently (browsers auto-request this)
app.get("/favicon.ico", ({ set }) => {
  set.status = 204; // No Content
  return;
});

// 404 handler
app.all("*", ({ set, path }) => {
  set.status = 404;
  return {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
      details: `The requested route ${path} does not exist`,
    },
    timestamp: new Date().toISOString(),
    path,
  };
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
