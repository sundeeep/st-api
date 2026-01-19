import { Context } from "elysia";
import * as studentService from "./student.service";
import { successResponse, paginatedResponse } from "../../utils/response.util";
import type { SuccessResponse } from "../../types/response.types";
import type { AuthenticatedContext } from "../../auth/auth.types";

export const getArticlesHandler = async (context: Context): Promise<SuccessResponse> => {
  const query = context.query as { page?: string; limit?: string };
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const authContext = context as Partial<AuthenticatedContext>;
  const userId = authContext.user?.id;

  const { articles, total } = await studentService.getArticles(query.page, query.limit, userId);
  return paginatedResponse(articles, page, limit, total, "Articles fetched successfully");
};

export const getArticleByIdOrSlugHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as { id: string };
  const authContext = context as Partial<AuthenticatedContext>;
  const userId = authContext.user?.id;
  const article = await studentService.getArticleByIdOrSlug(params.id, userId);
  return successResponse(article, "Article fetched successfully");
};
