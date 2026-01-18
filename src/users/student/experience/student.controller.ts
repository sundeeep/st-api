import { Context } from "elysia";
import * as experienceService from "./student.service";
import { successResponse } from "../../../utils/response.util";
import type { SuccessResponse } from "../../../types/response.types";
import type { AuthenticatedContext } from "../../../auth/auth.types";
import type { CreateExperienceBody, UpdateExperienceBody } from "./student.types";

export const createExperienceHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const body = context.body as CreateExperienceBody;
  const userId = context.user.id;

  const experience = await experienceService.createExperience(userId, body);
  return successResponse(experience, "Experience created successfully");
};

export const getExperienceByIdHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const userId = context.user.id;

  const experience = await experienceService.getExperienceById(id, userId);
  return successResponse(experience, "Experience fetched successfully");
};

export const getUserExperiencesHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const userId = context.user.id;

  const experiences = await experienceService.getUserExperiences(userId);
  return successResponse(experiences, "Experiences fetched successfully");
};

export const updateExperienceHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const body = context.body as UpdateExperienceBody;
  const userId = context.user.id;

  const experience = await experienceService.updateExperience(id, userId, body);
  return successResponse(experience, "Experience updated successfully");
};

export const deleteExperienceHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const userId = context.user.id;

  const result = await experienceService.deleteExperience(id, userId);
  return successResponse(result, "Experience deleted successfully");
};
