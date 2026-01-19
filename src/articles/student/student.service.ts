import { eq, desc, and, sql, or } from "drizzle-orm";
import { db } from "../../db";
import { articles } from "../shared/schema";
import { usersProfile } from "../../auth/auth.schema";
import { NotFoundError } from "../../utils/errors.util";
import { checkUserInteractions } from "../../interactions/shared/interactions.service";

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 20;

/**
 * Get all published articles for students
 */
export async function getArticles(page: string = "1", limit: string = "10", userId?: string) {
  const pageNum = parseInt(page || "1");
  const limitNum = Math.min(parseInt(limit || String(DEFAULT_PAGE_LIMIT)), MAX_PAGE_LIMIT);
  const offset = (pageNum - 1) * limitNum;

  // Run count and data queries in parallel
  const [articlesList, totalCount] = await Promise.all([
    db
      .select({
        article: articles,
        author: {
          id: usersProfile.id,
          fullName: usersProfile.fullName,
          username: usersProfile.username,
          profileImage: usersProfile.profileImage,
        },
      })
      .from(articles)
      .innerJoin(usersProfile, eq(articles.authorId, usersProfile.id))
      .where(eq(articles.isPublished, true))
      .orderBy(desc(articles.publishedAt))
      .limit(limitNum)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(articles)
      .where(eq(articles.isPublished, true)),
  ]);

  const articleIds = articlesList.map((item) => item.article.id);
  let likedSet = new Set<string>();
  let bookmarkedSet = new Set<string>();

  if (userId && articleIds.length > 0) {
    const interactions = await checkUserInteractions(userId, "article", articleIds);
    likedSet = new Set(interactions.liked);
    bookmarkedSet = new Set(interactions.bookmarked);
  }

  return {
    articles: articlesList.map((item) => ({
      ...item.article,
      author: item.author,
      contentType: "article",
      likeCount: item.article.likeCount || 0,
      isLiked: userId ? likedSet.has(item.article.id) : undefined,
      isBookmarked: userId ? bookmarkedSet.has(item.article.id) : undefined,
    })),
    total: totalCount[0]?.count || 0,
  };
}

/**
 * Get article by ID or slug (for students - only published)
 */
export async function getArticleByIdOrSlug(identifier: string, userId?: string) {
  const [result] = await db
    .select({
      article: articles,
      author: {
        id: usersProfile.id,
        fullName: usersProfile.fullName,
        username: usersProfile.username,
        profileImage: usersProfile.profileImage,
      },
    })
    .from(articles)
    .innerJoin(usersProfile, eq(articles.authorId, usersProfile.id))
    .where(
      and(
        or(eq(articles.id, identifier), eq(articles.slug, identifier)),
        eq(articles.isPublished, true)
      )
    )
    .limit(1);

  if (!result) {
    throw NotFoundError("Article not found or not published");
  }

  let isLiked: boolean | undefined;
  let isBookmarked: boolean | undefined;

  if (userId) {
    const interactions = await checkUserInteractions(userId, "article", [result.article.id]);
    isLiked = interactions.liked.includes(result.article.id);
    isBookmarked = interactions.bookmarked.includes(result.article.id);
  }

  return {
    ...result.article,
    author: result.author,
    contentType: "article",
    likeCount: result.article.likeCount || 0,
    isLiked,
    isBookmarked,
  };
}
