import { pgTable, uuid, text, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { quizzes } from "./quizzes.schema";

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id")
      .references(() => quizzes.id, { onDelete: "cascade" })
      .notNull(),
    questionText: text("question_text").notNull(),
    marks: integer("marks").notNull(),
    order: integer("order").notNull(),
    options: jsonb("options").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    quizIdIdx: index("quiz_questions_quiz_id_idx").on(table.quizId),
    orderIdx: index("quiz_questions_order_idx").on(table.order),
  })
);

export type QuizQuestion = InferSelectModel<typeof quizQuestions>;
export type NewQuizQuestion = InferInsertModel<typeof quizQuestions>;
