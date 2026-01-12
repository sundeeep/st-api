import { eq, desc, and, sql, ilike, or } from "drizzle-orm";
import { db } from "../db";
import {
  quizCategories,
  quizzes,
  quizQuestions,
  quizQuestionOptions,
  userQuizAttempts,
  userQuizAnswers,
  quizLeaderboard,
} from "./quiz.schema";
import { ValidationError, NotFoundError, BadRequestError } from "../utils/errors.util";
import { QUIZ_CONFIG } from "./quiz.config";
import type {
  CreateCategoryBody,
  UpdateCategoryBody,
  CreateQuizBody,
  UpdateQuizBody,
  AddQuestionsBody,
  UpdateQuestionBody,
  QuizFilters,
} from "./quiz.types";

export async function createCategory(data: CreateCategoryBody) {
  const [category] = await db
    .insert(quizCategories)
    .values({
      name: data.name,
      description: data.description,
    })
    .returning();

  return category;
}

export async function getAllCategories() {
  return await db.select().from(quizCategories).orderBy(desc(quizCategories.createdAt));
}

export async function getCategoryById(id: string) {
  const [category] = await db.select().from(quizCategories).where(eq(quizCategories.id, id));

  if (!category) {
    throw NotFoundError("Category not found");
  }

  return category;
}

export async function updateCategory(id: string, data: UpdateCategoryBody) {
  const [updated] = await db
    .update(quizCategories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(quizCategories.id, id))
    .returning();

  if (!updated) {
    throw NotFoundError("Category not found");
  }

  return updated;
}

export async function deleteCategory(id: string) {
  const [deleted] = await db.delete(quizCategories).where(eq(quizCategories.id, id)).returning();

  if (!deleted) {
    throw NotFoundError("Category not found");
  }

  return { success: true };
}

export async function createQuiz(userId: string, data: CreateQuizBody) {
  if (data.categoryId) {
    await getCategoryById(data.categoryId);
  }

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (endDate <= startDate) {
    throw ValidationError("End date must be after start date");
  }

  const [quiz] = await db
    .insert(quizzes)
    .values({
      createdBy: userId,
      categoryId: data.categoryId,
      quizName: data.quizName,
      quizType: data.quizType,
      about: data.about,
      bannerImage: data.bannerImage,
      rewardsType: data.rewardsType,
      rewardsValue: data.rewardsValue?.toString(),
      timerDuration: data.timerDuration,
      startDate,
      endDate,
      revealAnswersDate: data.revealAnswersDate ? new Date(data.revealAnswersDate) : null,
      maxAttempts: data.maxAttempts ?? QUIZ_CONFIG.DEFAULTS.MAX_ATTEMPTS,
      shuffleQuestions: data.shuffleQuestions ?? false,
      shuffleOptions: data.shuffleOptions ?? false,
      status: "draft",
      isActive: true,
    })
    .returning();

  return quiz;
}

export async function getQuizzes(filters: QuizFilters) {
  const page = filters.page ? Number(filters.page) : 1;
  const limit = filters.limit ? Number(filters.limit) : QUIZ_CONFIG.DEFAULTS.PAGE_SIZE;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filters.categoryId) {
    conditions.push(eq(quizzes.categoryId, filters.categoryId));
  }

  if (filters.status) {
    conditions.push(eq(quizzes.status, filters.status));
  }

  if (filters.quizType) {
    conditions.push(eq(quizzes.quizType, filters.quizType));
  }

  if (filters.search) {
    conditions.push(ilike(quizzes.quizName, `%${filters.search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      quiz: quizzes,
      category: quizCategories,
    })
    .from(quizzes)
    .leftJoin(quizCategories, eq(quizzes.categoryId, quizCategories.id))
    .where(whereClause)
    .orderBy(desc(quizzes.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(quizzes)
    .where(whereClause);

  return {
    data: results.map((r) => ({
      ...r.quiz,
      categoryName: r.category?.name,
    })),
    pagination: {
      page,
      limit,
      total: Number(countResult.count),
      totalPages: Math.ceil(Number(countResult.count) / limit),
    },
  };
}

export async function getQuizById(id: string) {
  const [result] = await db
    .select({
      quiz: quizzes,
      category: quizCategories,
    })
    .from(quizzes)
    .leftJoin(quizCategories, eq(quizzes.categoryId, quizCategories.id))
    .where(eq(quizzes.id, id));

  if (!result) {
    throw NotFoundError("Quiz not found");
  }

  return {
    ...result.quiz,
    categoryName: result.category?.name,
  };
}

export async function updateQuiz(id: string, data: UpdateQuizBody) {
  await getQuizById(id);

  if (data.categoryId) {
    await getCategoryById(data.categoryId);
  }

  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate <= startDate) {
      throw ValidationError("End date must be after start date");
    }
  }

  const updateData: any = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);
  if (data.revealAnswersDate) updateData.revealAnswersDate = new Date(data.revealAnswersDate);
  if (data.rewardsValue !== undefined) updateData.rewardsValue = data.rewardsValue.toString();

  const [updated] = await db.update(quizzes).set(updateData).where(eq(quizzes.id, id)).returning();

  return updated;
}

export async function deleteQuiz(id: string) {
  const [deleted] = await db.delete(quizzes).where(eq(quizzes.id, id)).returning();

  if (!deleted) {
    throw NotFoundError("Quiz not found");
  }

  return { success: true };
}

export async function publishQuiz(id: string) {
  const quiz = await getQuizById(id);

  if (quiz.questionsCount === 0) {
    throw BadRequestError("Cannot publish quiz without questions");
  }

  const now = new Date();
  let status: string;

  if (new Date(quiz.startDate) > now) {
    status = "scheduled";
  } else if (new Date(quiz.endDate) < now) {
    status = "completed";
  } else {
    status = "active";
  }

  const [updated] = await db
    .update(quizzes)
    .set({
      status,
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(quizzes.id, id))
    .returning();

  return updated;
}

export async function addQuestions(quizId: string, data: AddQuestionsBody) {
  await getQuizById(quizId);

  for (const question of data.questions) {
    if (question.options.length !== QUIZ_CONFIG.VALIDATION.MAX_OPTIONS_PER_QUESTION) {
      throw ValidationError(
        `Each question must have exactly ${QUIZ_CONFIG.VALIDATION.MAX_OPTIONS_PER_QUESTION} options`
      );
    }

    const correctCount = question.options.filter((o) => o.isCorrect).length;
    if (correctCount === 0) {
      throw ValidationError("Each question must have at least one correct answer");
    }

    const displayOrders = question.options.map((o) => o.displayOrder);
    const uniqueOrders = new Set(displayOrders);
    if (uniqueOrders.size !== displayOrders.length) {
      throw ValidationError("Display orders must be unique");
    }
  }

  const insertedQuestions = [];

  for (const question of data.questions) {
    const [insertedQuestion] = await db
      .insert(quizQuestions)
      .values({
        quizId,
        questionText: question.questionText,
        explanation: question.explanation,
        points: question.points?.toString() ?? QUIZ_CONFIG.DEFAULTS.QUESTION_POINTS.toString(),
      })
      .returning();

    await db.insert(quizQuestionOptions).values(
      question.options.map((option) => ({
        questionId: insertedQuestion.id,
        optionText: option.optionText,
        isCorrect: option.isCorrect,
        displayOrder: option.displayOrder,
      }))
    );

    insertedQuestions.push(insertedQuestion);
  }

  await db
    .update(quizzes)
    .set({
      questionsCount: sql`${quizzes.questionsCount} + ${data.questions.length}`,
      updatedAt: new Date(),
    })
    .where(eq(quizzes.id, quizId));

  return insertedQuestions;
}

export async function getQuizQuestions(quizId: string) {
  await getQuizById(quizId);

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.createdAt);

  const questionsWithOptions = await Promise.all(
    questions.map(async (question) => {
      const options = await db
        .select()
        .from(quizQuestionOptions)
        .where(eq(quizQuestionOptions.questionId, question.id))
        .orderBy(quizQuestionOptions.displayOrder);

      return {
        ...question,
        options,
      };
    })
  );

  return questionsWithOptions;
}

export async function updateQuestion(questionId: string, data: UpdateQuestionBody) {
  const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, questionId));

  if (!question) {
    throw NotFoundError("Question not found");
  }

  if (data.options) {
    if (data.options.length !== QUIZ_CONFIG.VALIDATION.MAX_OPTIONS_PER_QUESTION) {
      throw ValidationError(
        `Must have exactly ${QUIZ_CONFIG.VALIDATION.MAX_OPTIONS_PER_QUESTION} options`
      );
    }

    const correctCount = data.options.filter((o) => o.isCorrect).length;
    if (correctCount === 0) {
      throw ValidationError("Must have at least one correct answer");
    }

    await db.delete(quizQuestionOptions).where(eq(quizQuestionOptions.questionId, questionId));

    await db.insert(quizQuestionOptions).values(
      data.options.map((option) => ({
        questionId,
        optionText: option.optionText,
        isCorrect: option.isCorrect,
        displayOrder: option.displayOrder,
      }))
    );
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.questionText) updateData.questionText = data.questionText;
  if (data.explanation !== undefined) updateData.explanation = data.explanation;
  if (data.points !== undefined) updateData.points = data.points.toString();

  const [updated] = await db
    .update(quizQuestions)
    .set(updateData)
    .where(eq(quizQuestions.id, questionId))
    .returning();

  return updated;
}

export async function deleteQuestion(questionId: string) {
  const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, questionId));

  if (!question) {
    throw NotFoundError("Question not found");
  }

  await db.delete(quizQuestions).where(eq(quizQuestions.id, questionId));

  await db
    .update(quizzes)
    .set({
      questionsCount: sql`GREATEST(0, ${quizzes.questionsCount} - 1)`,
      updatedAt: new Date(),
    })
    .where(eq(quizzes.id, question.quizId));

  return { success: true };
}

export async function getQuizParticipants(quizId: string) {
  await getQuizById(quizId);

  const participants = await db
    .select({
      attemptId: userQuizAttempts.id,
      userId: userQuizAttempts.userId,
      attemptNumber: userQuizAttempts.attemptNumber,
      status: userQuizAttempts.status,
      scoreObtained: userQuizAttempts.scoreObtained,
      scorePercentage: userQuizAttempts.scorePercentage,
      timeSpent: userQuizAttempts.timeSpent,
      startedAt: userQuizAttempts.startedAt,
      submittedAt: userQuizAttempts.submittedAt,
    })
    .from(userQuizAttempts)
    .where(eq(userQuizAttempts.quizId, quizId))
    .orderBy(desc(userQuizAttempts.startedAt));

  return participants;
}

export async function getQuizAnalytics(quizId: string) {
  await getQuizById(quizId);

  const [stats] = await db
    .select({
      totalAttempts: sql<number>`COUNT(*)`,
      completedAttempts: sql<number>`COUNT(*) FILTER (WHERE status = 'submitted')`,
      inProgressAttempts: sql<number>`COUNT(*) FILTER (WHERE status = 'in_progress')`,
      abandonedAttempts: sql<number>`COUNT(*) FILTER (WHERE status = 'abandoned')`,
      avgScore: sql<number>`AVG(CASE WHEN status = 'submitted' THEN score_percentage ELSE NULL END)`,
      avgTimeSpent: sql<number>`AVG(CASE WHEN status = 'submitted' THEN time_spent ELSE NULL END)`,
    })
    .from(userQuizAttempts)
    .where(eq(userQuizAttempts.quizId, quizId));

  const totalAttempts = Number(stats.totalAttempts) || 0;
  const completedAttempts = Number(stats.completedAttempts) || 0;

  return {
    totalParticipants: totalAttempts,
    completedAttempts,
    inProgressAttempts: Number(stats.inProgressAttempts) || 0,
    abandonedAttempts: Number(stats.abandonedAttempts) || 0,
    completionRate: totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0,
    averageScore: Number(stats.avgScore) || 0,
    averageTimeSpent: Number(stats.avgTimeSpent) || 0,
  };
}

export async function getUserAttempts(quizId: string, userId: string) {
  await getQuizById(quizId);

  const attempts = await db
    .select()
    .from(userQuizAttempts)
    .where(and(eq(userQuizAttempts.quizId, quizId), eq(userQuizAttempts.userId, userId)))
    .orderBy(desc(userQuizAttempts.attemptNumber));

  return attempts;
}

export async function getDashboardStats(userId: string) {
  const [quizStats] = await db
    .select({
      totalQuizzes: sql<number>`COUNT(*)`,
      activeQuizzes: sql<number>`COUNT(*) FILTER (WHERE status = 'active')`,
    })
    .from(quizzes)
    .where(eq(quizzes.createdBy, userId));

  const [participantStats] = await db
    .select({
      totalParticipants: sql<number>`COUNT(DISTINCT user_id)`,
    })
    .from(userQuizAttempts)
    .innerJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
    .where(eq(quizzes.createdBy, userId));

  const [categoryStats] = await db
    .select({
      totalCategories: sql<number>`COUNT(*)`,
    })
    .from(quizCategories);

  const recentQuizzes = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.createdBy, userId))
    .orderBy(desc(quizzes.createdAt))
    .limit(5);

  return {
    totalQuizzes: Number(quizStats.totalQuizzes) || 0,
    activeQuizzes: Number(quizStats.activeQuizzes) || 0,
    totalParticipants: Number(participantStats.totalParticipants) || 0,
    totalCategories: Number(categoryStats.totalCategories) || 0,
    recentQuizzes,
  };
}
