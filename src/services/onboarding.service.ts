import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users.schema";
import { userSkills } from "../db/schema/userSkills.schema";
import { userEducation, type NewUserEducation } from "../db/schema/education.schema";
import { userExperience, type NewUserExperience } from "../db/schema/experience.schema";
import { DatabaseError, NotFoundError, ConflictError, BadRequestError } from "../utils/errors.util";

/**
 * Update user basic info (name, email, password)
 */
export const updateBasicInfo = async (
  userId: string,
  name: string,
  email: string,
  password: string
) => {
  try {
    // Check if email already exists (for different user)
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

    if (existingUser && existingUser.id !== userId) {
      throw ConflictError("Email already in use");
    }

    // Hash password
    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        email,
        password: hashedPassword,
        onboardingStep: 2,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw NotFoundError("User not found");
    }

    return {
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      onboardingStep: updatedUser.onboardingStep,
    };
  } catch (error) {
    if (error instanceof ConflictError || error instanceof NotFoundError) {
      throw error;
    }
    throw DatabaseError("Failed to update basic info", error);
  }
};

/**
 * Update user profile (domain & skills)
 */
export const updateProfile = async (userId: string, domainId: string, skillIds: string[]) => {
  try {
    if (!skillIds || skillIds.length === 0) {
      throw BadRequestError("At least one skill is required");
    }

    // Update user domain
    const [updatedUser] = await db
      .update(users)
      .set({
        domainId,
        onboardingStep: 3,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw NotFoundError("User not found");
    }

    // Delete existing skills
    await db.delete(userSkills).where(eq(userSkills.userId, userId));

    // Insert new skills
    const skillRecords = skillIds.map((skillId) => ({
      userId,
      skillId,
    }));

    await db.insert(userSkills).values(skillRecords);

    return {
      userId: updatedUser.id,
      domainId: updatedUser.domainId,
      skillIds,
      onboardingStep: updatedUser.onboardingStep,
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    throw DatabaseError("Failed to update profile", error);
  }
};

/**
 * Add education record
 */
export const addEducation = async (
  userId: string,
  educationData: Omit<NewUserEducation, "userId" | "id" | "createdAt">
) => {
  try {
    // Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw NotFoundError("User not found");
    }

    // Insert education
    const [education] = await db
      .insert(userEducation)
      .values({
        userId,
        ...educationData,
      })
      .returning();

    // Update onboarding step
    await db
      .update(users)
      .set({
        onboardingStep: 4,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return {
      id: education.id,
      degree: education.degree,
      institution: education.institution,
      fieldOfStudy: education.fieldOfStudy,
      startYear: education.startYear,
      endYear: education.endYear,
      current: education.current,
      onboardingStep: 4,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw DatabaseError("Failed to add education", error);
  }
};

/**
 * Add experience record
 */
export const addExperience = async (
  userId: string,
  experienceData: Omit<NewUserExperience, "userId" | "id" | "createdAt">
) => {
  try {
    // Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw NotFoundError("User not found");
    }

    // Insert experience
    const [experience] = await db
      .insert(userExperience)
      .values({
        userId,
        ...experienceData,
      })
      .returning();

    // Update onboarding step
    await db
      .update(users)
      .set({
        onboardingStep: 5,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return {
      id: experience.id,
      title: experience.title,
      company: experience.company,
      location: experience.location,
      startDate: experience.startDate,
      endDate: experience.endDate,
      current: experience.current,
      description: experience.description,
      onboardingStep: 5,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw DatabaseError("Failed to add experience", error);
  }
};

/**
 * Complete onboarding
 */
export const completeOnboarding = async (userId: string) => {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({
        onboardingComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw NotFoundError("User not found");
    }

    return {
      userId: updatedUser.id,
      onboardingComplete: updatedUser.onboardingComplete,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw DatabaseError("Failed to complete onboarding", error);
  }
};

/**
 * Get onboarding status
 */
export const getOnboardingStatus = async (userId: string) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw NotFoundError("User not found");
    }

    // Calculate completion percentage
    const steps = [
      user.phoneVerified,
      user.name && user.email,
      user.domainId,
      user.onboardingStep >= 4,
      user.onboardingStep >= 5,
    ];

    const completedSteps = steps.filter(Boolean).length;
    const profileCompletion = Math.round((completedSteps / steps.length) * 100);

    const stepNames = [];
    if (user.phoneVerified) stepNames.push("phone_verified");
    if (user.name && user.email) stepNames.push("basic_info");
    if (user.domainId) stepNames.push("profile");
    if (user.onboardingStep >= 4) stepNames.push("education");
    if (user.onboardingStep >= 5) stepNames.push("experience");

    const pendingSteps = [];
    if (!user.phoneVerified) pendingSteps.push("phone_verified");
    if (!user.name || !user.email) pendingSteps.push("basic_info");
    if (!user.domainId) pendingSteps.push("profile");
    if (user.onboardingStep < 4) pendingSteps.push("education");
    if (user.onboardingStep < 5) pendingSteps.push("experience");

    return {
      userId: user.id,
      currentStep: user.onboardingStep,
      completedSteps: stepNames,
      pendingSteps,
      onboardingComplete: user.onboardingComplete,
      profileCompletion,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw DatabaseError("Failed to get onboarding status", error);
  }
};
