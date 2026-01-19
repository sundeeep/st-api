import type { AuthenticatedContext } from "../../auth/auth.types";
import { successResponse, paginatedResponse } from "../../utils/response.util";
import * as interactionsService from "../shared/interactions.service";
import type { ContentType } from "../shared/schema";

export const likeContentHandler = async (context: AuthenticatedContext) => {
  const { targetType, targetId } = context.params as {
    targetType: ContentType;
    targetId: string;
  };
  const userId = context.user.id;

  await interactionsService.likeContent(userId, targetType, targetId);
  return successResponse(undefined, "Content liked successfully");
};

export const unlikeContentHandler = async (context: AuthenticatedContext) => {
  const { targetType, targetId } = context.params as {
    targetType: ContentType;
    targetId: string;
  };
  const userId = context.user.id;

  await interactionsService.unlikeContent(userId, targetType, targetId);
  return successResponse(undefined, "Content unliked successfully");
};

export const bookmarkContentHandler = async (context: AuthenticatedContext) => {
  const { targetType, targetId } = context.params as {
    targetType: ContentType;
    targetId: string;
  };
  const userId = context.user.id;

  await interactionsService.bookmarkContent(userId, targetType, targetId);
  return successResponse(undefined, "Content bookmarked successfully");
};

export const unbookmarkContentHandler = async (context: AuthenticatedContext) => {
  const { targetType, targetId } = context.params as {
    targetType: ContentType;
    targetId: string;
  };
  const userId = context.user.id;

  await interactionsService.unbookmarkContent(userId, targetType, targetId);
  return successResponse(undefined, "Content unbookmarked successfully");
};

export const getBookmarkedContentHandler = async (
  context: AuthenticatedContext
) => {
  const query = context.query as {
    contentType?: ContentType;
    page?: string;
    limit?: string;
  };
  const userId = context.user.id;

  const result = await interactionsService.getBookmarkedContent(
    userId,
    query.contentType,
    query.page,
    query.limit
  );

  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");

  return paginatedResponse(
    result.items,
    page,
    limit,
    result.total,
    "Bookmarked content fetched successfully"
  );
};
