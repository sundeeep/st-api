import type { Context } from "elysia";
import * as adminService from "./admin.service";
import { successResponse, paginatedResponse } from "../../utils/response.util";
import type { SuccessResponse } from "../../types/response.types";
import type { AuthenticatedContext } from "../../auth/auth.types";
import type { CreateArticleBody, UpdateArticleBody, ArticleFilters } from "./admin.types";

interface ArticleParams {
  id: string;
  [key: string]: string;
}

export const createArticleHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const body = context.body as CreateArticleBody;
  const authorId = context.user.id;
  const article = await adminService.createArticle(authorId, body);
  return successResponse(article, "Article created successfully");
};

export const getArticlesHandler = async (context: Context): Promise<SuccessResponse> => {
  const query = context.query as ArticleFilters;
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");

  const { articles, total } = await adminService.getArticles(query);
  return paginatedResponse(articles, page, limit, total, "Articles fetched successfully");
};

export const getArticleByIdHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as ArticleParams;
  const article = await adminService.getArticleById(params.id);
  return successResponse(article, "Article fetched successfully");
};

export const updateArticleHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as ArticleParams;
  const body = context.body as UpdateArticleBody;
  const article = await adminService.updateArticle(params.id, body);
  return successResponse(article, "Article updated successfully");
};

export const deleteArticleHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as ArticleParams;
  const result = await adminService.deleteArticle(params.id);
  return successResponse(result, "Article deleted successfully");
};
