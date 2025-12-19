import type { Context } from "elysia";
import * as quizService from "../services/quiz.service";
import * as quizQuestionsService from "../services/quizQuestions.service";
import * as quizAttemptsService from "../services/quizAttempts.service";
import { successResponse, paginatedResponse } from "../utils/response.util";
import type { SuccessResponse } from "../types/response.types";

interface QuizParams {
  id: string;
  [key: string]: string;
}

interface AttemptParams {
  attemptId: string;
  [key: string]: string;
}

interface QuizQuery {
  page?: string;
  limit?: string;
}

interface SubmitQuizBody {
  startedAt: string;
  answers: Array<{ questionId: string; selectedOptionId: string }>;
}

interface AuthenticatedContext extends Context {
  user: {
    id: string;
    phoneNumber: string;
    role: string;
  };
}

export const getActiveQuizzesHandler = async (): Promise<SuccessResponse> => {
  const result = await quizService.getActiveQuizzes();
  return successResponse(result, "Active quizzes fetched successfully");
};

export const getQuizDetailsHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  const quiz = await quizService.getQuizById(params.id);

  const quizWithoutSensitiveData = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    duration: quiz.duration,
    passingMarks: quiz.passingMarks,
    totalQuestions: quiz.totalQuestions,
    isActive: quiz.isActive,
  };

  return successResponse(quizWithoutSensitiveData, "Quiz details fetched successfully");
};

export const getQuizQuestionsHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  const query = context.query as QuizQuery;
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");

  const { questions, total } = await quizQuestionsService.getQuestionsByQuizId(
    params.id,
    page,
    limit
  );

  const questionsWithoutAnswers = questions.map((q) => {
    const options = q.options as Array<{ id: string; text: string; isCorrect: boolean }>;
    const sanitizedOptions = options.map(({ id, text }) => ({ id, text }));

    return {
      id: q.id,
      questionText: q.questionText,
      marks: q.marks,
      order: q.order,
      options: sanitizedOptions,
    };
  });

  return paginatedResponse(
    questionsWithoutAnswers,
    page,
    limit,
    total,
    "Questions fetched successfully"
  );
};

export const submitQuizHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  const body = context.body as SubmitQuizBody;

  const result = await quizAttemptsService.submitQuiz({
    quizId: params.id,
    studentId: context.user.id,
    startedAt: new Date(body.startedAt),
    answers: body.answers,
  });

  return successResponse(result, "Quiz submitted successfully");
};

export const getMyAttemptsHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const result = await quizAttemptsService.getAttemptsByStudentId(context.user.id);
  return successResponse(result, "Your quiz attempts fetched successfully");
};

export const getMyAttemptDetailsHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as AttemptParams;
  const attempt = await quizAttemptsService.getAttemptById(params.attemptId);

  if (attempt.studentId !== context.user.id) {
    throw new Error("Unauthorized access to attempt");
  }

  return successResponse(attempt, "Attempt details fetched successfully");
};
