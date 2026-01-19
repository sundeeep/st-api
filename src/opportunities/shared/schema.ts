import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  boolean,
  decimal,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersProfile } from "../../auth/auth.schema";

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    website: text("website"),
    logo: text("logo"),
    description: text("description"),
    location: text("location"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      nameIdx: index("idx_companies_name").on(table.name),
      createdAtIdx: index("idx_companies_created_at").on(table.createdAt),
    },
  ]
);

export type Company = InferSelectModel<typeof companies>;
export type NewCompany = InferInsertModel<typeof companies>;

export const opportunityTypeEnum = pgEnum("opportunity_type", ["internship", "full_time"]);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("companyId")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    opportunityType: opportunityTypeEnum("opportunityType").notNull(),
    description: text("description"),
    stipend: decimal("stipend", { precision: 10, scale: 2 }), // for internship
    salaryRange: text("salaryRange"), // for full-time
    duration: text("duration"), // internship duration
    location: text("location"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      companyIdx: index("idx_opportunities_company").on(table.companyId),
      activeCreatedIdx: index("idx_opportunities_active_created").on(table.isActive, table.createdAt),
    },
  ]
);

export type Opportunity = InferSelectModel<typeof opportunities>;
export type NewOpportunity = InferInsertModel<typeof opportunities>;

export const questionTypeEnum = pgEnum("question_type", [
  "short_text",
  "long_text",
  "yes_no",
  "number",
  "url",
  "file",
]);

export const opportunityQuestions = pgTable(
  "opportunity_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    opportunityId: uuid("opportunityId")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    questionType: questionTypeEnum("questionType").notNull(),
    isRequired: boolean("isRequired").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      opportunityIdx: index("idx_opportunity_questions_opportunity").on(table.opportunityId),
    },
  ]
);

export type OpportunityQuestion = InferSelectModel<typeof opportunityQuestions>;
export type NewOpportunityQuestion = InferInsertModel<typeof opportunityQuestions>;

export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
  "withdrawn",
]);

export const opportunityApplications = pgTable(
  "opportunity_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    opportunityId: uuid("opportunityId")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    userId: uuid("userId")
      .notNull()
      .references(() => usersProfile.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").default("applied").notNull(),
    appliedAt: timestamp("appliedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      userIdx: index("idx_opportunity_applications_user").on(table.userId),
      opportunityIdx: index("idx_opportunity_applications_opportunity").on(table.opportunityId),
      statusIdx: index("idx_opportunity_applications_status").on(table.opportunityId, table.status),
      uniqueUserOpportunity: index("idx_opportunity_applications_unique").on(table.opportunityId, table.userId),
    },
  ]
);

export type OpportunityApplication = InferSelectModel<typeof opportunityApplications>;
export type NewOpportunityApplication = InferInsertModel<typeof opportunityApplications>;

export const opportunityApplicationAnswers = pgTable(
  "opportunity_application_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("applicationId")
      .notNull()
      .references(() => opportunityApplications.id, { onDelete: "cascade" }),
    questionId: uuid("questionId")
      .notNull()
      .references(() => opportunityQuestions.id, { onDelete: "cascade" }),
    answer: text("answer"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      applicationQuestionIdx: index("idx_application_answers_app_question").on(table.applicationId, table.questionId),
    },
    unique("unique_application_answers_app_question").on(table.applicationId, table.questionId),
  ]
);

export type OpportunityApplicationAnswer = InferSelectModel<typeof opportunityApplicationAnswers>;
export type NewOpportunityApplicationAnswer = InferInsertModel<typeof opportunityApplicationAnswers>;
