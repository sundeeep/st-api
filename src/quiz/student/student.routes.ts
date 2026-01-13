import { Elysia, t } from "elysia";
import { authenticate } from "../../auth/auth.middleware";
import * as studentController from "./student.controller";
import type { AuthenticatedContext } from "../../auth/auth.types";

const studentQuizRoutes = new Elysia({ prefix: "/student/quiz" })
  .get(
    "/quizzes",
    async (context) => {
      const authContext = await authenticate(context);
      return studentController.browseQuizzesHandler(authContext as AuthenticatedContext);
    },
    {
      query: t.Object({
        categoryId: t.Optional(t.String({ format: "uuid" })),
        quizType: t.Optional(
          t.Union([
            t.Literal("timed"),
            t.Literal("practice"),
            t.Literal("competitive"),
            t.Literal("assessment"),
          ])
        ),
        search: t.Optional(t.String()),
        page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
        limit: t.Optional(t.String({ pattern: "^[0-9]+$" })),
      }),
      detail: {
        tags: ["Student - Quizzes"],
        summary: "Browse available quizzes",
        description: "Get list of active quizzes with filters and pagination",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/categories",
    async () => {
      return studentController.getCategoriesHandler();
    },
    {
      detail: {
        tags: ["Student - Quizzes"],
        summary: "Get all quiz categories",
        description: "Returns list of all available quiz categories",
      },
    }
  )

  .get(
    "/quizzes/:id",
    async (context) => {
      const authContext = await authenticate(context);
      return studentController.getQuizDetailsHandler(authContext as AuthenticatedContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Quizzes"],
        summary: "Get quiz details",
        description: "Get detailed information about a specific quiz (without questions)",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .post(
    "/quizzes/:id/start",
    async (context) => {
      const authContext = await authenticate(context);
      return studentController.startQuizAttemptHandler(authContext as AuthenticatedContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Quiz Attempts"],
        summary: "Start quiz attempt",
        description: "Create new quiz attempt and get questions (shuffled if enabled)",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .post(
    "/attempts/:attemptId/answers",
    async (context) => {
      const authContext = await authenticate(context);
      return studentController.submitAnswerHandler(authContext as AuthenticatedContext);
    },
    {
      params: t.Object({
        attemptId: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        questionId: t.String({ format: "uuid" }),
        selectedOptionIds: t.Array(t.String({ format: "uuid" }), { minItems: 1, maxItems: 1 }),
        timeTaken: t.Optional(t.Number({ minimum: 0 })),
      }),
      detail: {
        tags: ["Student - Quiz Attempts"],
        summary: "Submit answer",
        description: "Submit or update answer for a question in ongoing attempt",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .post(
    "/attempts/:attemptId/complete",
    async (context) => {
      const authContext = await authenticate(context);
      return studentController.completeQuizHandler(authContext as AuthenticatedContext);
    },
    {
      params: t.Object({
        attemptId: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        completedAt: t.String({ format: "date-time" }),
      }),
      detail: {
        tags: ["Student - Quiz Attempts"],
        summary: "Complete quiz",
        description:
          "Mark quiz as completed, calculate score, update leaderboard, and return results",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/attempts/:attemptId/result",
    async (context) => {
      const authContext = await authenticate(context);
      return studentController.getAttemptResultHandler(authContext as AuthenticatedContext);
    },
    {
      params: t.Object({
        attemptId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Quiz Attempts"],
        summary: "Get attempt result",
        description: "View detailed results with correct/wrong answers for completed attempt",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/my-attempts",
    async (context) => {
      const authContext = await authenticate(context);
      return studentController.getMyAttemptsHandler(authContext as AuthenticatedContext);
    },
    {
      query: t.Object({
        quizId: t.Optional(t.String({ format: "uuid" })),
        status: t.Optional(t.Union([t.Literal("in_progress"), t.Literal("completed")])),
        page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
        limit: t.Optional(t.String({ pattern: "^[0-9]+$" })),
      }),
      detail: {
        tags: ["Student - Quiz Attempts"],
        summary: "Get my attempts",
        description: "Get list of all quiz attempts by current user with filters",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/quizzes/:id/leaderboard",
    async (context) => {
      const authContext = await authenticate(context);
      return studentController.getLeaderboardHandler(authContext as AuthenticatedContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      query: t.Object({
        limit: t.Optional(t.String({ pattern: "^[0-9]+$" })),
      }),
      detail: {
        tags: ["Student - Leaderboard"],
        summary: "Get quiz leaderboard",
        description: "Get top N participants and current user's rank for a quiz",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default studentQuizRoutes;
