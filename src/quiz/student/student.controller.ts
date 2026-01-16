import type { Context } from "elysia";
import * as studentService from "./student.service";
import { successResponse, paginatedResponse } from "../../utils/response.util";
import type { SuccessResponse } from "../../types/response.types";
import type { AuthenticatedContext } from "../../auth/auth.types";
import type {
  BrowseQuizzesFilters,
  SubmitAnswerRequest,
  CompleteQuizRequest,
  MyAttemptsFilters,
  LeaderboardFilters,
} from "./student.types";

interface QuizParams {
  id: string;
  [key: string]: string;
}

interface AttemptParams {
  attemptId: string;
  [key: string]: string;
}

export const browseQuizzesHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const filters: BrowseQuizzesFilters = {
    categoryId: context.query?.categoryId as string | undefined,
    quizType: context.query?.quizType as
      | "timed"
      | "practice"
      | "competitive"
      | "assessment"
      | undefined,
    search: context.query?.search as string | undefined,
    page: context.query?.page as string | undefined,
    limit: context.query?.limit as string | undefined,
  };

  const result = await studentService.browseQuizzes(filters, context.userId);

  return paginatedResponse(
    result.quizzes,
    parseInt(filters.page || "1"),
    parseInt(filters.limit || "10"),
    result.total,
    "Quizzes fetched successfully"
  );
};

export const getCategoriesHandler = async (): Promise<SuccessResponse> => {
  const categories = await studentService.getCategories();
  return successResponse(categories, "Categories fetched successfully");
};

export const getQuizDetailsHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  const quiz = await studentService.getQuizDetails(params.id, context.userId);
  return successResponse(quiz, "Quiz details fetched successfully");
};

export const startQuizAttemptHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  const attempt = await studentService.startQuizAttempt(params.id, context.userId);
  return successResponse(attempt, "Quiz attempt started successfully");
};

export const submitAnswerHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as AttemptParams;
  const body = context.body as SubmitAnswerRequest;

  const result = await studentService.submitAnswer(params.attemptId, context.userId, body);

  const message =
    "resultId" in result ? "Quiz completed successfully" : "Answer submitted successfully";

  return successResponse(result, message);
};

export const completeQuizHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as AttemptParams;
  const body = context.body as CompleteQuizRequest;

  const result = await studentService.completeQuiz(params.attemptId, context.userId, body);
  return successResponse(result, "Quiz completed successfully");
};

export const getAttemptResultHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as AttemptParams;
  const result = await studentService.getAttemptResult(params.attemptId, context.userId);
  return successResponse(result, "Attempt result fetched successfully");
};

export const getMyAttemptsHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const filters: MyAttemptsFilters = {
    quizId: context.query?.quizId as string | undefined,
    status: context.query?.status as "in_progress" | "completed" | undefined,
    page: context.query?.page as string | undefined,
    limit: context.query?.limit as string | undefined,
  };

  const result = await studentService.getMyAttempts(context.userId, filters);

  return paginatedResponse(
    result.attempts,
    parseInt(filters.page || "1"),
    parseInt(filters.limit || "10"),
    result.total,
    "Your attempts fetched successfully"
  );
};

export const getLeaderboardHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  const filters: LeaderboardFilters = {
    page: context.query?.page as string | undefined,
    limit: context.query?.limit as string | undefined,
  };

  const leaderboard = await studentService.getLeaderboard(params.id, context.userId, filters);
  return successResponse(leaderboard, "Leaderboard fetched successfully");
};

export const getFeaturedQuizzesHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const filters: BrowseQuizzesFilters = {
    categoryId: context.query?.categoryId as string | undefined,
    quizType: context.query?.quizType as
      | "timed"
      | "practice"
      | "competitive"
      | "assessment"
      | undefined,
    search: context.query?.search as string | undefined,
    page: context.query?.page as string | undefined,
    limit: context.query?.limit as string | undefined,
  };

  const result = await studentService.getFeaturedQuizzes(filters, context.userId);

  return successResponse(
    {
      featuredQuizzes: result.featuredQuizzes,
      quizzes: result.quizzes,
    },
    "Featured quizzes fetched successfully"
  );
};
