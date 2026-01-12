// import { pgTable, varchar, timestamp, uuid, pgEnum, index } from "drizzle-orm/pg-core";
// import { InferSelectModel, InferInsertModel } from "drizzle-orm";
// import { opportunities } from "./opportunities.schema";
// import { users } from "./users.schema";

// export const applicationStatusEnum = pgEnum("application_status", [
//   "pending",
//   "reviewed",
//   "shortlisted",
//   "rejected",
//   "accepted",
// ]);

// export const opportunityApplications = pgTable(
//   "opportunity_applications",
//   {
//     id: uuid("id").defaultRandom().primaryKey(),
//     opportunityId: uuid("opportunity_id")
//       .references(() => opportunities.id, { onDelete: "cascade" })
//       .notNull(),
//     studentId: uuid("student_id")
//       .references(() => users.id, { onDelete: "cascade" })
//       .notNull(),
//     resume: varchar("resume", { length: 500 }).notNull(),
//     salaryExpectations: varchar("salary_expectations", { length: 100 }),
//     status: applicationStatusEnum("status").default("pending").notNull(),
//     appliedAt: timestamp("applied_at").defaultNow().notNull(),
//   },
//   (table) => ({
//     studentIdIdx: index("applications_student_id_idx").on(table.studentId),
//     opportunityIdIdx: index("applications_opportunity_id_idx").on(table.opportunityId),
//     statusIdx: index("applications_status_idx").on(table.status),
//     appliedAtIdx: index("applications_applied_at_idx").on(table.appliedAt),
//   })
// );

// export type OpportunityApplication = InferSelectModel<typeof opportunityApplications>;
// export type NewOpportunityApplication = InferInsertModel<typeof opportunityApplications>;
