import { Elysia, t } from "elysia";
import * as quizStudentController from "../controllers/quizStudentController";
import { authPlugin } from "../middlewares/auth.middleware";

const quizStudentRoutes = new Elysia({ prefix: "/quizzes" })
  .use(authPlugin)
  .get("/", quizStudentController.getActiveQuizzesHandler, {
    detail: {
      tags: ["Student - Quizzes"],
      summary: "Get all active quizzes",
      description: "Student fetches list of all active/published quizzes",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/:id", quizStudentController.getQuizDetailsHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
    }),
    detail: {
      tags: ["Student - Quizzes"],
      summary: "Get quiz details",
      description: "Student fetches basic quiz information (without questions)",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/:id/questions", quizStudentController.getQuizQuestionsHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
    }),
    query: t.Object({
      page: t.Optional(t.String({ description: "Page number (default: 1)", pattern: "^[0-9]+$" })),
      limit: t.Optional(
        t.String({ description: "Items per page (default: 10)", pattern: "^[0-9]+$" })
      ),
    }),
    detail: {
      tags: ["Student - Quizzes"],
      summary: "Get quiz questions (paginated)",
      description:
        "Student fetches questions for a quiz page by page (without correct answers). Supports pagination.",
      security: [{ bearerAuth: [] }],
    },
  })
  .post("/:id/submit", quizStudentController.submitQuizHandler, {
    params: t.Object({
      id: t.String({ description: "Quiz ID", format: "uuid" }),
    }),
    body: t.Object({
      startedAt: t.String({
        description: "When student started the quiz (ISO 8601 date)",
        format: "date-time",
      }),
      answers: t.Array(
        t.Object({
          questionId: t.String({ description: "Question ID", format: "uuid" }),
          selectedOptionId: t.String({
            description: "Selected option ID (e.g., 'a', 'b', 'c', 'd')",
          }),
        }),
        { description: "Array of student's answers to all questions" }
      ),
    }),
    detail: {
      tags: ["Student - Quizzes"],
      summary: "Submit quiz answers",
      description: "Student submits all quiz answers. System calculates score and returns results.",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/my-attempts", quizStudentController.getMyAttemptsHandler, {
    detail: {
      tags: ["Student - Quiz Attempts"],
      summary: "Get my quiz attempts",
      description: "Student fetches their own quiz attempt history",
      security: [{ bearerAuth: [] }],
    },
  })
  .get("/my-attempts/:attemptId", quizStudentController.getMyAttemptDetailsHandler, {
    params: t.Object({
      attemptId: t.String({ description: "Attempt ID", format: "uuid" }),
    }),
    detail: {
      tags: ["Student - Quiz Attempts"],
      summary: "Get my attempt details",
      description:
        "Student views detailed results of their quiz attempt (score, answers, correct/incorrect)",
      security: [{ bearerAuth: [] }],
    },
  });

export default quizStudentRoutes;
