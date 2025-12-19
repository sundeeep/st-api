import { db } from "../db";
import { quizAttempts, type NewQuizAttempt } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/errors.util";
import { getQuizById } from "./quiz.service";
import { getAllQuestionsByQuizId } from "./quizQuestions.service";

interface SubmitQuizData {
  quizId: string;
  studentId: string;
  startedAt: Date;
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
  }>;
}

export const submitQuiz = async (data: SubmitQuizData) => {
  const quiz = await getQuizById(data.quizId);
  const questions = await getAllQuestionsByQuizId(data.quizId);

  if (questions.length === 0) {
    throw BadRequestError("Quiz has no questions");
  }

  if (data.answers.length !== questions.length) {
    throw BadRequestError(`Expected ${questions.length} answers, received ${data.answers.length}`);
  }

  let totalScore = 0;
  let totalMarks = 0;
  const gradedAnswers = [];

  for (const question of questions) {
    totalMarks += question.marks;

    const studentAnswer = data.answers.find((a) => a.questionId === question.id);

    if (!studentAnswer) {
      throw BadRequestError(`Answer for question ${question.id} is missing`);
    }

    const options = question.options as Array<{ id: string; text: string; isCorrect: boolean }>;
    const selectedOption = options.find((opt) => opt.id === studentAnswer.selectedOptionId);

    if (!selectedOption) {
      throw BadRequestError(`Invalid option selected for question ${question.id}`);
    }

    const isCorrect = selectedOption.isCorrect;
    const marksAwarded = isCorrect ? question.marks : 0;
    totalScore += marksAwarded;

    gradedAnswers.push({
      questionId: question.id,
      selectedOptionId: studentAnswer.selectedOptionId,
      isCorrect,
      marksAwarded,
    });
  }

  const isPassed = totalScore >= quiz.passingMarks;
  const submittedAt = new Date();
  const timeSpent = Math.floor((submittedAt.getTime() - data.startedAt.getTime()) / 1000);

  const attemptData: NewQuizAttempt = {
    quizId: data.quizId,
    studentId: data.studentId,
    answers: gradedAnswers,
    score: totalScore,
    totalMarks,
    isPassed,
    startedAt: data.startedAt,
    submittedAt,
    timeSpent,
  };

  const [attempt] = await db.insert(quizAttempts).values(attemptData).returning();

  return attempt;
};

export const getAttemptById = async (id: string) => {
  const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));

  if (!attempt) {
    throw NotFoundError("Quiz attempt not found");
  }

  return attempt;
};

export const getAttemptsByQuizId = async (quizId: string) => {
  await getQuizById(quizId);

  return await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.quizId, quizId))
    .orderBy(quizAttempts.submittedAt);
};

export const getAttemptsByStudentId = async (studentId: string) => {
  return await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.studentId, studentId))
    .orderBy(quizAttempts.submittedAt);
};

export const getStudentAttemptForQuiz = async (quizId: string, studentId: string) => {
  return await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.studentId, studentId)))
    .orderBy(quizAttempts.submittedAt);
};
