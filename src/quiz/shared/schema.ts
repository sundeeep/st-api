import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersProfile } from "../../auth/auth.schema";

export const quizCategories = pgTable(
  "quiz_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    quizzesCount: integer("quizzesCount").default(0),
    participantsCount: integer("participantsCount").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      nameIdx: index("idx_quiz_categories_name").on(table.name),
    },
  ]
);

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdBy: uuid("createdBy")
      .notNull()
      .references(() => usersProfile.id),
    categoryId: uuid("categoryId").references(() => quizCategories.id),
    quizName: text("quizName").notNull(),
    quizType: text("quizType").notNull(),
    about: jsonb("about").notNull().default({ description: "", rules: [] }),
    bannerImage: text("bannerImage"),

    rewardsType: text("rewardsType"),
    rewardsValue: decimal("rewardsValue", { precision: 10, scale: 2 }),

    timerDuration: integer("timerDuration"),

    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate").notNull(),
    revealAnswersDate: timestamp("revealAnswersDate"),

    questionsCount: integer("questionsCount").default(0),
    maxAttempts: integer("maxAttempts").default(1),
    shuffleQuestions: boolean("shuffleQuestions").default(false),
    shuffleOptions: boolean("shuffleOptions").default(false),

    participantsCount: integer("participantsCount").default(0),
    completedCount: integer("completedCount").default(0),
    averageScore: decimal("averageScore", { precision: 5, scale: 2 }).default("0"),

    status: text("status").default("draft"),
    isActive: boolean("isActive").default(true),
    publishedAt: timestamp("publishedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      categoryIdx: index("idx_quizzes_category").on(table.categoryId),
      statusStartIdx: index("idx_quizzes_status_start").on(table.status, table.startDate),
      createdByIdx: index("idx_quizzes_created_by").on(table.createdBy),
      activeDatesIdx: index("idx_quizzes_active_dates").on(
        table.isActive,
        table.startDate,
        table.endDate
      ),
    },
  ]
);

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quizId")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    questionText: text("questionText").notNull(),
    explanation: text("explanation"),
    points: decimal("points", { precision: 5, scale: 2 }).default("1.00"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      quizIdx: index("idx_quiz_questions_quiz").on(table.quizId),
    },
  ]
);

export const quizQuestionOptions = pgTable(
  "quiz_question_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    questionId: uuid("questionId")
      .notNull()
      .references(() => quizQuestions.id, { onDelete: "cascade" }),
    optionText: text("optionText").notNull(),
    isCorrect: boolean("isCorrect").default(false),
    displayOrder: integer("displayOrder").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      questionIdx: index("idx_question_options_question").on(table.questionId),
      orderIdx: index("idx_question_options_order").on(table.questionId, table.displayOrder),
    },
  ]
);

export const userQuizAttempts = pgTable(
  "user_quiz_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quizId")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    userId: uuid("userId")
      .notNull()
      .references(() => usersProfile.id, { onDelete: "cascade" }),
    attemptNumber: integer("attemptNumber").notNull().default(1),

    startedAt: timestamp("startedAt").defaultNow().notNull(),
    submittedAt: timestamp("submittedAt"),
    timeSpent: integer("timeSpent"),

    totalQuestions: integer("totalQuestions").notNull(),
    answeredQuestions: integer("answeredQuestions").default(0),
    correctAnswers: integer("correctAnswers").default(0),
    scoreObtained: decimal("scoreObtained", { precision: 5, scale: 2 }).default("0"),
    scorePercentage: decimal("scorePercentage", { precision: 5, scale: 2 }).default("0"),

    status: text("status").default("in_progress"),

    rewardEarned: boolean("rewardEarned").default(false),
    rewardValue: decimal("rewardValue", { precision: 10, scale: 2 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      quizIdx: index("idx_user_attempts_quiz").on(table.quizId),
      userIdx: index("idx_user_attempts_user").on(table.userId),
      statusIdx: index("idx_user_attempts_status").on(table.quizId, table.userId, table.status),
      submittedIdx: index("idx_user_attempts_submitted").on(table.quizId, table.submittedAt),
    },
  ]
);

export const userQuizAnswers = pgTable(
  "user_quiz_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attemptId")
      .notNull()
      .references(() => userQuizAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("questionId")
      .notNull()
      .references(() => quizQuestions.id, { onDelete: "cascade" }),
    selectedOptionId: uuid("selectedOptionId").references(() => quizQuestionOptions.id, {
      onDelete: "set null",
    }),
    isCorrect: boolean("isCorrect").default(false),
    pointsEarned: decimal("pointsEarned", { precision: 5, scale: 2 }).default("0"),
    answeredAt: timestamp("answeredAt").defaultNow().notNull(),
  },
  (table) => [
    {
      attemptIdx: index("idx_user_answers_attempt").on(table.attemptId),
      questionIdx: index("idx_user_answers_question").on(table.questionId),
    },
  ]
);

export const quizLeaderboard = pgTable(
  "quiz_leaderboard",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quizId")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    userId: uuid("userId")
      .notNull()
      .references(() => usersProfile.id, { onDelete: "cascade" }),
    attemptId: uuid("attemptId")
      .notNull()
      .references(() => userQuizAttempts.id, { onDelete: "cascade" }),

    bestScore: decimal("bestScore", { precision: 5, scale: 2 }).notNull(),
    bestPercentage: decimal("bestPercentage", { precision: 5, scale: 2 }).notNull(),
    bestTimeSpent: integer("bestTimeSpent"),
    totalAttempts: integer("totalAttempts").default(1),

    rank: integer("rank"),

    completedAt: timestamp("completedAt").notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      quizRankIdx: index("idx_leaderboard_quiz_rank").on(table.quizId, table.rank),
      quizScoreIdx: index("idx_leaderboard_quiz_score").on(
        table.quizId,
        table.bestScore,
        table.bestTimeSpent
      ),
      userIdx: index("idx_leaderboard_user").on(table.userId),
    },
  ]
);

export const userQuizRewards = pgTable(
  "user_quiz_rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => usersProfile.id, { onDelete: "cascade" }),
    quizId: uuid("quizId")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    attemptId: uuid("attemptId")
      .notNull()
      .references(() => userQuizAttempts.id, { onDelete: "cascade" }),

    rewardType: text("rewardType").notNull(),
    rewardValue: decimal("rewardValue", { precision: 10, scale: 2 }),

    earnedAt: timestamp("earnedAt").defaultNow().notNull(),
    claimedAt: timestamp("claimedAt"),
    status: text("status").default("earned"),
  },
  (table) => [
    {
      userIdx: index("idx_user_rewards_user").on(table.userId),
      quizIdx: index("idx_user_rewards_quiz").on(table.quizId),
      statusIdx: index("idx_user_rewards_status").on(table.userId, table.status),
    },
  ]
);

export type QuizCategory = InferSelectModel<typeof quizCategories>;
export type NewQuizCategory = InferInsertModel<typeof quizCategories>;

export type Quiz = InferSelectModel<typeof quizzes>;
export type NewQuiz = InferInsertModel<typeof quizzes>;

export type QuizQuestion = InferSelectModel<typeof quizQuestions>;
export type NewQuizQuestion = InferInsertModel<typeof quizQuestions>;

export type QuizQuestionOption = InferSelectModel<typeof quizQuestionOptions>;
export type NewQuizQuestionOption = InferInsertModel<typeof quizQuestionOptions>;

export type UserQuizAttempt = InferSelectModel<typeof userQuizAttempts>;
export type NewUserQuizAttempt = InferInsertModel<typeof userQuizAttempts>;

export type UserQuizAnswer = InferSelectModel<typeof userQuizAnswers>;
export type NewUserQuizAnswer = InferInsertModel<typeof userQuizAnswers>;

export type QuizLeaderboard = InferSelectModel<typeof quizLeaderboard>;
export type NewQuizLeaderboard = InferInsertModel<typeof quizLeaderboard>;

export type UserQuizReward = InferSelectModel<typeof userQuizRewards>;
export type NewUserQuizReward = InferInsertModel<typeof userQuizRewards>;
