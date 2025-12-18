import { db } from "../db";
import { domains } from "../db/schema/domains.schema";
import { skills } from "../db/schema/skills.schema";
import { DatabaseError } from "../utils/errors.util";

/**
 * Get all available domains
 */
export const getAllDomains = async () => {
  try {
    return await db.select().from(domains).orderBy(domains.name);
  } catch (error) {
    throw DatabaseError("Failed to fetch domains", error);
  }
};

/**
 * Get all available skills
 */
export const getAllSkills = async () => {
  try {
    return await db.select().from(skills).orderBy(skills.name);
  } catch (error) {
    throw DatabaseError("Failed to fetch skills", error);
  }
};
