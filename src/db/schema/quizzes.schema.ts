import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  text,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users } from "./users.schema";

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    duration: integer("duration").notNull(),
    passingMarks: integer("passing_marks").notNull(),
    totalQuestions: integer("total_questions").default(0).notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    createdById: uuid("created_by_id")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    createdByIdIdx: index("quizzes_created_by_id_idx").on(table.createdById),
    isActiveIdx: index("quizzes_is_active_idx").on(table.isActive),
  })
);

export type Quiz = InferSelectModel<typeof quizzes>;
export type NewQuiz = InferInsertModel<typeof quizzes>;
