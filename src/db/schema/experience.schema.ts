import { pgTable, varchar, timestamp, uuid, boolean, text } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users } from "./users.schema";

/**
 * User Experience table schema
 */
export const userExperience = pgTable("user_experience", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  startDate: varchar("start_date", { length: 10 }).notNull(), // YYYY-MM format
  endDate: varchar("end_date", { length: 10 }), // YYYY-MM format
  current: boolean("current").default(false).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type inference for TypeScript
export type UserExperience = InferSelectModel<typeof userExperience>;
export type NewUserExperience = InferInsertModel<typeof userExperience>;
