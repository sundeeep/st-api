import * as profileService from "../services/profile.service";
import { successResponse } from "../utils/response.util";
import { NotFoundError } from "../utils/errors.util";

/**
 * Get complete profile of authenticated user
 */
export const getMyProfileHandler = async (context: any) => {
  const userId = context.userId;

  const profile = await profileService.getCompleteProfile(userId);

  if (!profile) {
    throw NotFoundError("Profile not found");
  }

  return successResponse(profile, "Profile fetched successfully");
};

/**
 * Get complete profile by username (public)
 */
export const getProfileByUsernameHandler = async (context: any) => {
  const { username } = context.params as { username: string };

  const profile = await profileService.getCompleteProfileByUsername(username);

  if (!profile) {
    throw NotFoundError("User not found");
  }

  return successResponse(profile, "Profile fetched successfully");
};
