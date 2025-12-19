import * as quizService from "../services/quiz.service";
import * as quizQuestionsService from "../services/quizQuestions.service";
import * as quizAttemptsService from "../services/quizAttempts.service";
import { successResponse, paginatedResponse } from "../utils/response.util";

export const createQuizHandler = async (context: any) => {
  const { body, user } = context;
  const result = await quizService.createQuiz({
    ...body,
    createdById: user.id,
  });
  return successResponse(result, "Quiz created successfully");
};

export const getAllQuizzesHandler = async () => {
  const result = await quizService.getAllQuizzes();
  return successResponse(result, "Quizzes fetched successfully");
};

export const getQuizByIdHandler = async (context: any) => {
  const { params } = context;
  const result = await quizService.getQuizById(params.id);
  return successResponse(result, "Quiz fetched successfully");
};

export const updateQuizHandler = async (context: any) => {
  const { params, body } = context;
  const result = await quizService.updateQuiz(params.id, body);
  return successResponse(result, "Quiz updated successfully");
};

export const deleteQuizHandler = async (context: any) => {
  const { params } = context;
  await quizService.deleteQuiz(params.id);
  return successResponse(undefined, "Quiz deleted successfully");
};

export const createQuestionHandler = async (context: any) => {
  const { params, body } = context;
  const result = await quizQuestionsService.createQuestion({
    quizId: params.id,
    ...body,
  });
  return successResponse(result, "Question created successfully");
};

export const getQuestionsByQuizIdHandler = async (context: any) => {
  const { params } = context;
  const result = await quizQuestionsService.getAllQuestionsByQuizId(params.id);
  return successResponse(result, "Questions fetched successfully");
};

export const updateQuestionHandler = async (context: any) => {
  const { params, body } = context;
  const result = await quizQuestionsService.updateQuestion(params.questionId, body);
  return successResponse(result, "Question updated successfully");
};

export const deleteQuestionHandler = async (context: any) => {
  const { params } = context;
  await quizQuestionsService.deleteQuestion(params.questionId);
  return successResponse(undefined, "Question deleted successfully");
};

export const getAttemptsByQuizIdHandler = async (context: any) => {
  const { params } = context;
  const result = await quizAttemptsService.getAttemptsByQuizId(params.id);
  return successResponse(result, "Quiz attempts fetched successfully");
};

export const getAttemptByIdHandler = async (context: any) => {
  const { params } = context;
  const result = await quizAttemptsService.getAttemptById(params.attemptId);
  return successResponse(result, "Attempt details fetched successfully");
};
