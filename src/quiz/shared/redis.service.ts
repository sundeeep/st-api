import redis from "../../auth/lib/redis";
import { BadRequestError, NotFoundError } from "../../utils/errors.util";

const QUIZ_QUESTIONS_TTL = 86400;
const QUIZ_USER_STATE_TTL_BUFFER = 7200;

function getQuizQuestionsKey(quizId: string): string {
  return `quiz:${quizId}:questions`;
}

function getUserOrderKey(quizId: string, userId: string): string {
  return `quiz:${quizId}:user:${userId}:order`;
}

function getUserIndexKey(quizId: string, userId: string): string {
  return `quiz:${quizId}:user:${userId}:index`;
}

function getUserAttemptKey(quizId: string, userId: string): string {
  return `quiz:${quizId}:user:${userId}:attemptId`;
}

export async function cacheQuizQuestions(quizId: string, questions: any[]): Promise<void> {
  try {
    await redis.setex(getQuizQuestionsKey(quizId), QUIZ_QUESTIONS_TTL, JSON.stringify(questions));
  } catch (error) {
    console.error(`Failed to cache questions for quiz ${quizId}:`, error);
  }
}

export async function getCachedQuestions(quizId: string): Promise<any[] | null> {
  try {
    const cached = await redis.get(getQuizQuestionsKey(quizId));
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error(`Failed to get cached questions for quiz ${quizId}:`, error);
    return null;
  }
}

export async function invalidateQuizCache(quizId: string): Promise<void> {
  try {
    await redis.del(getQuizQuestionsKey(quizId));
  } catch (error) {
    console.error(`Failed to invalidate cache for quiz ${quizId}:`, error);
  }
}

export async function createUserShuffledOrder(
  quizId: string,
  userId: string,
  questionIds: string[],
  shuffleQuestions: boolean,
  ttl: number
): Promise<string[]> {
  let order = [...questionIds];

  if (shuffleQuestions) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }

  const userTtl = ttl + QUIZ_USER_STATE_TTL_BUFFER;

  try {
    await redis.setex(getUserOrderKey(quizId, userId), userTtl, JSON.stringify(order));
  } catch (error) {
    console.error(`Failed to create shuffled order for quiz ${quizId}, user ${userId}:`, error);
  }

  return order;
}

export async function getUserQuestionOrder(
  quizId: string,
  userId: string
): Promise<string[] | null> {
  try {
    const cached = await redis.get(getUserOrderKey(quizId, userId));
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error(`Failed to get user order for quiz ${quizId}, user ${userId}:`, error);
    return null;
  }
}

export async function getCurrentQuestionIndex(quizId: string, userId: string): Promise<number> {
  try {
    const index = await redis.get(getUserIndexKey(quizId, userId));
    return index ? parseInt(index, 10) : 0;
  } catch (error) {
    console.error(`Failed to get current index for quiz ${quizId}, user ${userId}:`, error);
    return 0;
  }
}

export async function setCurrentQuestionIndex(
  quizId: string,
  userId: string,
  index: number,
  ttl: number
): Promise<void> {
  const userTtl = ttl + QUIZ_USER_STATE_TTL_BUFFER;
  try {
    await redis.setex(getUserIndexKey(quizId, userId), userTtl, index.toString());
  } catch (error) {
    console.error(`Failed to set index for quiz ${quizId}, user ${userId}:`, error);
  }
}

export async function incrementQuestionIndex(quizId: string, userId: string): Promise<number> {
  try {
    const newIndex = await redis.incr(getUserIndexKey(quizId, userId));
    return newIndex;
  } catch (error) {
    console.error(`Failed to increment index for quiz ${quizId}, user ${userId}:`, error);
    const current = await getCurrentQuestionIndex(quizId, userId);
    await setCurrentQuestionIndex(quizId, userId, current + 1, 3600);
    return current + 1;
  }
}

export async function getQuestionByIndex(
  quizId: string,
  userId: string,
  index: number
): Promise<any | null> {
  try {
    const order = await getUserQuestionOrder(quizId, userId);
    if (!order || index >= order.length) {
      return null;
    }

    const questionId = order[index];
    const questions = await getCachedQuestions(quizId);
    if (!questions) {
      return null;
    }

    return questions.find((q: any) => q.id === questionId) || null;
  } catch (error) {
    console.error(`Failed to get question by index for quiz ${quizId}, user ${userId}:`, error);
    return null;
  }
}

export async function storeUserAttemptId(
  quizId: string,
  userId: string,
  attemptId: string,
  ttl: number
): Promise<void> {
  const userTtl = ttl + QUIZ_USER_STATE_TTL_BUFFER;
  try {
    await redis.setex(getUserAttemptKey(quizId, userId), userTtl, attemptId);
  } catch (error) {
    console.error(`Failed to store attemptId for quiz ${quizId}, user ${userId}:`, error);
  }
}

export async function getUserAttemptId(quizId: string, userId: string): Promise<string | null> {
  try {
    return await redis.get(getUserAttemptKey(quizId, userId));
  } catch (error) {
    console.error(`Failed to get attemptId for quiz ${quizId}, user ${userId}:`, error);
    return null;
  }
}

export async function cleanupUserQuizState(quizId: string, userId: string): Promise<void> {
  try {
    await Promise.all([
      redis.del(getUserOrderKey(quizId, userId)),
      redis.del(getUserIndexKey(quizId, userId)),
      redis.del(getUserAttemptKey(quizId, userId)),
    ]);
  } catch (error) {
    console.error(`Failed to cleanup user state for quiz ${quizId}, user ${userId}:`, error);
  }
}

export function calculateUserStateTTL(endDate: Date): number {
  const now = new Date();
  const diff = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 1000));
  return diff;
}
