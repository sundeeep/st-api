import type { Context } from "elysia";
import * as onboardingService from "../services/onboarding.service";
import { successResponse } from "../utils/response.util";
import type { SuccessResponse } from "../types/response.types";

interface UpdateBasicInfoBody {
  name: string;
  email: string;
  password: string;
}

interface UpdateProfileBody {
  domainId: string;
  skillIds: string[];
}

interface AddEducationBody {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
}

interface AddExperienceBody {
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
}

interface AuthenticatedContext extends Context {
  user: {
    id: string;
    phoneNumber: string;
    role: string;
  };
}

export const updateBasicInfoHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const body = context.body as UpdateBasicInfoBody;
  const result = await onboardingService.updateBasicInfo(
    context.user.id,
    body.name,
    body.email,
    body.password
  );
  return successResponse(result, "Basic info updated successfully");
};

export const updateProfileHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const body = context.body as UpdateProfileBody;
  const result = await onboardingService.updateProfile(
    context.user.id,
    body.domainId,
    body.skillIds
  );
  return successResponse(result, "Profile updated successfully");
};

export const addEducationHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const body = context.body as AddEducationBody;
  const result = await onboardingService.addEducation(context.user.id, body);
  return successResponse(result, "Education added successfully");
};

export const addExperienceHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const body = context.body as AddExperienceBody;
  const result = await onboardingService.addExperience(context.user.id, body);
  return successResponse(result, "Experience added successfully");
};

export const completeOnboardingHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const result = await onboardingService.completeOnboarding(context.user.id);
  return successResponse(result, "Onboarding completed successfully");
};

export const getOnboardingStatusHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const result = await onboardingService.getOnboardingStatus(context.user.id);
  return successResponse(result);
};
