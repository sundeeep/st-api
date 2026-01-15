import type { AuthenticatedContext } from "../../auth/auth.types";
import { successResponse } from "../../utils/response.util";
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
