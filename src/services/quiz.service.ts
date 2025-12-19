import { db } from "../db";
import { quizzes, type NewQuiz } from "../db/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../utils/errors.util";
import { sanitizeString, sanitizeMarkdown } from "../utils/sanitization.util";

export const createQuiz = async (data: NewQuiz) => {
  const sanitizedData = {
    ...data,
    title: sanitizeString(data.title),
    description: sanitizeMarkdown(data.description),
  };

  const [quiz] = await db.insert(quizzes).values(sanitizedData).returning();
  return quiz;
};

export const getAllQuizzes = async () => {
  return await db.select().from(quizzes).orderBy(quizzes.createdAt);
};

export const getActiveQuizzes = async () => {
  return await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.isActive, true))
    .orderBy(quizzes.createdAt);
};

export const getQuizById = async (id: string) => {
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));

  if (!quiz) {
    throw NotFoundError("Quiz not found");
  }

  return quiz;
};

export const updateQuiz = async (id: string, data: Partial<NewQuiz>) => {
  const sanitizedData: Partial<NewQuiz> & { updatedAt: Date } = { ...data, updatedAt: new Date() };

  if (data.title) {
    sanitizedData.title = sanitizeString(data.title);
  }
  if (data.description) {
    sanitizedData.description = sanitizeMarkdown(data.description);
  }

  const [updatedQuiz] = await db
    .update(quizzes)
    .set(sanitizedData)
    .where(eq(quizzes.id, id))
    .returning();

  if (!updatedQuiz) {
    throw NotFoundError("Quiz not found");
  }

  return updatedQuiz;
};

export const deleteQuiz = async (id: string) => {
  const [deletedQuiz] = await db.delete(quizzes).where(eq(quizzes.id, id)).returning();

  if (!deletedQuiz) {
    throw NotFoundError("Quiz not found");
  }

  return deletedQuiz;
};

export const updateTotalQuestions = async (quizId: string, totalQuestions: number) => {
  const [updatedQuiz] = await db
    .update(quizzes)
    .set({ totalQuestions, updatedAt: new Date() })
    .where(eq(quizzes.id, quizId))
    .returning();

  if (!updatedQuiz) {
    throw NotFoundError("Quiz not found");
  }

  return updatedQuiz;
};
