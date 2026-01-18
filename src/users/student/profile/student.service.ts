import { eq, and } from "drizzle-orm";
import { db } from "../../../db";
import { usersProfile } from "../../../auth/auth.schema";
import { addresses } from "../../../db/schema";
import { NotFoundError } from "../../../utils/errors.util";
import { evaluateOnboardingState } from "../../../utils/onboardingEvaluator.util";
import type { UpdateProfileBody } from "./student.types";

/**
 * Update user profile (personal info)
 */
export async function updateProfile(
  userId: string,
  data: UpdateProfileBody
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

  // Prepare update data for usersProfile
  const updateData: Partial<typeof usersProfile.$inferInsert> = {};

  if (data.fullName !== undefined) updateData.fullName = data.fullName || null;
  if (data.aboutMe !== undefined) updateData.aboutMe = data.aboutMe;
  if (data.birthday !== undefined) updateData.birthday = data.birthday;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;

  // Update usersProfile
  if (Object.keys(updateData).length > 0) {
    updateData.updatedAt = new Date();
    await db
      .update(usersProfile)
      .set(updateData)
      .where(eq(usersProfile.id, userId));
  }

  // Handle address (using addresses table with type="user")
  if (data.address !== undefined) {
    // Check if address already exists for this user
    const [existingAddress] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.typeId, userId), eq(addresses.type, "user")))
      .limit(1);

    if (data.address === null) {
      // Delete existing address if any
      if (existingAddress) {
        await db.delete(addresses).where(eq(addresses.id, existingAddress.id));
      }
    } else {
      // Update or create address
      const addressData = {
        type: "user" as const,
        typeId: userId,
        streetAddress: data.address?.streetAddress || null,
        city: data.address?.city || null,
        state: data.address?.state || null,
        pincode: data.address?.pincode || null,
        country: data.address?.country || null,
        updatedAt: new Date(),
      };

      if (existingAddress) {
        // Update existing address
        await db
          .update(addresses)
          .set(addressData)
          .where(eq(addresses.id, existingAddress.id));
      } else {
        // Create new address
        await db.insert(addresses).values(addressData);
      }
    }
  }

  // Re-evaluate onboarding state after updating profile
  await evaluateOnboardingState(userId);

  // Fetch updated user data
  const [updatedUser] = await db
    .select()
    .from(usersProfile)
    .where(eq(usersProfile.id, userId))
    .limit(1);

  // Fetch address if exists
  const [userAddress] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.typeId, userId), eq(addresses.type, "user")))
    .limit(1);

  return {
    id: updatedUser!.id,
    fullName: updatedUser!.fullName,
    aboutMe: updatedUser!.aboutMe,
    birthday: updatedUser!.birthday,
    gender: updatedUser!.gender,
    profileImage: updatedUser!.profileImage,
    address: userAddress
      ? {
          streetAddress: userAddress.streetAddress,
          city: userAddress.city,
          state: userAddress.state,
          pincode: userAddress.pincode,
          country: userAddress.country,
        }
      : null,
  };
}