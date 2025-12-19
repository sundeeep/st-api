import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, type User, type NewUser } from "../db/schema/users.schema";
import { NotFoundError } from "../utils/errors.util";

export const getUserById = async (id: string): Promise<User> => {
  const [user] = await db.select().from(users).where(eq(users.id, id));

  if (!user) {
    throw NotFoundError(`User with ID ${id} not found`);
  }

  return user;
};

export const getUserByPhone = async (phoneNumber: string): Promise<User | null> => {
  const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
  return user || null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || null;
};

export const updateUser = async (id: string, userData: Partial<NewUser>): Promise<User> => {
  const [updatedUser] = await db
    .update(users)
    .set({ ...userData, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!updatedUser) {
    throw NotFoundError(`User with ID ${id} not found`);
  }

  return updatedUser;
};

export const emailExists = async (email: string): Promise<boolean> => {
  const user = await getUserByEmail(email);
  return !!user;
};
