import { eq, desc, and, or, ilike, count, sql } from "drizzle-orm";
import { db } from "../../db";
import { usersProfile } from "../../auth/auth.schema";
import type { UserFilters } from "./admin.types";

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 100;

export async function getUsers(filters: UserFilters) {
  const page = parseInt(filters.page || "1");
  const limit = Math.min(parseInt(filters.limit || String(DEFAULT_PAGE_LIMIT)), MAX_PAGE_LIMIT);
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filters.role) {
    // Map "student" to "user" since usersProfile uses "user" | "admin"
    const role = filters.role === "student" ? "user" : filters.role;
    conditions.push(eq(usersProfile.role, role));
  }

  if (filters.isActive === "true") {
    conditions.push(eq(usersProfile.isActive, true));
  } else if (filters.isActive === "false") {
    conditions.push(eq(usersProfile.isActive, false));
  }

  if (filters.onboardingComplete === "true") {
    conditions.push(eq(usersProfile.onboardingComplete, true));
  } else if (filters.onboardingComplete === "false") {
    conditions.push(eq(usersProfile.onboardingComplete, false));
  }

  if (filters.search) {
    const searchConditions = [
      ilike(usersProfile.fullName, `%${filters.search}%`),
      ilike(usersProfile.email, `%${filters.search}%`),
      ilike(usersProfile.mobile, `%${filters.search}%`),
    ].filter(Boolean);

    if (searchConditions.length > 0) {
      conditions.push(or(...searchConditions)!);
    }
  }

  // Run count and data queries in parallel to avoid N+1 and optimize performance
  const [usersList, totalCount] = await Promise.all([
    db
      .select({
        id: usersProfile.id,
        fullName: usersProfile.fullName,
        email: usersProfile.email,
        emailVerified: usersProfile.emailVerified,
        mobile: usersProfile.mobile,
        role: usersProfile.role,
        profileImage: usersProfile.profileImage,
        onboardingComplete: usersProfile.onboardingComplete,
        onboardingStep: usersProfile.onboardingStep,
        isActive: usersProfile.isActive,
        isVerified: usersProfile.isVerified,
        createdAt: usersProfile.createdAt,
        updatedAt: usersProfile.updatedAt,
      })
      .from(usersProfile)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(usersProfile.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersProfile)
      .where(conditions.length ? and(...conditions) : undefined),
  ]);

  // Format response data
  const formattedUsers = usersList.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    emailVerified: user.emailVerified,
    mobile: user.mobile,
    role: user.role,
    profileImage: user.profileImage,
    onboardingComplete: user.onboardingComplete,
    onboardingStep: user.onboardingStep,
    isActive: user.isActive,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  return {
    users: formattedUsers,
    total: totalCount[0]?.count || 0,
  };
}
