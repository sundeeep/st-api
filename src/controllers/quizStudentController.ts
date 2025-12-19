import * as quizService from "../services/quiz.service";
import * as quizQuestionsService from "../services/quizQuestions.service";
import * as quizAttemptsService from "../services/quizAttempts.service";
import { successResponse, paginatedResponse } from "../utils/response.util";

export const getActiveQuizzesHandler = async () => {
  const result = await quizService.getActiveQuizzes();
  return successResponse(result, "Active quizzes fetched successfully");
};

export const getQuizDetailsHandler = async (context: any) => {
  const { params } = context;
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

export const getQuizQuestionsHandler = async (context: any) => {
  const { params, query } = context;
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

export const submitQuizHandler = async (context: any) => {
  const { params, body, user } = context;

  const result = await quizAttemptsService.submitQuiz({
    quizId: params.id,
    studentId: user.id,
    startedAt: new Date(body.startedAt),
    answers: body.answers,
  });

  return successResponse(result, "Quiz submitted successfully");
};

export const getMyAttemptsHandler = async (context: any) => {
  const { user } = context;
  const result = await quizAttemptsService.getAttemptsByStudentId(user.id);
  return successResponse(result, "Your quiz attempts fetched successfully");
};

export const getMyAttemptDetailsHandler = async (context: any) => {
  const { params, user } = context;
  const attempt = await quizAttemptsService.getAttemptById(params.attemptId);

  if (attempt.studentId !== user.id) {
    throw new Error("Unauthorized access to attempt");
  }

  return successResponse(attempt, "Attempt details fetched successfully");
};
