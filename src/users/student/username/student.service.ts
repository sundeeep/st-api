import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { usersProfile } from "../../../auth/auth.schema";
import { ConflictError, BadRequestError, NotFoundError } from "../../../utils/errors.util";

/**
 * Update username for user
 */
export async function updateUsername(
  userId: string,
  username: string
) {
  const sanitizedUsername = username.trim().toLowerCase();

  // Validate username format (alphanumeric, underscore, dash only)
  const usernameRegex = /^[a-z0-9_-]{3,30}$/;
  if (!usernameRegex.test(sanitizedUsername)) {
    throw BadRequestError(
      "Username must be 3-30 characters and contain only letters, numbers, underscores, and dashes"
    );
  }

  // Check if username already exists
  const [existingUsernameUser] = await db
    .select()
    .from(usersProfile)
    .where(eq(usersProfile.username, sanitizedUsername));

  if (existingUsernameUser && existingUsernameUser.id !== userId) {
    throw ConflictError("Username already taken");
  }

  // Verify user exists
  const [user] = await db
    .select({ id: usersProfile.id })
    .from(usersProfile)
    .where(eq(usersProfile.id, userId))
    .limit(1);

  if (!user) {
    throw NotFoundError("User not found");
  }

  // Update username
  const [updatedUser] = await db
    .update(usersProfile)
    .set({
      username: sanitizedUsername,
      updatedAt: new Date(),
    })
    .where(eq(usersProfile.id, userId))
    .returning();

  return {
    id: updatedUser.id,
    username: updatedUser.username,
  };
}