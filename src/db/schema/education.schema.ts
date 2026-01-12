// import { pgTable, varchar, timestamp, uuid, integer, boolean, index } from "drizzle-orm/pg-core";
// import { InferSelectModel, InferInsertModel } from "drizzle-orm";
// import { users } from "./users.schema";

// export const userEducation = pgTable(
//   "user_education",
//   {
//     id: uuid("id").defaultRandom().primaryKey(),
//     userId: uuid("user_id")
//       .notNull()
//       .references(() => users.id, { onDelete: "cascade" }),
//     degree: varchar("degree", { length: 255 }).notNull(),
//     institution: varchar("institution", { length: 255 }).notNull(),
//     fieldOfStudy: varchar("field_of_study", { length: 255 }).notNull(),
//     startYear: integer("start_year").notNull(),
//     endYear: integer("end_year"),
//     current: boolean("current").default(false).notNull(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//   },
//   (table) => ({
//     userIdIdx: index("education_user_id_idx").on(table.userId),
//   })
// );

// // Type inference for TypeScript
// export type UserEducation = InferSelectModel<typeof userEducation>;
// export type NewUserEducation = InferInsertModel<typeof userEducation>;
