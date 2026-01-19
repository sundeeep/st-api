import { eq, desc, and, sql, or } from "drizzle-orm";
import { db } from "../../db";
import { articles } from "../shared/schema";
import { usersProfile } from "../../auth/auth.schema";
import { NotFoundError, ConflictError } from "../../utils/errors.util";
import type { CreateArticleBody, UpdateArticleBody, ArticleFilters } from "./admin.types";

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 20;

/**
 * Create article
 */
export async function createArticle(authorId: string, data: CreateArticleBody) {
  // Check if slug already exists
  const [existing] = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, data.slug))
    .limit(1);

  if (existing) {
    throw ConflictError("Article with this slug already exists");
  }

  const [article] = await db
    .insert(articles)
    .values({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content as any, // JSONB accepts any JSON
      coverImage: data.coverImage || null,
      isPublished: data.isPublished || false,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      authorId,
    })
    .returning();

  return article;
}

/**
 * Update article
 */
export async function updateArticle(articleId: string, data: UpdateArticleBody) {
  // Check if article exists
  const [existing] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);

  if (!existing) {
    throw NotFoundError("Article not found");
  }

  // Check slug uniqueness if slug is being updated
  if (data.slug && data.slug !== existing.slug) {
    const [duplicate] = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, data.slug))
      .limit(1);

    if (duplicate) {
      throw ConflictError("Article with this slug already exists");
    }
  }

  const updateData: Partial<typeof articles.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.content !== undefined) updateData.content = data.content as any;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
  if (data.publishedAt !== undefined) {
    updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
  }

  const [updated] = await db
    .update(articles)
    .set(updateData)
    .where(eq(articles.id, articleId))
    .returning();

  return updated;
}

/**
 * Delete article
 */
export async function deleteArticle(articleId: string) {
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);

  if (!article) {
    throw NotFoundError("Article not found");
  }

  await db.delete(articles).where(eq(articles.id, articleId));

  return { deleted: true, id: articleId };
}

/**
 * Get all articles with pagination and filters
 */
export async function getArticles(filters: ArticleFilters) {
  const page = parseInt(filters.page || "1");
  const limit = Math.min(parseInt(filters.limit || String(DEFAULT_PAGE_LIMIT)), MAX_PAGE_LIMIT);
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filters.isPublished === "true") {
    conditions.push(eq(articles.isPublished, true));
  } else if (filters.isPublished === "false") {
    conditions.push(eq(articles.isPublished, false));
  }

  if (filters.authorId) {
    conditions.push(eq(articles.authorId, filters.authorId));
  }

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
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(articles)
      .where(conditions.length ? and(...conditions) : undefined),
  ]);

  const formattedArticles = articlesList.map((item) => ({
    ...item.article,
    author: item.author,
  }));

  return {
    articles: formattedArticles,
    total: totalCount[0]?.count || 0,
  };
}

/**
 * Get article by ID
 */
export async function getArticleById(articleId: string) {
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
    .where(eq(articles.id, articleId))
    .limit(1);

  if (!result) {
    throw NotFoundError("Article not found");
  }

  return {
    ...result.article,
    author: result.author,
  };
}
