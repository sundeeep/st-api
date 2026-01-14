import { Elysia, t } from "elysia";
import { requireAdmin } from "../../middlewares/admin.middleware";
import * as quizController from "./admin.controller";

const adminQuizRoutes = new Elysia({ prefix: "/admin/quiz" })
  .post(
    "/category",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return quizController.createCategoryHandler(adminContext);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 100 }),
        description: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Admin - Quiz Categories"],
        summary: "Create quiz category",
      },
    }
  )

  .get("/categories", quizController.getAllCategoriesHandler, {
    detail: {
      tags: ["Admin - Quiz Categories"],
      summary: "Get all categories",
    },
  })

  .get(
    "/category/:id",
    async (context) => {
      await requireAdmin(context);
      return quizController.getCategoryHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Quiz Categories"],
        summary: "Get category by ID",
      },
    }
  )

  .put(
    "/category/:id",
    async (context) => {
      await requireAdmin(context);
      return quizController.updateCategoryHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
        description: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Admin - Quiz Categories"],
        summary: "Update category",
      },
    }
  )

  .delete(
    "/category/:id",
    async (context) => {
      await requireAdmin(context);
      return quizController.deleteCategoryHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Quiz Categories"],
        summary: "Delete category",
      },
    }
  )

  .post(
    "/",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return quizController.createQuizHandler(adminContext);
    },
    {
      body: t.Object({
        categoryId: t.Optional(t.String({ format: "uuid" })),
        quizName: t.String({ minLength: 3, maxLength: 200 }),
        quizType: t.Union([
          t.Literal("timed"),
          t.Literal("practice"),
          t.Literal("competitive"),
          t.Literal("assessment"),
        ]),
        about: t.Object({
          description: t.String(),
          rules: t.Array(t.String()),
        }),
        bannerImage: t.Optional(t.String()),
        rewards: t.Optional(
          t.Array(
            t.Object({
              type: t.Union([t.Literal("ST_COINS"), t.Literal("MOVIE_TICKETS")]),
              value: t.Number({ minimum: 0 }),
              info: t.String(),
            }),
            { minItems: 0 }
          )
        ),
        timerDuration: t.Optional(t.Number()),
        startDate: t.String(),
        endDate: t.String(),
        revealAnswersDate: t.Optional(t.String()),
        maxAttempts: t.Optional(t.Number()),
        shuffleQuestions: t.Optional(t.Boolean()),
        shuffleOptions: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Admin - Quizzes"],
        summary: "Create quiz",
      },
    }
  )

  .get(
    "/list",
    async (context) => {
      await requireAdmin(context);
      return quizController.getQuizzesHandler(context);
    },
    {
      query: t.Optional(
        t.Object({
          categoryId: t.Optional(t.String({ format: "uuid" })),
          status: t.Optional(t.String()),
          quizType: t.Optional(t.String()),
          search: t.Optional(t.String()),
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        })
      ),
      detail: {
        tags: ["Admin - Quizzes"],
        summary: "Get all quizzes with filters",
      },
    }
  )

  .get(
    "/:id",
    async (context) => {
      await requireAdmin(context);
      return quizController.getQuizHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Quizzes"],
        summary: "Get quiz by ID",
      },
    }
  )

  .put(
    "/:id",
    async (context) => {
      await requireAdmin(context);
      return quizController.updateQuizHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        categoryId: t.Optional(t.String({ format: "uuid" })),
        quizName: t.Optional(t.String({ minLength: 3, maxLength: 200 })),
        quizType: t.Optional(
          t.Union([
            t.Literal("timed"),
            t.Literal("practice"),
            t.Literal("competitive"),
            t.Literal("assessment"),
          ])
        ),
        about: t.Optional(
          t.Object({
            description: t.String(),
            rules: t.Array(t.String()),
          })
        ),
        bannerImage: t.Optional(t.String()),
        rewards: t.Optional(
          t.Array(
            t.Object({
              type: t.Union([t.Literal("ST_COINS"), t.Literal("MOVIE_TICKETS")]),
              value: t.Number({ minimum: 0 }),
              info: t.String(),
            }),
            { minItems: 0 }
          )
        ),
        timerDuration: t.Optional(t.Number()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        revealAnswersDate: t.Optional(t.String()),
        maxAttempts: t.Optional(t.Number()),
        shuffleQuestions: t.Optional(t.Boolean()),
        shuffleOptions: t.Optional(t.Boolean()),
        status: t.Optional(
          t.Union([
            t.Literal("draft"),
            t.Literal("scheduled"),
            t.Literal("active"),
            t.Literal("completed"),
            t.Literal("archived"),
          ])
        ),
      }),
      detail: {
        tags: ["Admin - Quizzes"],
        summary: "Update quiz",
      },
    }
  )

  .delete(
    "/:id",
    async (context) => {
      await requireAdmin(context);
      return quizController.deleteQuizHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Quizzes"],
        summary: "Delete quiz",
      },
    }
  )

  .post(
    "/:id/publish",
    async (context) => {
      await requireAdmin(context);
      return quizController.publishQuizHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Quizzes"],
        summary: "Publish quiz",
      },
    }
  )

  .post(
    "/:id/questions",
    async (context) => {
      await requireAdmin(context);
      return quizController.addQuestionsHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        questions: t.Array(
          t.Object({
            questionText: t.String({ minLength: 5, maxLength: 1000 }),
            explanation: t.Optional(t.String()),
            points: t.Optional(t.Number()),
            options: t.Array(
              t.Object({
                optionText: t.String({ minLength: 1, maxLength: 500 }),
                isCorrect: t.Boolean(),
                displayOrder: t.Number(),
              }),
              { minItems: 4, maxItems: 4 }
            ),
          })
        ),
      }),
      detail: {
        tags: ["Admin - Quiz Questions"],
        summary: "Add questions to quiz",
      },
    }
  )

  .get(
    "/:id/questions",
    async (context) => {
      await requireAdmin(context);
      return quizController.getQuizQuestionsHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Quiz Questions"],
        summary: "Get all questions for quiz",
      },
    }
  )

  .put(
    "/question/:questionId",
    async (context) => {
      await requireAdmin(context);
      return quizController.updateQuestionHandler(context);
    },
    {
      params: t.Object({
        questionId: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        questionText: t.Optional(t.String({ minLength: 5, maxLength: 1000 })),
        explanation: t.Optional(t.String()),
        points: t.Optional(t.Number()),
        options: t.Optional(
          t.Array(
            t.Object({
              optionText: t.String({ minLength: 1, maxLength: 500 }),
              isCorrect: t.Boolean(),
              displayOrder: t.Number(),
            }),
            { minItems: 4, maxItems: 4 }
          )
        ),
      }),
      detail: {
        tags: ["Admin - Quiz Questions"],
        summary: "Update question",
      },
    }
  )

  .delete(
    "/question/:questionId",
    async (context) => {
      await requireAdmin(context);
      return quizController.deleteQuestionHandler(context);
    },
    {
      params: t.Object({
        questionId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Quiz Questions"],
        summary: "Delete question",
      },
    }
  )

  .get(
    "/:id/participants",
    async (context) => {
      await requireAdmin(context);
      return quizController.getQuizParticipantsHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Analytics"],
        summary: "Get quiz participants",
      },
    }
  )

  .get(
    "/:id/analytics",
    async (context) => {
      await requireAdmin(context);
      return quizController.getQuizAnalyticsHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Analytics"],
        summary: "Get quiz analytics",
      },
    }
  )

  .get(
    "/:id/attempts/:userId",
    async (context) => {
      await requireAdmin(context);
      return quizController.getUserAttemptsHandler(context);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
        userId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Analytics"],
        summary: "Get user attempts for quiz",
      },
    }
  )

  .get(
    "/dashboard",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return quizController.getDashboardStatsHandler(adminContext);
    },
    {
      detail: {
        tags: ["Admin - Analytics"],
        summary: "Get dashboard statistics",
      },
    }
  );

export default adminQuizRoutes;
