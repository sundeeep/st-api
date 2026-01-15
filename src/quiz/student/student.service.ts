import { eq, desc, and, sql, gte, lte, count, avg, max, inArray, gt, lt, or } from "drizzle-orm";
import { db } from "../../db";
import {
  quizCategories,
  quizzes,
  quizQuestions,
  quizQuestionOptions,
  userQuizAttempts,
  userQuizAnswers,
  quizLeaderboard,
} from "../shared/schema";
import { ValidationError, NotFoundError, BadRequestError } from "../../utils/errors.util";
import { QUIZ_CONFIG } from "../shared/config";
import { checkUserInteractions } from "../../interactions/shared/interactions.service";
import type {
  BrowseQuizzesFilters,
  QuizListItem,
  CategoryListItem,
  QuizDetails,
  StartQuizResponse,
  QuizQuestion,
  SubmitAnswerRequest,
  CompleteQuizRequest,
  CompleteQuizResponse,
  AttemptResult,
  MyAttemptsFilters,
  AttemptListItem,
  LeaderboardFilters,
  LeaderboardResponse,
  LeaderboardEntry,
} from "./student.types";

export async function browseQuizzes(
  filters: BrowseQuizzesFilters,
  userId: string
): Promise<{ quizzes: QuizListItem[]; total: number }> {
  const page = parseInt(filters.page || "1");
  const limit = Math.min(parseInt(filters.limit || "10"), QUIZ_CONFIG.DEFAULTS.PAGE_SIZE);
  const offset = (page - 1) * limit;

  const conditions = [eq(quizzes.status, "active")];

  if (filters.categoryId) {
    conditions.push(eq(quizzes.categoryId, filters.categoryId));
  }

  if (filters.quizType) {
    conditions.push(eq(quizzes.quizType, filters.quizType));
  }

  if (filters.search) {
    conditions.push(sql`${quizzes.quizName} ILIKE ${"%" + filters.search + "%"}`);
  }

  const now = new Date();
  conditions.push(lte(quizzes.startDate, now), gte(quizzes.endDate, now));

  const [quizList, totalCount] = await Promise.all([
    db
      .select({
        id: quizzes.id,
        quizName: quizzes.quizName,
        quizType: quizzes.quizType,
        categoryName: quizCategories.name,
        bannerImage: quizzes.bannerImage,
        timerDuration: quizzes.timerDuration,
        totalQuestions: quizzes.questionsCount,
        startDateTime: quizzes.startDate,
        endDateTime: quizzes.endDate,
        rewards: quizzes.rewards,
        likeCount: quizzes.likeCount,
      })
      .from(quizzes)
      .leftJoin(quizCategories, eq(quizzes.categoryId, quizCategories.id))
      .where(and(...conditions))
      .orderBy(desc(quizzes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(quizzes)
      .where(and(...conditions)),
  ]);

  const quizIds = quizList.map((q) => q.id);
  const interactions = await checkUserInteractions(userId, "quiz", quizIds);
  const likedSet = new Set(interactions.liked);
  const bookmarkedSet = new Set(interactions.bookmarked);

  return {
    quizzes: quizList.map((q) => ({
      id: q.id,
      quizName: q.quizName,
      quizType: q.quizType,
      categoryName: q.categoryName || undefined,
      bannerImage: q.bannerImage || undefined,
      timerDuration: q.timerDuration || undefined,
      totalQuestions: q.totalQuestions || 0,
      startDateTime: q.startDateTime?.toISOString(),
      endDateTime: q.endDateTime?.toISOString(),
      rewards: q.rewards
        ? typeof q.rewards === "string"
          ? JSON.parse(q.rewards)
          : q.rewards
        : undefined,
      likeCount: q.likeCount || 0,
      isLiked: likedSet.has(q.id),
      isBookmarked: bookmarkedSet.has(q.id),
    })),
    total: totalCount[0]?.count || 0,
  };
}

export async function getCategories(): Promise<CategoryListItem[]> {
  const categories = await db
    .select({
      id: quizCategories.id,
      name: quizCategories.name,
      description: quizCategories.description,
    })
    .from(quizCategories)
    .orderBy(quizCategories.name);

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || undefined,
  }));
}

export async function getQuizDetails(quizId: string, userId: string): Promise<QuizDetails> {
  const quiz = await db
    .select({
      id: quizzes.id,
      quizName: quizzes.quizName,
      quizType: quizzes.quizType,
      about: quizzes.about,
      categoryName: quizCategories.name,
      bannerImage: quizzes.bannerImage,
      timerDuration: quizzes.timerDuration,
      totalQuestions: quizzes.questionsCount,
      startDate: quizzes.startDate,
      endDate: quizzes.endDate,
      rewards: quizzes.rewards,
      createdAt: quizzes.createdAt,
      status: quizzes.status,
      averageScore: quizzes.averageScore,
      likeCount: quizzes.likeCount,
    })
    .from(quizzes)
    .leftJoin(quizCategories, eq(quizzes.categoryId, quizCategories.id))
    .where(eq(quizzes.id, quizId))
    .limit(1);

  if (!quiz.length || quiz[0].status !== "active") {
    throw NotFoundError("Quiz not found or not available");
  }

  const userAttempts = await db
    .select({
      score: userQuizAttempts.scoreObtained,
    })
    .from(userQuizAttempts)
    .where(
      and(
        eq(userQuizAttempts.quizId, quizId),
        eq(userQuizAttempts.userId, userId),
        eq(userQuizAttempts.status, "completed")
      )
    )
    .orderBy(desc(userQuizAttempts.scoreObtained))
    .limit(1);

  const q = quiz[0];

  // Calculate total marks from questions
  const questions = await db
    .select({ points: quizQuestions.points })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId));

  const totalMarks = questions.reduce((sum, question) => sum + Number(question.points || 0), 0);

  const interactions = await checkUserInteractions(userId, "quiz", [quizId]);

  return {
    id: q.id,
    quizName: q.quizName,
    quizType: q.quizType,
    about: q.about as { description: string; rules: string[] },
    categoryName: q.categoryName || undefined,
    bannerImage: q.bannerImage || undefined,
    timerDuration: q.timerDuration || undefined,
    totalQuestions: q.totalQuestions || 0,
    totalMarks: totalMarks,
    startDateTime: q.startDate?.toISOString(),
    endDateTime: q.endDate?.toISOString(),
    rewards: q.rewards
      ? typeof q.rewards === "string"
        ? JSON.parse(q.rewards)
        : q.rewards
      : undefined,
    createdAt: q.createdAt.toISOString(),
    hasAttempted: userAttempts.length > 0,
    myBestScore: userAttempts[0]?.score ? Number(userAttempts[0].score) : undefined,
    likeCount: q.likeCount || 0,
    isLiked: interactions.liked.includes(quizId),
    isBookmarked: interactions.bookmarked.includes(quizId),
  };
}

export async function startQuizAttempt(quizId: string, userId: string): Promise<StartQuizResponse> {
  const quiz = await db
    .select({
      id: quizzes.id,
      quizName: quizzes.quizName,
      status: quizzes.status,
      totalQuestions: quizzes.questionsCount,
      timerDuration: quizzes.timerDuration,
      shuffleQuestions: quizzes.shuffleQuestions,
      shuffleOptions: quizzes.shuffleOptions,
      averageScore: quizzes.averageScore,
    })
    .from(quizzes)
    .where(eq(quizzes.id, quizId))
    .limit(1);

  if (!quiz.length || quiz[0].status !== "active") {
    throw NotFoundError("Quiz not found or not available");
  }

  const questions = await db
    .select({
      id: quizQuestions.id,
      questionText: quizQuestions.questionText,
      points: quizQuestions.points,
    })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId));

  if (!questions.length) {
    throw BadRequestError("Quiz has no questions");
  }

  const questionIds = questions.map((q) => q.id);
  const options = await db
    .select({
      id: quizQuestionOptions.id,
      questionId: quizQuestionOptions.questionId,
      optionText: quizQuestionOptions.optionText,
      displayOrder: quizQuestionOptions.displayOrder,
    })
    .from(quizQuestionOptions)
    .where(inArray(quizQuestionOptions.questionId, questionIds))
    .orderBy(quizQuestionOptions.displayOrder);

  const startedAt = new Date();
  const [attempt] = await db
    .insert(userQuizAttempts)
    .values({
      quizId,
      userId,
      startedAt,
      status: "in_progress",
      totalQuestions: questions.length,
    })
    .returning({ id: userQuizAttempts.id });

  let questionsWithOptions: QuizQuestion[] = questions.map((q, index) => ({
    id: q.id,
    questionText: q.questionText,
    questionType: "single",
    marks: Number(q.points),
    displayOrder: index + 1,
    options: options
      .filter((o) => o.questionId === q.id)
      .map((o) => ({
        id: o.id,
        optionText: o.optionText,
        displayOrder: o.displayOrder,
      })),
  }));

  if (quiz[0].shuffleQuestions) {
    questionsWithOptions = questionsWithOptions.sort(() => Math.random() - 0.5);
  }

  if (quiz[0].shuffleOptions) {
    questionsWithOptions = questionsWithOptions.map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }));
  }

  const totalMarks = questions.reduce((sum, q) => sum + Number(q.points), 0);

  return {
    attemptId: attempt.id,
    quizId: quiz[0].id,
    startedAt: startedAt.toISOString(),
    questions: questionsWithOptions,
    totalQuestions: questions.length,
    totalMarks,
    timerDuration: quiz[0].timerDuration || undefined,
  };
}

export async function submitAnswer(
  attemptId: string,
  userId: string,
  data: SubmitAnswerRequest
): Promise<{ answerId: string; saved: boolean }> {
  const attempt = await db
    .select({ userId: userQuizAttempts.userId, status: userQuizAttempts.status })
    .from(userQuizAttempts)
    .where(eq(userQuizAttempts.id, attemptId))
    .limit(1);

  if (!attempt.length) {
    throw NotFoundError("Attempt not found");
  }

  if (attempt[0].userId !== userId) {
    throw ValidationError("Unauthorized access to this attempt");
  }

  if (attempt[0].status !== "in_progress") {
    throw BadRequestError("Cannot submit answer to completed attempt");
  }

  const existing = await db
    .select({ id: userQuizAnswers.id })
    .from(userQuizAnswers)
    .where(
      and(eq(userQuizAnswers.attemptId, attemptId), eq(userQuizAnswers.questionId, data.questionId))
    )
    .limit(1);

  const selectedOptionId = data.selectedOptionIds[0] || null;

  if (existing.length) {
    await db
      .update(userQuizAnswers)
      .set({
        selectedOptionId,
      })
      .where(eq(userQuizAnswers.id, existing[0].id));

    return { answerId: existing[0].id, saved: true };
  }

  const [answer] = await db
    .insert(userQuizAnswers)
    .values({
      attemptId,
      questionId: data.questionId,
      selectedOptionId,
    })
    .returning({ id: userQuizAnswers.id });

  return { answerId: answer.id, saved: true };
}

export async function completeQuiz(
  attemptId: string,
  userId: string,
  data: CompleteQuizRequest
): Promise<CompleteQuizResponse> {
  const attempt = await db
    .select({
      quizId: userQuizAttempts.quizId,
      userId: userQuizAttempts.userId,
      status: userQuizAttempts.status,
      startedAt: userQuizAttempts.startedAt,
    })
    .from(userQuizAttempts)
    .where(eq(userQuizAttempts.id, attemptId))
    .limit(1);

  if (!attempt.length) {
    throw NotFoundError("Attempt not found");
  }

  if (attempt[0].userId !== userId) {
    throw ValidationError("Unauthorized access to this attempt");
  }

  if (attempt[0].status !== "in_progress") {
    throw BadRequestError("Attempt already completed");
  }

  const answers = await db
    .select({
      questionId: userQuizAnswers.questionId,
      selectedOptionId: userQuizAnswers.selectedOptionId,
    })
    .from(userQuizAnswers)
    .where(eq(userQuizAnswers.attemptId, attemptId));

  const questionIds = answers.map((a) => a.questionId);
  const questions = await db
    .select({
      id: quizQuestions.id,
      points: quizQuestions.points,
    })
    .from(quizQuestions)
    .where(inArray(quizQuestions.id, questionIds));

  const correctOptions = await db
    .select({
      id: quizQuestionOptions.id,
      questionId: quizQuestionOptions.questionId,
    })
    .from(quizQuestionOptions)
    .where(
      and(
        inArray(quizQuestionOptions.questionId, questionIds),
        eq(quizQuestionOptions.isCorrect, true)
      )
    );

  let scoreObtained = 0;
  let correctAnswersCount = 0;

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    const correctOption = correctOptions.find((o) => o.questionId === answer.questionId);
    const isCorrect = correctOption && answer.selectedOptionId === correctOption.id;

    if (isCorrect) {
      scoreObtained += Number(question.points || 0);
      correctAnswersCount++;
      await db
        .update(userQuizAnswers)
        .set({ isCorrect: true, pointsEarned: (question.points || "0").toString() })
        .where(
          and(
            eq(userQuizAnswers.attemptId, attemptId),
            eq(userQuizAnswers.questionId, answer.questionId)
          )
        );
    } else {
      await db
        .update(userQuizAnswers)
        .set({ isCorrect: false, pointsEarned: "0" })
        .where(
          and(
            eq(userQuizAnswers.attemptId, attemptId),
            eq(userQuizAnswers.questionId, answer.questionId)
          )
        );
    }
  }

  const totalQuestions = questions.length;
  const totalMarks = questions.reduce((sum, q) => sum + Number(q.points), 0);
  const percentage = totalMarks > 0 ? (scoreObtained / totalMarks) * 100 : 0;
  const wrongAnswers = answers.length - correctAnswersCount;
  const skippedQuestions = totalQuestions - answers.length;
  const submittedAt = new Date(data.completedAt);
  const timeSpent = Math.floor((submittedAt.getTime() - attempt[0].startedAt.getTime()) / 1000);

  await db
    .update(userQuizAttempts)
    .set({
      submittedAt,
      status: "completed",
      scoreObtained: scoreObtained.toString(),
      scorePercentage: percentage.toString(),
      timeSpent,
      answeredQuestions: answers.length,
      correctAnswers: correctAnswersCount,
    })
    .where(eq(userQuizAttempts.id, attemptId));

  await db.insert(quizLeaderboard).values({
    quizId: attempt[0].quizId,
    userId,
    attemptId,
    bestScore: scoreObtained.toString(),
    bestPercentage: percentage.toString(),
    bestTimeSpent: timeSpent,
    completedAt: submittedAt,
  });

  await db
    .update(quizzes)
    .set({
      participantsCount: sql`${quizzes.participantsCount} + 1`,
    })
    .where(eq(quizzes.id, attempt[0].quizId));

  const [rankData] = await db
    .select({ count: count() })
    .from(quizLeaderboard)
    .where(
      and(
        eq(quizLeaderboard.quizId, attempt[0].quizId),
        or(
          gt(quizLeaderboard.bestScore, scoreObtained.toString()),
          and(
            eq(quizLeaderboard.bestScore, scoreObtained.toString()),
            lt(quizLeaderboard.bestTimeSpent, timeSpent)
          )
        )
      )
    );

  const rank = (rankData?.count || 0) + 1;

  return {
    attemptId,
    quizId: attempt[0].quizId,
    score: scoreObtained,
    totalMarks,
    percentage: Math.round(percentage * 100) / 100,
    correctAnswers: correctAnswersCount,
    wrongAnswers,
    skippedQuestions,
    timeTaken: timeSpent,
    passed: true,
    rank,
    resultId: attemptId,
  };
}

export async function getAttemptResult(attemptId: string, userId: string): Promise<AttemptResult> {
  const attempt = await db
    .select({
      quizId: userQuizAttempts.quizId,
      userId: userQuizAttempts.userId,
      quizName: quizzes.quizName,
      scoreObtained: userQuizAttempts.scoreObtained,
      scorePercentage: userQuizAttempts.scorePercentage,
      correctAnswers: userQuizAttempts.correctAnswers,
      answeredQuestions: userQuizAttempts.answeredQuestions,
      totalQuestions: userQuizAttempts.totalQuestions,
      startedAt: userQuizAttempts.startedAt,
      submittedAt: userQuizAttempts.submittedAt,
      timeSpent: userQuizAttempts.timeSpent,
      status: userQuizAttempts.status,
    })
    .from(userQuizAttempts)
    .leftJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
    .where(eq(userQuizAttempts.id, attemptId))
    .limit(1);

  if (!attempt.length) {
    throw NotFoundError("Attempt not found");
  }

  if (attempt[0].userId !== userId) {
    throw ValidationError("Unauthorized access to this attempt");
  }

  if (attempt[0].status !== "completed") {
    throw BadRequestError("Attempt not yet completed");
  }

  const attemptLeaderboard = await db
    .select({
      quizId: quizLeaderboard.quizId,
      bestScore: quizLeaderboard.bestScore,
      bestTimeSpent: quizLeaderboard.bestTimeSpent,
    })
    .from(quizLeaderboard)
    .where(eq(quizLeaderboard.attemptId, attemptId))
    .limit(1);

  let rank: number | undefined;
  if (attemptLeaderboard.length) {
    const [rankData] = await db
      .select({ count: count() })
      .from(quizLeaderboard)
      .where(
        and(
          eq(quizLeaderboard.quizId, attemptLeaderboard[0].quizId),
          or(
            gt(quizLeaderboard.bestScore, attemptLeaderboard[0].bestScore),
            and(
              eq(quizLeaderboard.bestScore, attemptLeaderboard[0].bestScore),
              lt(quizLeaderboard.bestTimeSpent, attemptLeaderboard[0].bestTimeSpent || 0)
            )
          )
        )
      );
    rank = (rankData?.count || 0) + 1;
  }

  const answers = await db
    .select({
      questionId: userQuizAnswers.questionId,
      selectedOptionId: userQuizAnswers.selectedOptionId,
      isCorrect: userQuizAnswers.isCorrect,
      pointsEarned: userQuizAnswers.pointsEarned,
      questionText: quizQuestions.questionText,
      points: quizQuestions.points,
    })
    .from(userQuizAnswers)
    .leftJoin(quizQuestions, eq(userQuizAnswers.questionId, quizQuestions.id))
    .where(eq(userQuizAnswers.attemptId, attemptId));

  const questionIds = answers.map((a) => a.questionId);
  const options = await db
    .select({
      id: quizQuestionOptions.id,
      questionId: quizQuestionOptions.questionId,
      optionText: quizQuestionOptions.optionText,
      isCorrect: quizQuestionOptions.isCorrect,
    })
    .from(quizQuestionOptions)
    .where(inArray(quizQuestionOptions.questionId, questionIds));

  const detailedAnswers = answers.map((a) => {
    const selectedOption = options.find((o) => o.id === a.selectedOptionId);
    const correctOptions = options.filter((o) => o.questionId === a.questionId && o.isCorrect);

    return {
      questionId: a.questionId,
      questionText: a.questionText || "",
      marks: Number(a.points) || 0,
      selectedOptionIds: a.selectedOptionId ? [a.selectedOptionId] : [],
      selectedOptionTexts: selectedOption ? [selectedOption.optionText] : [],
      correctOptionIds: correctOptions.map((o) => o.id),
      correctOptionTexts: correctOptions.map((o) => o.optionText),
      isCorrect: a.isCorrect || false,
      marksAwarded: Number(a.pointsEarned) || 0,
      timeTaken: undefined,
    };
  });

  const a = attempt[0];
  const wrongAnswers = (a.answeredQuestions || 0) - (a.correctAnswers || 0);
  const skippedQuestions = (a.totalQuestions || 0) - (a.answeredQuestions || 0);

  return {
    attemptId,
    quizId: a.quizId,
    quizName: a.quizName || "",
    studentId: userId,
    studentName: "Student",
    score: Number(a.scoreObtained) || 0,
    totalMarks: Number(a.scoreObtained) + wrongAnswers,
    percentage: Number(a.scorePercentage) || 0,
    correctAnswers: a.correctAnswers || 0,
    wrongAnswers,
    skippedQuestions,
    startedAt: a.startedAt.toISOString(),
    completedAt: a.submittedAt?.toISOString() || "",
    timeTaken: a.timeSpent || 0,
    passed: true,
    rank,
    answers: detailedAnswers,
  };
}

export async function getMyAttempts(
  userId: string,
  filters: MyAttemptsFilters
): Promise<{ attempts: AttemptListItem[]; total: number }> {
  const page = parseInt(filters.page || "1");
  const limit = Math.min(parseInt(filters.limit || "10"), QUIZ_CONFIG.DEFAULTS.PAGE_SIZE);
  const offset = (page - 1) * limit;

  const conditions = [eq(userQuizAttempts.userId, userId)];

  if (filters.quizId) {
    conditions.push(eq(userQuizAttempts.quizId, filters.quizId));
  }

  if (filters.status) {
    conditions.push(eq(userQuizAttempts.status, filters.status));
  }

  const [attempts, totalCount] = await Promise.all([
    db
      .select({
        attemptId: userQuizAttempts.id,
        quizId: userQuizAttempts.quizId,
        quizName: quizzes.quizName,
        categoryName: quizCategories.name,
        scoreObtained: userQuizAttempts.scoreObtained,
        scorePercentage: userQuizAttempts.scorePercentage,
        status: userQuizAttempts.status,
        startedAt: userQuizAttempts.startedAt,
        submittedAt: userQuizAttempts.submittedAt,
        timeSpent: userQuizAttempts.timeSpent,
        questionsCount: quizzes.questionsCount,
      })
      .from(userQuizAttempts)
      .leftJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
      .leftJoin(quizCategories, eq(quizzes.categoryId, quizCategories.id))
      .where(and(...conditions))
      .orderBy(desc(userQuizAttempts.startedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(userQuizAttempts)
      .where(and(...conditions)),
  ]);

  const attemptsWithRank = await Promise.all(
    attempts.map(async (a) => {
      let rank: number | undefined;
      if (a.status === "completed" && a.scoreObtained && a.timeSpent !== null) {
        const [rankData] = await db
          .select({ count: count() })
          .from(quizLeaderboard)
          .where(
            and(
              eq(quizLeaderboard.quizId, a.quizId),
              or(
                gt(quizLeaderboard.bestScore, a.scoreObtained),
                and(
                  eq(quizLeaderboard.bestScore, a.scoreObtained),
                  lt(quizLeaderboard.bestTimeSpent, a.timeSpent)
                )
              )
            )
          );
        rank = (rankData?.count || 0) + 1;
      }

      const totalMarks = Number(a.scoreObtained) || 0;

      return {
        attemptId: a.attemptId,
        quizId: a.quizId,
        quizName: a.quizName || "",
        categoryName: a.categoryName || undefined,
        score: a.scoreObtained ? Number(a.scoreObtained) : undefined,
        totalMarks,
        percentage: a.scorePercentage ? Number(a.scorePercentage) : undefined,
        status: a.status || "in_progress",
        startedAt: a.startedAt.toISOString(),
        completedAt: a.submittedAt?.toISOString(),
        timeTaken: a.timeSpent || undefined,
        rank,
        passed: undefined,
      };
    })
  );

  return {
    attempts: attemptsWithRank,
    total: totalCount[0]?.count || 0,
  };
}

export async function getLeaderboard(
  quizId: string,
  userId: string,
  filters: LeaderboardFilters
): Promise<LeaderboardResponse> {
  const limit = Math.min(parseInt(filters.limit || "10"), 50);

  const quiz = await db
    .select({ quizName: quizzes.quizName })
    .from(quizzes)
    .where(eq(quizzes.id, quizId))
    .limit(1);

  if (!quiz.length) {
    throw NotFoundError("Quiz not found");
  }

  const topRanks = await db
    .select({
      userId: quizLeaderboard.userId,
      bestScore: quizLeaderboard.bestScore,
      bestPercentage: quizLeaderboard.bestPercentage,
      bestTimeSpent: quizLeaderboard.bestTimeSpent,
      completedAt: quizLeaderboard.completedAt,
    })
    .from(quizLeaderboard)
    .where(eq(quizLeaderboard.quizId, quizId))
    .orderBy(desc(quizLeaderboard.bestScore), quizLeaderboard.bestTimeSpent)
    .limit(limit);

  const myBestAttempt = await db
    .select({
      userId: quizLeaderboard.userId,
      bestScore: quizLeaderboard.bestScore,
      bestPercentage: quizLeaderboard.bestPercentage,
      bestTimeSpent: quizLeaderboard.bestTimeSpent,
      completedAt: quizLeaderboard.completedAt,
    })
    .from(quizLeaderboard)
    .where(and(eq(quizLeaderboard.quizId, quizId), eq(quizLeaderboard.userId, userId)))
    .orderBy(desc(quizLeaderboard.bestScore), quizLeaderboard.bestTimeSpent)
    .limit(1);

  const [stats] = await db
    .select({
      totalParticipants: count(quizLeaderboard.id),
      averageScore: avg(quizLeaderboard.bestScore),
      topScore: max(quizLeaderboard.bestScore),
    })
    .from(quizLeaderboard)
    .where(eq(quizLeaderboard.quizId, quizId));

  const topRanksList: LeaderboardEntry[] = topRanks.map((r, index) => ({
    rank: index + 1,
    userId: r.userId,
    userName: "Student",
    score: Number(r.bestScore),
    percentage: Number(r.bestPercentage),
    timeTaken: r.bestTimeSpent || 0,
    completedAt: r.completedAt?.toISOString() || "",
    isMe: r.userId === userId,
  }));

  let myRank: LeaderboardEntry | null = null;
  if (myBestAttempt.length) {
    const r = myBestAttempt[0];
    const [rankData] = await db
      .select({ count: count() })
      .from(quizLeaderboard)
      .where(
        and(
          eq(quizLeaderboard.quizId, quizId),
          or(
            gt(quizLeaderboard.bestScore, r.bestScore),
            and(
              eq(quizLeaderboard.bestScore, r.bestScore),
              lt(quizLeaderboard.bestTimeSpent, r.bestTimeSpent || 0)
            )
          )
        )
      );
    const rank = (rankData?.count || 0) + 1;

    myRank = {
      rank,
      userId: r.userId,
      userName: "You",
      score: Number(r.bestScore),
      percentage: Number(r.bestPercentage),
      timeTaken: r.bestTimeSpent || 0,
      completedAt: r.completedAt?.toISOString() || "",
      isMe: true,
    };
  }

  return {
    quizId,
    quizName: quiz[0].quizName,
    topRanks: topRanksList,
    myRank,
    stats: {
      totalParticipants: Number(stats.totalParticipants) || 0,
      averageScore: Number(stats.averageScore) || 0,
      topScore: Number(stats.topScore) || 0,
    },
  };
}
