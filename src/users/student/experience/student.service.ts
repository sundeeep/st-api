import { eq, desc, and } from "drizzle-orm";
import { db } from "../../../db";
import { usersProfile } from "../../../auth/auth.schema";
import { userWorkExperience, type NewUserWorkExperience } from "../../shared/schema";
import { NotFoundError, BadRequestError } from "../../../utils/errors.util";
import { evaluateOnboardingState } from "../../../utils/onboardingEvaluator.util";
import type { CreateExperienceBody, UpdateExperienceBody } from "./student.types";

/**
 * Create work experience record
 */
export async function createExperience(
  userId: string,
  data: CreateExperienceBody
) {
  // Verify user exists
  const [user] = await db
    .select({ id: usersProfile.id })
    .from(usersProfile)
    .where(eq(usersProfile.id, userId))
    .limit(1);

  if (!user) {
    throw NotFoundError("User not found");
  }

  // Validate: if currently working, endDate should be null
  if (data.isCurrentlyWorking && data.endDate) {
    throw BadRequestError("endDate must be null when isCurrentlyWorking is true");
  }

  // Prepare experience data
  const experienceData: Omit<NewUserWorkExperience, "id" | "userId" | "createdAt"> = {
    organization: data.organization,
    role: data.role,
    employmentType: data.employmentType || null,
    location: data.location || null,
    startDate: data.startDate || null,
    endDate: data.isCurrentlyWorking ? null : (data.endDate || null),
    isCurrentlyWorking: data.isCurrentlyWorking || false,
  };

  // Create experience record
  const [experience] = await db
    .insert(userWorkExperience)
    .values({
      userId,
      ...experienceData,
    })
    .returning();

  // Re-evaluate onboarding state after creating experience
  await evaluateOnboardingState(userId);

  return experience;
}

/**
 * Get experience record by ID
 */
export async function getExperienceById(experienceId: string, userId: string) {
  const [experience] = await db
    .select()
    .from(userWorkExperience)
    .where(and(eq(userWorkExperience.id, experienceId), eq(userWorkExperience.userId, userId)))
    .limit(1);

  if (!experience) {
    throw NotFoundError("Experience record not found");
  }

  return experience;
}

/**
 * Get all experience records for a user
 */
export async function getUserExperiences(userId: string) {
  // Verify user exists
  const [user] = await db
    .select({ id: usersProfile.id })
    .from(usersProfile)
    .where(eq(usersProfile.id, userId))
    .limit(1);

  if (!user) {
    throw NotFoundError("User not found");
  }

  const experiences = await db
    .select()
    .from(userWorkExperience)
    .where(eq(userWorkExperience.userId, userId))
    .orderBy(desc(userWorkExperience.startDate));

  return experiences;
}

/**
 * Update experience record
 */
export async function updateExperience(
  experienceId: string,
  userId: string,
  data: UpdateExperienceBody
) {
  // Verify experience exists and belongs to user
  const existingExperience = await getExperienceById(experienceId, userId);

  // Validate: if currently working, endDate should be null
  if (data.isCurrentlyWorking && data.endDate) {
    throw BadRequestError("endDate must be null when isCurrentlyWorking is true");
  }

  // Prepare update data
  const updateData: Partial<NewUserWorkExperience> = {};

  if (data.organization !== undefined) updateData.organization = data.organization;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.employmentType !== undefined) updateData.employmentType = data.employmentType || null;
  if (data.location !== undefined) updateData.location = data.location || null;
  if (data.startDate !== undefined) updateData.startDate = data.startDate || null;
  if (data.endDate !== undefined) {
    updateData.endDate = data.isCurrentlyWorking ? null : (data.endDate || null);
  }
  if (data.isCurrentlyWorking !== undefined) {
    updateData.isCurrentlyWorking = data.isCurrentlyWorking;
    // If setting to currently working, clear endDate
    if (data.isCurrentlyWorking) {
      updateData.endDate = null;
    }
  }

  // Update experience record
  const [updatedExperience] = await db
    .update(userWorkExperience)
    .set(updateData)
    .where(and(eq(userWorkExperience.id, experienceId), eq(userWorkExperience.userId, userId)))
    .returning();

  if (!updatedExperience) {
    throw NotFoundError("Experience record not found");
  }

  // Re-evaluate onboarding state after updating experience
  await evaluateOnboardingState(userId);

  return updatedExperience;
}

/**
 * Delete experience record
 */
export async function deleteExperience(experienceId: string, userId: string) {
  // Verify experience exists and belongs to user
  const existingExperience = await getExperienceById(experienceId, userId);

  // Delete experience record
  await db
    .delete(userWorkExperience)
    .where(and(eq(userWorkExperience.id, experienceId), eq(userWorkExperience.userId, userId)));

  // Re-evaluate onboarding state after deleting experience
  await evaluateOnboardingState(userId);

  return { deleted: true, id: experienceId };
}
