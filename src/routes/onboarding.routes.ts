import { Elysia, t } from "elysia";
import { authenticate } from "../middlewares/auth.middleware";
import {
  updateBasicInfoHandler,
  updateProfileHandler,
  addEducationHandler,
  addExperienceHandler,
  completeOnboardingHandler,
  getOnboardingStatusHandler,
} from "../controllers/onboardingController";

/**
 * Basic info validation schema
 */
const basicInfoSchema = t.Object({
  name: t.String({ minLength: 2, maxLength: 255 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8, maxLength: 100 }),
});

/**
 * Profile validation schema
 */
const profileSchema = t.Object({
  domainId: t.String({ format: "uuid" }),
  skillIds: t.Array(t.String({ format: "uuid" }), {
    minItems: 1,
    maxItems: 20,
  }),
});

/**
 * Education validation schema
 */
const educationSchema = t.Object({
  degree: t.String({ minLength: 2, maxLength: 255 }),
  institution: t.String({ minLength: 2, maxLength: 255 }),
  fieldOfStudy: t.String({ minLength: 2, maxLength: 255 }),
  startYear: t.Integer({ minimum: 1950, maximum: 2100 }),
  endYear: t.Optional(t.Integer({ minimum: 1950, maximum: 2100 })),
  current: t.Boolean({ default: false }),
});

/**
 * Experience validation schema
 */
const experienceSchema = t.Object({
  title: t.String({ minLength: 2, maxLength: 255 }),
  company: t.String({ minLength: 2, maxLength: 255 }),
  location: t.Optional(t.String({ maxLength: 255 })),
  startDate: t.String({ pattern: "^\\d{4}-\\d{2}$" }), // YYYY-MM
  endDate: t.Optional(t.String({ pattern: "^\\d{4}-\\d{2}$" })), // YYYY-MM
  current: t.Boolean({ default: false }),
  description: t.Optional(t.String({ maxLength: 2000 })),
});

/**
 * Onboarding routes - all require authentication
 */
const onboardingRoutes = new Elysia({ prefix: "/onboarding" })
  .derive(authenticate)
  .post("/basic-info", updateBasicInfoHandler, {
    body: basicInfoSchema,
    detail: {
      tags: ["Onboarding"],
      summary: "Update basic user info",
      description: "Update user's name, email, and password",
    },
  })
  .post("/profile", updateProfileHandler, {
    body: profileSchema,
    detail: {
      tags: ["Onboarding"],
      summary: "Update user profile",
      description: "Update user's domain and skills",
    },
  })
  .post("/education", addEducationHandler, {
    body: educationSchema,
    detail: {
      tags: ["Onboarding"],
      summary: "Add education record",
      description: "Add education details to user profile",
    },
  })
  .post("/experience", addExperienceHandler, {
    body: experienceSchema,
    detail: {
      tags: ["Onboarding"],
      summary: "Add work experience",
      description: "Add work experience to user profile",
    },
  })
  .post("/complete", completeOnboardingHandler, {
    detail: {
      tags: ["Onboarding"],
      summary: "Complete onboarding",
      description: "Mark user onboarding as complete",
    },
  })
  .get("/status", getOnboardingStatusHandler, {
    detail: {
      tags: ["Onboarding"],
      summary: "Get onboarding status",
      description: "Get current onboarding progress and completion status",
    },
  });

export default onboardingRoutes;
