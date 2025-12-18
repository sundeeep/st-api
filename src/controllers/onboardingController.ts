import * as onboardingService from "../services/onboarding.service";
import { successResponse } from "../utils/response.util";

/**
 * Update basic info
 */
export const updateBasicInfoHandler = async ({ body, user }: any) => {
  const result = await onboardingService.updateBasicInfo(
    user.id,
    body.name,
    body.email,
    body.password
  );

  return successResponse(result, "Basic info updated successfully");
};

/**
 * Update profile (domain & skills)
 */
export const updateProfileHandler = async ({ body, user }: any) => {
  const result = await onboardingService.updateProfile(user.id, body.domainId, body.skillIds);

  return successResponse(result, "Profile updated successfully");
};

/**
 * Add education
 */
export const addEducationHandler = async ({ body, user }: any) => {
  const result = await onboardingService.addEducation(user.id, body);

  return successResponse(result, "Education added successfully");
};

/**
 * Add experience
 */
export const addExperienceHandler = async ({ body, user }: any) => {
  const result = await onboardingService.addExperience(user.id, body);

  return successResponse(result, "Experience added successfully");
};

/**
 * Complete onboarding
 */
export const completeOnboardingHandler = async ({ user }: any) => {
  const result = await onboardingService.completeOnboarding(user.id);

  return successResponse(result, "Onboarding completed successfully");
};

/**
 * Get onboarding status
 */
export const getOnboardingStatusHandler = async ({ user }: any) => {
  const result = await onboardingService.getOnboardingStatus(user.id);

  return successResponse(result);
};
