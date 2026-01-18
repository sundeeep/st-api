import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { usersProfile } from "../auth/auth.schema";
import { usersEducation, userWorkExperience } from "../users/shared/schema";

/**
 * Centralized Onboarding Evaluation
 * 
 * Evaluates onboarding state from actual DB data - not hardcoded steps.
 * Backend is source of truth.
 */
export interface OnboardingEvaluationResult {
  profileComplete: boolean;
  educationComplete: boolean;
  experienceComplete: boolean;
  onboardingComplete: boolean;
  onboardingStep: number; // UI hint only
}

/**
 * Evaluate onboarding state based on actual database data
 * No hardcoded step increments - derives state from data
 */
export async function evaluateOnboardingState(
  userId: string
): Promise<OnboardingEvaluationResult> {
  // Fetch user profile
  const [user] = await db
    .select({
      fullName: usersProfile.fullName,
      mobile: usersProfile.mobile,
      emailVerified: usersProfile.emailVerified,
    })
    .from(usersProfile)
    .where(eq(usersProfile.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  // Profile Step: Complete if fullName exists and mobile is verified (mobile is always verified since it's required)
  const profileComplete = !!user.fullName && !!user.mobile;

  // Education Step: Complete if at least 1 education record exists
  const [educationCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersEducation)
    .where(eq(usersEducation.userId, userId));

  const educationCount = educationCountResult?.count || 0;
  const educationComplete = educationCount > 0;

  // Experience Step: Complete if at least 1 experience exists
  // Note: Experience can be skipped (user may not have work experience yet)
  // But for onboarding completion, we check if they have at least one
  const [experienceCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userWorkExperience)
    .where(eq(userWorkExperience.userId, userId));

  const experienceCount = experienceCountResult?.count || 0;
  // Experience is optional, but for onboarding we consider it complete if they have at least one
  // If they have 0, we can still mark onboarding complete if profile and education are done
  // This follows the document: "Experience Step: Complete if at least 1 experience exists OR user explicitly skips"
  // Since we don't have skip flag, we'll make experience optional for completion
  const experienceComplete = experienceCount > 0;

  // Onboarding Complete: True only if all required steps are satisfied
  // Required: Profile + Education
  // Optional: Experience (but if they have one, it should be complete)
  const onboardingComplete = profileComplete && educationComplete;

  // Calculate onboardingStep as UI hint (0-3)
  let onboardingStep = 0;
  if (profileComplete) onboardingStep = 1;
  if (educationComplete) onboardingStep = 2;
  if (experienceComplete) onboardingStep = 3;

  // Update user profile with evaluated state
  await db
    .update(usersProfile)
    .set({
      onboardingStep,
      onboardingComplete,
      updatedAt: new Date(),
    })
    .where(eq(usersProfile.id, userId));

  return {
    profileComplete,
    educationComplete,
    experienceComplete,
    onboardingComplete,
    onboardingStep,
  };
}
