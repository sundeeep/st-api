import type { Context } from "elysia";
import * as quizService from "./admin.service";
import { successResponse, paginatedResponse } from "../../utils/response.util";
import type { SuccessResponse } from "../../types/response.types";
import type {
  AuthenticatedContext,
  CreateCategoryBody,
  UpdateCategoryBody,
  CreateQuizBody,
  UpdateQuizBody,
  AddQuestionsBody,
  UpdateQuestionBody,
  QuizFilters,
} from "./admin.types";

export const createCategoryHandler = async (context: Context): Promise<SuccessResponse> => {
  const body = context.body as CreateCategoryBody;
  const category = await quizService.createCategory(body);
  return successResponse(category, "Category created successfully");
};

export const getAllCategoriesHandler = async (): Promise<SuccessResponse> => {
  const categories = await quizService.getAllCategories();
  return successResponse(categories, "Categories fetched successfully");
};

export const getCategoryHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const category = await quizService.getCategoryById(id);
  return successResponse(category, "Category fetched successfully");
};

export const updateCategoryHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const body = context.body as UpdateCategoryBody;
  const category = await quizService.updateCategory(id, body);
  return successResponse(category, "Category updated successfully");
};

export const deleteCategoryHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  await quizService.deleteCategory(id);
  return successResponse(null, "Category deleted successfully");
};

export const createQuizHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const body = context.body as CreateQuizBody;
  const quiz = await quizService.createQuiz(context.userId, body);
  return successResponse(quiz, "Quiz created successfully");
};

export const getQuizzesHandler = async (context: Context): Promise<SuccessResponse> => {
  const query = context.query as QuizFilters;
  const result = await quizService.getQuizzes(query);
  return paginatedResponse(
    result.data,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    "Quizzes fetched successfully"
  );
};

export const getQuizHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const quiz = await quizService.getQuizById(id);
  return successResponse(quiz, "Quiz fetched successfully");
};

export const updateQuizHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const body = context.body as UpdateQuizBody;
  const quiz = await quizService.updateQuiz(id, body);
  return successResponse(quiz, "Quiz updated successfully");
};

export const deleteQuizHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  await quizService.deleteQuiz(id);
  return successResponse(null, "Quiz deleted successfully");
};

export const publishQuizHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const quiz = await quizService.publishQuiz(id);
  return successResponse(quiz, "Quiz published successfully");
};

export const addQuestionsHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const body = context.body as AddQuestionsBody;
  const questions = await quizService.addQuestions(id, body);
  return successResponse(questions, "Questions added successfully");
};

export const getQuizQuestionsHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const questions = await quizService.getQuizQuestions(id);
  return successResponse(questions, "Questions fetched successfully");
};

export const updateQuestionHandler = async (context: Context): Promise<SuccessResponse> => {
  const { questionId } = context.params as { questionId: string };
  const body = context.body as UpdateQuestionBody;
  const question = await quizService.updateQuestion(questionId, body);
  return successResponse(question, "Question updated successfully");
};

export const deleteQuestionHandler = async (context: Context): Promise<SuccessResponse> => {
  const { questionId } = context.params as { questionId: string };
  await quizService.deleteQuestion(questionId);
  return successResponse(null, "Question deleted successfully");
};

export const getQuizParticipantsHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const participants = await quizService.getQuizParticipants(id);
  return successResponse(participants, "Participants fetched successfully");
};

export const getQuizAnalyticsHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const analytics = await quizService.getQuizAnalytics(id);
  return successResponse(analytics, "Analytics fetched successfully");
};

export const getUserAttemptsHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id, userId } = context.params as { id: string; userId: string };
  const attempts = await quizService.getUserAttempts(id, userId);
  return successResponse(attempts, "User attempts fetched successfully");
};

export const getDashboardStatsHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const stats = await quizService.getDashboardStats(context.userId);
  return successResponse(stats, "Dashboard stats fetched successfully");
};
