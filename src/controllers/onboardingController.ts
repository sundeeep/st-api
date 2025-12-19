import * as onboardingService from "../services/onboarding.service";
import { successResponse } from "../utils/response.util";

export const updateBasicInfoHandler = async (context: any) => {
  const { body, user } = context;
  const result = await onboardingService.updateBasicInfo(
    user.id,
    body.name,
    body.email,
    body.password
  );
  return successResponse(result, "Basic info updated successfully");
};

export const updateProfileHandler = async (context: any) => {
  const { body, user } = context;
  const result = await onboardingService.updateProfile(user.id, body.domainId, body.skillIds);
  return successResponse(result, "Profile updated successfully");
};

export const addEducationHandler = async (context: any) => {
  const { body, user } = context;
  const result = await onboardingService.addEducation(user.id, body);
  return successResponse(result, "Education added successfully");
};

export const addExperienceHandler = async (context: any) => {
  const { body, user } = context;
  const result = await onboardingService.addExperience(user.id, body);
  return successResponse(result, "Experience added successfully");
};

export const completeOnboardingHandler = async (context: any) => {
  const { user } = context;
  const result = await onboardingService.completeOnboarding(user.id);
  return successResponse(result, "Onboarding completed successfully");
};

export const getOnboardingStatusHandler = async (context: any) => {
  const { user } = context;
  const result = await onboardingService.getOnboardingStatus(user.id);
  return successResponse(result);
};
