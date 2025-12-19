import { Elysia, t } from "elysia";
import * as quizController from "../controllers/quizController";
import { adminPlugin } from "../middlewares/admin.middleware";

const quizRoutes = new Elysia({ prefix: "/quizzes" })
  .use(adminPlugin)
  .post("/", quizController.createQuizHandler, {
    body: t.Object({
      title: t.String({ description: "Quiz title", minLength: 1, maxLength: 255 }),
      description: t.String({ description: "Quiz description in markdown format" }),
      duration: t.Number({ description: "Quiz duration in minutes", minimum: 1 }),
      passingMarks: t.Number({ description: "Minimum marks required to pass", minimum: 0 }),
      isActive: t.Optional(
        t.Boolean({ description: "Is quiz published and active? Default: false" })
      ),
    }),
    detail: {
      tags: ["Admin - Quizzes"],
      summary: "Create a new quiz",
      description:
        "Admin creates a new quiz with basic information. Questions are added separately.",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/", quizController.getAllQuizzesHandler, {
    detail: {
      tags: ["Admin - Quizzes"],
      summary: "Get all quizzes",
      description: "Admin fetches all quizzes (active and inactive)",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/:id", quizController.getQuizByIdHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
    }),
    detail: {
      tags: ["Admin - Quizzes"],
      summary: "Get quiz by ID",
      description: "Admin fetches a specific quiz with all details",
      security: [{ bearerAuth: [] }],
    },
  })
  .put("/:id", quizController.updateQuizHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
    }),
    body: t.Object({
      title: t.Optional(t.String({ description: "Quiz title", minLength: 1, maxLength: 255 })),
      description: t.Optional(t.String({ description: "Quiz description in markdown format" })),
      duration: t.Optional(t.Number({ description: "Quiz duration in minutes", minimum: 1 })),
      passingMarks: t.Optional(
        t.Number({ description: "Minimum marks required to pass", minimum: 0 })
      ),
      isActive: t.Optional(t.Boolean({ description: "Is quiz published and active?" })),
    }),
    detail: {
      tags: ["Admin - Quizzes"],
      summary: "Update quiz",
      description: "Admin updates quiz information",
      security: [{ bearerAuth: [] }],
    },
  })
  .delete("/:id", quizController.deleteQuizHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
    }),
    detail: {
      tags: ["Admin - Quizzes"],
      summary: "Delete quiz",
      description: "Admin deletes a quiz and all its questions",
      security: [{ bearerAuth: [] }],
    },
  })
  .post("/:id/questions", quizController.createQuestionHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
    }),
    body: t.Object({
      questionText: t.String({ description: "Question text", minLength: 1 }),
      marks: t.Number({ description: "Marks for this question", minimum: 1 }),
      order: t.Number({ description: "Display order of question (1, 2, 3...)", minimum: 1 }),
      options: t.Array(
        t.Object({
          id: t.String({ description: "Option ID (e.g., 'a', 'b', 'c', 'd')" }),
          text: t.String({ description: "Option text" }),
          isCorrect: t.Boolean({ description: "Is this the correct answer?" }),
        }),
        { description: "Array of answer options (typically 4 options)", minItems: 2, maxItems: 10 }
      ),
    }),
    detail: {
      tags: ["Admin - Quiz Questions"],
      summary: "Add question to quiz",
      description: "Admin adds a new question with multiple choice options to a quiz",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/:id/questions", quizController.getQuestionsByQuizIdHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
    }),
    detail: {
      tags: ["Admin - Quiz Questions"],
      summary: "Get all questions for a quiz",
      description: "Admin fetches all questions (with correct answers) for a quiz",
      security: [{ bearerAuth: [] }],
    },
  })
  .put("/:id/questions/:questionId", quizController.updateQuestionHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
      questionId: t.String({ description: "Question ID", format: "uuid" }),
    }),
    body: t.Object({
      questionText: t.Optional(t.String({ description: "Question text", minLength: 1 })),
      marks: t.Optional(t.Number({ description: "Marks for this question", minimum: 1 })),
      order: t.Optional(t.Number({ description: "Display order of question", minimum: 1 })),
      options: t.Optional(
        t.Array(
          t.Object({
            id: t.String({ description: "Option ID" }),
            text: t.String({ description: "Option text" }),
            isCorrect: t.Boolean({ description: "Is this the correct answer?" }),
          }),
          { minItems: 2, maxItems: 10 }
        )
      ),
    }),
    detail: {
      tags: ["Admin - Quiz Questions"],
      summary: "Update a question",
      description: "Admin updates a question and its options",
      security: [{ bearerAuth: [] }],
    },
  })
  .delete("/:id/questions/:questionId", quizController.deleteQuestionHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
      questionId: t.String({ description: "Question ID", format: "uuid" }),
    }),
    detail: {
      tags: ["Admin - Quiz Questions"],
      summary: "Delete a question",
      description: "Admin deletes a question from a quiz",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/:id/attempts", quizController.getAttemptsByQuizIdHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
    }),
    detail: {
      tags: ["Admin - Quiz Attempts"],
      summary: "Get all attempts for a quiz",
      description: "Admin views all student attempts for a specific quiz",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/:id/attempts/:attemptId", quizController.getAttemptByIdHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
      attemptId: t.String({ description: "Attempt ID", format: "uuid" }),
    }),
    detail: {
      tags: ["Admin - Quiz Attempts"],
      summary: "Get attempt details",
      description: "Admin views detailed information about a specific quiz attempt",
      security: [{ bearerAuth: [] }],
    },
  });

export default quizRoutes;
