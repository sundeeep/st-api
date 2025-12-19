import { pgTable, uuid, jsonb, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { quizzes } from "./quizzes.schema";
import { users } from "./users.schema";

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id")
      .references(() => quizzes.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    answers: jsonb("answers").notNull(),
    score: integer("score").notNull(),
    totalMarks: integer("total_marks").notNull(),
    isPassed: boolean("is_passed").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    submittedAt: timestamp("submitted_at").notNull(),
    timeSpent: integer("time_spent").notNull(),
  },
  (table) => ({
    quizIdIdx: index("quiz_attempts_quiz_id_idx").on(table.quizId),
    studentIdIdx: index("quiz_attempts_student_id_idx").on(table.studentId),
    submittedAtIdx: index("quiz_attempts_submitted_at_idx").on(table.submittedAt),
  })
);

export type QuizAttempt = InferSelectModel<typeof quizAttempts>;
export type NewQuizAttempt = InferInsertModel<typeof quizAttempts>;
