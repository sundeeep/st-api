import type { Context } from "elysia";
import * as quizService from "../services/quiz.service";
import * as quizQuestionsService from "../services/quizQuestions.service";
import * as quizAttemptsService from "../services/quizAttempts.service";
import { successResponse, paginatedResponse } from "../utils/response.util";
import type { SuccessResponse } from "../types/response.types";

interface CreateQuizBody {
  title: string;
  description: string;
  duration: number;
  passingMarks: number;
  totalQuestions: number;
  isActive?: boolean;
}

interface UpdateQuizBody {
  title?: string;
  description?: string;
  duration?: number;
  passingMarks?: number;
  totalQuestions?: number;
  isActive?: boolean;
}

interface CreateQuestionBody {
  questionText: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  marks: number;
  order: number;
}

interface UpdateQuestionBody {
  questionText?: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  marks?: number;
  order?: number;
}

interface QuizParams {
  id: string;
  [key: string]: string;
}

interface QuestionParams {
  id: string;
  questionId: string;
  [key: string]: string;
}

interface AttemptParams {
  id: string;
  attemptId: string;
  [key: string]: string;
}

interface AuthenticatedContext extends Context {
  user: {
    id: string;
    phoneNumber: string;
    role: string;
  };
}

export const createQuizHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const body = context.body as CreateQuizBody;
  const result = await quizService.createQuiz({
    ...body,
    createdById: context.user.id,
  });
  return successResponse(result, "Quiz created successfully");
};

export const getAllQuizzesHandler = async (): Promise<SuccessResponse> => {
  const result = await quizService.getAllQuizzes();
  return successResponse(result, "Quizzes fetched successfully");
};

export const getQuizByIdHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  const result = await quizService.getQuizById(params.id);
  return successResponse(result, "Quiz fetched successfully");
};

export const updateQuizHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  const body = context.body as UpdateQuizBody;
  const result = await quizService.updateQuiz(params.id, body);
  return successResponse(result, "Quiz updated successfully");
};

export const deleteQuizHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  await quizService.deleteQuiz(params.id);
  return successResponse(undefined, "Quiz deleted successfully");
};

export const createQuestionHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  const body = context.body as CreateQuestionBody;
  const result = await quizQuestionsService.createQuestion({
    quizId: params.id,
    ...body,
  });
  return successResponse(result, "Question created successfully");
};

export const getQuestionsByQuizIdHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  const result = await quizQuestionsService.getAllQuestionsByQuizId(params.id);
  return successResponse(result, "Questions fetched successfully");
};

export const updateQuestionHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as QuestionParams;
  const body = context.body as UpdateQuestionBody;
  const result = await quizQuestionsService.updateQuestion(params.questionId, body);
  return successResponse(result, "Question updated successfully");
};

export const deleteQuestionHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as QuestionParams;
  await quizQuestionsService.deleteQuestion(params.questionId);
  return successResponse(undefined, "Question deleted successfully");
};

export const getAttemptsByQuizIdHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as QuizParams;
  const result = await quizAttemptsService.getAttemptsByQuizId(params.id);
  return successResponse(result, "Quiz attempts fetched successfully");
};

export const getAttemptByIdHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as AttemptParams;
  const result = await quizAttemptsService.getAttemptById(params.attemptId);
  return successResponse(result, "Attempt details fetched successfully");
};
