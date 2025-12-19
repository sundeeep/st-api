import { db } from "../db";
import { quizQuestions, type NewQuizQuestion } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { NotFoundError } from "../utils/errors.util";
import { sanitizeString } from "../utils/sanitization.util";
import { getQuizById, updateTotalQuestions } from "./quiz.service";

export const createQuestion = async (data: NewQuizQuestion) => {
  await getQuizById(data.quizId);

  const sanitizedData = {
    ...data,
    questionText: sanitizeString(data.questionText),
  };

  const [question] = await db.insert(quizQuestions).values(sanitizedData).returning();

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, data.quizId));

  await updateTotalQuestions(data.quizId, countResult.count);

  return question;
};

export const getQuestionsByQuizId = async (
  quizId: string,
  page: number = 1,
  limit: number = 10
) => {
  await getQuizById(quizId);

  const offset = (page - 1) * limit;

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.order)
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId));

  return {
    questions,
    total: countResult.count,
  };
};

export const getAllQuestionsByQuizId = async (quizId: string) => {
  await getQuizById(quizId);

  return await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.order);
};

export const getQuestionById = async (id: string) => {
  const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, id));

  if (!question) {
    throw NotFoundError("Question not found");
  }

  return question;
};

export const updateQuestion = async (id: string, data: Partial<NewQuizQuestion>) => {
  const sanitizedData: any = { ...data };

  if (data.questionText) {
    sanitizedData.questionText = sanitizeString(data.questionText);
  }

  const [updatedQuestion] = await db
    .update(quizQuestions)
    .set(sanitizedData)
    .where(eq(quizQuestions.id, id))
    .returning();

  if (!updatedQuestion) {
    throw NotFoundError("Question not found");
  }

  return updatedQuestion;
};

export const deleteQuestion = async (id: string) => {
  const question = await getQuestionById(id);

  const [deletedQuestion] = await db
    .delete(quizQuestions)
    .where(eq(quizQuestions.id, id))
    .returning();

  if (!deletedQuestion) {
    throw NotFoundError("Question not found");
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, question.quizId));

  await updateTotalQuestions(question.quizId, countResult.count);

  return deletedQuestion;
};
