import { Context } from "elysia";
import * as educationService from "./student.service";
import { successResponse } from "../../../utils/response.util";
import type { SuccessResponse } from "../../../types/response.types";
import type { AuthenticatedContext } from "../../../auth/auth.types";
import type { CreateEducationBody, UpdateEducationBody } from "./student.types";

export const createEducationHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const body = context.body as CreateEducationBody;
  const userId = context.user.id;

  const education = await educationService.createEducation(userId, body);
  return successResponse(education, "Education created successfully");
};

export const getEducationByIdHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const userId = context.user.id;

  const education = await educationService.getEducationById(id, userId);
  return successResponse(education, "Education fetched successfully");
};

export const getUserEducationsHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const userId = context.user.id;

  const educations = await educationService.getUserEducations(userId);
  return successResponse(educations, "Educations fetched successfully");
};

export const updateEducationHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const body = context.body as UpdateEducationBody;
  const userId = context.user.id;

  const education = await educationService.updateEducation(id, userId, body);
  return successResponse(education, "Education updated successfully");
};

export const deleteEducationHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const userId = context.user.id;

  const result = await educationService.deleteEducation(id, userId);
  return successResponse(result, "Education deleted successfully");
};
