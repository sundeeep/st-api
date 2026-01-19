import { db } from "../../db";
import { likes, bookmarks, type ContentType } from "./schema";
import { events } from "../../events/shared/schema";
import { quizzes } from "../../quiz/shared/schema";
import { articles } from "../../articles/shared/schema";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/errors.util";
import { getEventDetails } from "../../events/student/student.service";
import { getQuizDetails } from "../../quiz/student/student.service";
import { getArticleByIdOrSlug } from "../../articles/student/student.service";

async function validateContentExists(targetType: ContentType, targetId: string): Promise<void> {
  if (targetType === "event") {
    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, targetId))
      .limit(1);

    if (!event) {
      throw NotFoundError("Event not found");
    }
  } else if (targetType === "quiz") {
    const [quiz] = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.id, targetId))
      .limit(1);

    if (!quiz) {
      throw NotFoundError("Quiz not found");
    }
  } else if (targetType === "article") {
    const [article] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.id, targetId))
      .limit(1);

    if (!article) {
      throw NotFoundError("Article not found");
    }
  } else {
    throw BadRequestError("Invalid content type");
  }
}

function getContentTable(targetType: ContentType) {
  if (targetType === "event") {
    return events;
  } else if (targetType === "quiz") {
    return quizzes;
  } else if (targetType === "article") {
    return articles;
  }
  throw BadRequestError("Invalid content type");
}

function hasLikeCount(targetType: ContentType): boolean {
  return targetType === "event" || targetType === "quiz" || targetType === "article";
}

export async function likeContent(userId: string, targetType: ContentType, targetId: string) {
  await validateContentExists(targetType, targetId);

  const existingLike = await db
    .select({ id: likes.id })
    .from(likes)
    .where(
      and(eq(likes.userId, userId), eq(likes.targetType, targetType), eq(likes.targetId, targetId))
    )
    .limit(1);

  if (existingLike.length > 0) {
    throw ConflictError("Content already liked");
  }

  await db.transaction(async (tx) => {
    await tx.insert(likes).values({
      userId,
      targetType,
      targetId,
    });

    // Update likeCount for event, quiz, and article
    if (hasLikeCount(targetType)) {
      if (targetType === "event") {
        await tx
          .update(events)
          .set({
            likeCount: sql`${events.likeCount} + 1`,
          })
          .where(eq(events.id, targetId));
      } else if (targetType === "quiz") {
        await tx
          .update(quizzes)
          .set({
            likeCount: sql`${quizzes.likeCount} + 1`,
          })
          .where(eq(quizzes.id, targetId));
      } else if (targetType === "article") {
        await tx
          .update(articles)
          .set({
            likeCount: sql`${articles.likeCount} + 1`,
          })
          .where(eq(articles.id, targetId));
      }
    }
  });
}

export async function unlikeContent(userId: string, targetType: ContentType, targetId: string) {
  const existingLike = await db
    .select({ id: likes.id })
    .from(likes)
    .where(
      and(eq(likes.userId, userId), eq(likes.targetType, targetType), eq(likes.targetId, targetId))
    )
    .limit(1);

  if (existingLike.length === 0) {
    throw NotFoundError("Like not found");
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.targetType, targetType),
          eq(likes.targetId, targetId)
        )
      );

    // Update likeCount for event, quiz, and article
    if (hasLikeCount(targetType)) {
      if (targetType === "event") {
        await tx
          .update(events)
          .set({
            likeCount: sql`${events.likeCount} - 1`,
          })
          .where(eq(events.id, targetId));
      } else if (targetType === "quiz") {
        await tx
          .update(quizzes)
          .set({
            likeCount: sql`${quizzes.likeCount} - 1`,
          })
          .where(eq(quizzes.id, targetId));
      } else if (targetType === "article") {
        await tx
          .update(articles)
          .set({
            likeCount: sql`${articles.likeCount} - 1`,
          })
          .where(eq(articles.id, targetId));
      }
    }
  });
}

export async function bookmarkContent(userId: string, targetType: ContentType, targetId: string) {
  await validateContentExists(targetType, targetId);

  const existingBookmark = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.targetType, targetType),
        eq(bookmarks.targetId, targetId)
      )
    )
    .limit(1);

  if (existingBookmark.length > 0) {
    throw ConflictError("Content already bookmarked");
  }

  await db.insert(bookmarks).values({
    userId,
    targetType,
    targetId,
  });
}

export async function unbookmarkContent(userId: string, targetType: ContentType, targetId: string) {
  const existingBookmark = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.targetType, targetType),
        eq(bookmarks.targetId, targetId)
      )
    )
    .limit(1);

  if (existingBookmark.length === 0) {
    throw NotFoundError("Bookmark not found");
  }

  await db
    .delete(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.targetType, targetType),
        eq(bookmarks.targetId, targetId)
      )
    );
}

export async function checkUserInteractions(
  userId: string,
  targetType: ContentType,
  targetIds: string[]
): Promise<{
  liked: string[];
  bookmarked: string[];
}> {
  if (targetIds.length === 0) {
    return { liked: [], bookmarked: [] };
  }

  const [likedData, bookmarkedData] = await Promise.all([
    db
      .select({ targetId: likes.targetId })
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.targetType, targetType),
          inArray(likes.targetId, targetIds)
        )
      ),
    db
      .select({ targetId: bookmarks.targetId })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.targetType, targetType),
          inArray(bookmarks.targetId, targetIds)
        )
      ),
  ]);

  return {
    liked: likedData.map((l) => l.targetId),
    bookmarked: bookmarkedData.map((b) => b.targetId),
  };
}

export async function getBookmarkedContent(
  userId: string,
  contentType?: ContentType,
  page: string = "1",
  limit: string = "10"
): Promise<{
  items: Array<{
    contentType: ContentType;
    content: unknown;
    bookmarkedAt: Date;
  }>;
  total: number;
}> {
  const pageNum = parseInt(page || "1");
  const limitNum = Math.min(parseInt(limit || "10"), 100);
  const offset = (pageNum - 1) * limitNum;

  // Build conditions
  const conditions = [eq(bookmarks.userId, userId)];
  if (contentType) {
    conditions.push(eq(bookmarks.targetType, contentType));
  }

  // Get bookmarks with pagination
  const [bookmarksList, totalCount] = await Promise.all([
    db
      .select({
        targetType: bookmarks.targetType,
        targetId: bookmarks.targetId,
        bookmarkedAt: bookmarks.createdAt,
      })
      .from(bookmarks)
      .where(and(...conditions))
      .orderBy(desc(bookmarks.createdAt))
      .limit(limitNum)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookmarks)
      .where(and(...conditions)),
  ]);

  // Group bookmarks by type
  const eventIds: string[] = [];
  const quizIds: string[] = [];
  const articleIds: string[] = [];

  bookmarksList.forEach((bookmark) => {
    if (bookmark.targetType === "event") {
      eventIds.push(bookmark.targetId);
    } else if (bookmark.targetType === "quiz") {
      quizIds.push(bookmark.targetId);
    } else if (bookmark.targetType === "article") {
      articleIds.push(bookmark.targetId);
    }
  });

  // Fetch content details in parallel (with error handling for deleted content)
  const fetchEventDetails = async (ids: string[]) => {
    if (ids.length === 0) return [];
    const results = await Promise.allSettled(
      ids.map((id) => getEventDetails(id, userId))
    );
    return results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);
  };

  const fetchQuizDetails = async (ids: string[]) => {
    if (ids.length === 0) return [];
    const results = await Promise.allSettled(
      ids.map((id) => getQuizDetails(id, userId))
    );
    return results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);
  };

  const fetchArticleDetails = async (ids: string[]) => {
    if (ids.length === 0) return [];
    const results = await Promise.allSettled(
      ids.map((id) => getArticleByIdOrSlug(id, userId))
    );
    return results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);
  };

  const [eventDetails, quizDetails, articleDetails] = await Promise.all([
    fetchEventDetails(eventIds),
    fetchQuizDetails(quizIds),
    fetchArticleDetails(articleIds),
  ]);

  // Create maps for quick lookup
  const eventMap = new Map(eventDetails.map((e: any) => [e.id, e]));
  const quizMap = new Map(quizDetails.map((q: any) => [q.id, q]));
  const articleMap = new Map(articleDetails.map((a: any) => [a.id, a]));

  // Combine results maintaining order
  const items = bookmarksList
    .map((bookmark) => {
      let content: unknown = null;

      if (bookmark.targetType === "event") {
        content = eventMap.get(bookmark.targetId);
      } else if (bookmark.targetType === "quiz") {
        content = quizMap.get(bookmark.targetId);
      } else if (bookmark.targetType === "article") {
        content = articleMap.get(bookmark.targetId);
      }

      if (!content) {
        return null; // Content was deleted or not found
      }

      return {
        contentType: bookmark.targetType,
        content,
        bookmarkedAt: bookmark.bookmarkedAt,
      };
    })
    .filter((item) => item !== null) as Array<{
    contentType: ContentType;
    content: unknown;
    bookmarkedAt: Date;
  }>;

  return {
    items,
    total: totalCount[0]?.count || 0,
  };
}
