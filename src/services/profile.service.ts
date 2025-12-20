import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users.schema";
import { domains } from "../db/schema/domains.schema";
import { userSkills } from "../db/schema/userSkills.schema";
import { skills } from "../db/schema/skills.schema";
import { userEducation } from "../db/schema/education.schema";
import { userExperience } from "../db/schema/experience.schema";
import { userProfileLinks } from "../db/schema/userProfileLinks.schema";

/**
 * Get complete user profile with all related data
 * Optimized to avoid N+1 queries using proper joins
 */
export const getCompleteProfile = async (userId: string) => {
  // Fetch user basic info with domain
  const userWithDomain = await db
    .select({
      id: users.id,
      phoneNumber: users.phoneNumber,
      phoneVerified: users.phoneVerified,
      name: users.name,
      displayName: users.displayName,
      username: users.username,
      email: users.email,
      emailVerified: users.emailVerified,
      profileImage: users.profileImage,
      role: users.role,
      domainId: users.domainId,
      onboardingComplete: users.onboardingComplete,
      onboardingStep: users.onboardingStep,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      domain: {
        id: domains.id,
        name: domains.name,
      },
    })
    .from(users)
    .leftJoin(domains, eq(users.domainId, domains.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!userWithDomain || userWithDomain.length === 0) {
    return null;
  }

  const user = userWithDomain[0];

  // Fetch user skills with skill details
  const userSkillsData = await db
    .select({
      id: skills.id,
      name: skills.name,
    })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .where(eq(userSkills.userId, userId));

  // Fetch user education (most recent first)
  const educationData = await db
    .select()
    .from(userEducation)
    .where(eq(userEducation.userId, userId))
    .orderBy(desc(userEducation.startYear));

  // Fetch user experience (most recent first)
  const experienceData = await db
    .select()
    .from(userExperience)
    .where(eq(userExperience.userId, userId))
    .orderBy(desc(userExperience.startDate));

  // Fetch profile links
  const profileLinksData = await db
    .select()
    .from(userProfileLinks)
    .where(eq(userProfileLinks.userId, userId))
    .limit(1);

  // Construct complete profile object
  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    name: user.name,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    profileImage: user.profileImage,
    role: user.role,
    onboardingComplete: user.onboardingComplete,
    onboardingStep: user.onboardingStep,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    domain: user.domain?.id ? user.domain : null,
    skills: userSkillsData,
    education: educationData,
    experience: experienceData,
    profileLinks: profileLinksData.length > 0 ? profileLinksData[0] : null,
  };
};

/**
 * Get complete user profile by username
 */
export const getCompleteProfileByUsername = async (username: string) => {
  // First, get user ID by username
  const userRecord = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!userRecord || userRecord.length === 0) {
    return null;
  }

  return getCompleteProfile(userRecord[0].id);
};
