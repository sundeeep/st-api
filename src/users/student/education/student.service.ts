import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../../../db";
import { usersProfile } from "../../../auth/auth.schema";
import { usersEducation, type NewUsersEducation } from "../../shared/schema";
import { NotFoundError, BadRequestError } from "../../../utils/errors.util";
import { evaluateOnboardingState } from "../../../utils/onboardingEvaluator.util";
import type { CreateEducationBody, UpdateEducationBody } from "./student.types";

/**
 * Create education record
 */
export async function createEducation(
  userId: string,
  data: CreateEducationBody
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

  // Validate: if currently studying, endDate should be null
  if (data.isCurrentlyStudying && data.endDate) {
    throw BadRequestError("endDate must be null when isCurrentlyStudying is true");
  }

  // Prepare education data
  const educationData: Omit<NewUsersEducation, "id" | "userId" | "createdAt"> = {
    institutionName: data.institutionName,
    degree: data.degree || null,
    course: data.course || null,
    startDate: data.startDate || null,
    endDate: data.isCurrentlyStudying ? null : (data.endDate || null),
    isCurrentlyStudying: data.isCurrentlyStudying || false,
    gradeValue: data.gradeValue || null,
    gradeType: data.gradeType || null,
  };

  // Create education record
  const [education] = await db
    .insert(usersEducation)
    .values({
      userId,
      ...educationData,
    })
    .returning();

  // Re-evaluate onboarding state after creating education
  await evaluateOnboardingState(userId);

  return education;
}

/**
 * Get education record by ID
 */
export async function getEducationById(educationId: string, userId: string) {
  const [education] = await db
    .select()
    .from(usersEducation)
    .where(and(eq(usersEducation.id, educationId), eq(usersEducation.userId, userId)))
    .limit(1);

  if (!education) {
    throw NotFoundError("Education record not found");
  }

  return education;
}

/**
 * Get all education records for a user
 */
export async function getUserEducations(userId: string) {
  // Verify user exists
  const [user] = await db
    .select({ id: usersProfile.id })
    .from(usersProfile)
    .where(eq(usersProfile.id, userId))
    .limit(1);

  if (!user) {
    throw NotFoundError("User not found");
  }

  const educations = await db
    .select()
    .from(usersEducation)
    .where(eq(usersEducation.userId, userId))
    .orderBy(desc(usersEducation.startDate));

  return educations;
}

/**
 * Update education record
 */
export async function updateEducation(
  educationId: string,
  userId: string,
  data: UpdateEducationBody
) {
  // Verify education exists and belongs to user
  const existingEducation = await getEducationById(educationId, userId);

  // Validate: if currently studying, endDate should be null
  if (data.isCurrentlyStudying && data.endDate) {
    throw BadRequestError("endDate must be null when isCurrentlyStudying is true");
  }

  // Prepare update data
  const updateData: Partial<NewUsersEducation> = {};

  if (data.institutionName !== undefined) updateData.institutionName = data.institutionName;
  if (data.degree !== undefined) updateData.degree = data.degree || null;
  if (data.course !== undefined) updateData.course = data.course || null;
  if (data.startDate !== undefined) updateData.startDate = data.startDate || null;
  if (data.endDate !== undefined) {
    updateData.endDate = data.isCurrentlyStudying ? null : (data.endDate || null);
  }
  if (data.isCurrentlyStudying !== undefined) {
    updateData.isCurrentlyStudying = data.isCurrentlyStudying;
    // If setting to currently studying, clear endDate
    if (data.isCurrentlyStudying) {
      updateData.endDate = null;
    }
  }
  if (data.gradeValue !== undefined) updateData.gradeValue = data.gradeValue || null;
  if (data.gradeType !== undefined) updateData.gradeType = data.gradeType || null;

  // Update education record
  const [updatedEducation] = await db
    .update(usersEducation)
    .set(updateData)
    .where(and(eq(usersEducation.id, educationId), eq(usersEducation.userId, userId)))
    .returning();

  if (!updatedEducation) {
    throw NotFoundError("Education record not found");
  }

  // Re-evaluate onboarding state after updating education
  await evaluateOnboardingState(userId);

  return updatedEducation;
}

/**
 * Delete education record
 */
export async function deleteEducation(educationId: string, userId: string) {
  // Verify education exists and belongs to user
  const existingEducation = await getEducationById(educationId, userId);

  // Delete education record
  await db
    .delete(usersEducation)
    .where(and(eq(usersEducation.id, educationId), eq(usersEducation.userId, userId)));

  // Re-evaluate onboarding state after deleting education
  // This will check if education count is 0 and update onboarding accordingly
  await evaluateOnboardingState(userId);

  return { deleted: true, id: educationId };
}
