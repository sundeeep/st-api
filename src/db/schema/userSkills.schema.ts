import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users } from "./users.schema";
import { skills } from "./skills.schema";

/**
 * User Skills table schema
 */
export const userSkills = pgTable("user_skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type inference for TypeScript
export type UserSkill = InferSelectModel<typeof userSkills>;
export type NewUserSkill = InferInsertModel<typeof userSkills>;
