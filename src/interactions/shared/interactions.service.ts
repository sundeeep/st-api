import { db } from "../../db";
import { likes, bookmarks, type ContentType } from "./schema";
import { events } from "../../events/shared/schema";
import { quizzes } from "../../quiz/shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/errors.util";

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
  } else {
    throw BadRequestError("Invalid content type");
  }
}

function getContentTable(targetType: ContentType) {
  if (targetType === "event") {
    return events;
  } else if (targetType === "quiz") {
    return quizzes;
  }
  throw BadRequestError("Invalid content type");
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

  const contentTable = getContentTable(targetType);

  await db.transaction(async (tx) => {
    await tx.insert(likes).values({
      userId,
      targetType,
      targetId,
    });

    await tx
      .update(contentTable)
      .set({
        likeCount: sql`${contentTable.likeCount} + 1`,
      })
      .where(eq(contentTable.id, targetId));
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

  const contentTable = getContentTable(targetType);

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

    await tx
      .update(contentTable)
      .set({
        likeCount: sql`${contentTable.likeCount} - 1`,
      })
      .where(eq(contentTable.id, targetId));
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
