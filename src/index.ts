import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { testConnection } from "./db";
import { swagger } from "@elysiajs/swagger";
import { env, validateEnv } from "./config/env.config";
import { globalErrorHandler } from "./middlewares/errorHandler.middleware";

// Core/Foundation
import authRoutes from "./auth/auth.routes";

// Quiz Feature
import adminQuizRoutes from "./quiz/admin/admin.routes";
import studentQuizRoutes from "./quiz/student/student.routes";

// Events Feature
import adminEventRoutes from "./events/admin/admin.routes";
import studentEventRoutes from "./events/student/student.routes";
import paymentRoutes from "./events/shared/payment.routes";

// Users/Profile Feature
import adminUserRoutes from "./users/admin/admin.routes";
import studentProfileRoutes from "./users/student/profile/student.routes";
import studentEducationRoutes from "./users/student/education/student.routes";
import studentExperienceRoutes from "./users/student/experience/student.routes";
import studentUsernameRoutes from "./users/student/username/student.routes";

// Opportunities Feature
import adminCompanyRoutes from "./opportunities/admin/admin.routes";
import studentOpportunityRoutes from "./opportunities/student/student.routes";

// Articles Feature
import adminArticleRoutes from "./articles/admin/admin.routes";
import studentArticleRoutes from "./articles/student/student.routes";

// Interactions Feature
import studentInteractionsRoutes from "./interactions/student/student.routes";

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
        // 1. Core/Foundation - Authentication (login first)
        {
          name: "Authentication",
          description: "OTP-based mobile authentication with JWT + Redis sessions",
        },
        
        // 2. Users/Profile Feature - Onboarding & Profile Management (students set up profile after login)
        {
          name: "Admin - Users",
          description: "Manage and view users for admin dashboard",
        },
        {
          name: "Student - Profile",
          description: "Manage student profile information",
        },
        {
          name: "Student - Education",
          description: "Manage education records for student profile",
        },
        {
          name: "Student - Experience",
          description: "Manage work experience records for student profile",
        },
        
        // 3. Quiz Feature
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
        
        // 4. Events Feature
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
        
        // 5. Opportunities Feature
        {
          name: "Admin - Companies",
          description: "Manage companies that post opportunities",
        },
        {
          name: "Admin - Opportunities",
          description: "Create and manage internship and full-time opportunities",
        },
        {
          name: "Admin - Opportunity Questions",
          description: "Manage custom questions for opportunity applications",
        },
        {
          name: "Admin - Opportunity Applications",
          description: "View and manage student applications for opportunities",
        },
        {
          name: "Student - Opportunities",
          description: "Browse opportunities and manage applications",
        },
        
        // 6. Articles Feature
        {
          name: "Admin - Articles",
          description: "Create and manage articles with rich JSONB content",
        },
        {
          name: "Student - Articles",
          description: "Browse and view published articles",
        },
        
        // 7. Interactions Feature
        {
          name: "Student - Interactions",
          description: "Like and bookmark events, quizzes, and articles",
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
    // 1. Core/Foundation - Authentication
    .use(authRoutes)
    
    // 2. Users/Profile Feature - Onboarding & Profile Management
    .use(adminUserRoutes)
    .use(studentProfileRoutes)
    .use(studentEducationRoutes)
    .use(studentExperienceRoutes)
    .use(studentUsernameRoutes)
    
    // 3. Quiz Feature
    .use(adminQuizRoutes)
    .use(studentQuizRoutes)
    
    // 4. Events Feature
    .use(adminEventRoutes)
    .use(studentEventRoutes)
    .use(paymentRoutes) // Payment is related to events
    
    // 5. Opportunities Feature
    .use(adminCompanyRoutes)
    .use(studentOpportunityRoutes)
    
    // 6. Articles Feature
    .use(adminArticleRoutes)
    .use(studentArticleRoutes)
    
      // 7. Interactions Feature
    .use(studentInteractionsRoutes)
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
