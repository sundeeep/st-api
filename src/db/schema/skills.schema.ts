import { pgTable, varchar, uuid } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Skills table - predefined list of available skills
 */
export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

// Type inference for TypeScript
export type Skill = InferSelectModel<typeof skills>;
export type NewSkill = InferInsertModel<typeof skills>;
