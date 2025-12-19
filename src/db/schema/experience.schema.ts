import { pgTable, varchar, timestamp, uuid, boolean, text, index } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users } from "./users.schema";

export const userExperience = pgTable(
  "user_experience",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    company: varchar("company", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }),
    startDate: varchar("start_date", { length: 10 }).notNull(),
    endDate: varchar("end_date", { length: 10 }),
    current: boolean("current").default(false).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("experience_user_id_idx").on(table.userId),
  })
);

// Type inference for TypeScript
export type UserExperience = InferSelectModel<typeof userExperience>;
export type NewUserExperience = InferInsertModel<typeof userExperience>;
