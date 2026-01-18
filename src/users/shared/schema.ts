import {
  pgTable,
  uuid,
  text,
  date,
  boolean,
  decimal,
  integer,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersProfile } from "../../auth/auth.schema";

// Enums
export const gradeTypeEnum = pgEnum("grade_type", ["percentage", "cgpa", "gpa"]);
export const experienceEnum = pgEnum("employment_type", [
  "full-time",
  "part-time",
  "internship",
  "contract",
  "freelance",
]);

// Education schema
export const usersEducation = pgTable(
  "usersEducation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => usersProfile.id, { onDelete: "cascade" }),
    institutionName: text("institutionName"),
    degree: text("degree"),
    course: text("course"),
    startDate: date("startDate"),
    endDate: date("endDate"),
    isCurrentlyStudying: boolean("isCurrentlyStudying").default(false).notNull(),
    gradeValue: decimal("gradeValue", { precision: 5, scale: 2 }),
    gradeType: gradeTypeEnum("gradeType"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      userIdIdx: index("idx_users_education_user_id").on(table.userId),
    },
  ]
);

// Experience schema
export const userWorkExperience = pgTable(
  "userWorkExperience",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => usersProfile.id, { onDelete: "cascade" }),
    organization: text("organization").notNull(),
    role: text("role").notNull(),
    employmentType: experienceEnum("employmentType"),
    location: text("location"),
    startDate: date("startDate"),
    endDate: date("endDate"),
    isCurrentlyWorking: boolean("isCurrentlyWorking").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      userIdIdx: index("idx_user_work_experience_user_id").on(table.userId),
    },
  ]
);

// Type inference for TypeScript
export type UsersEducation = InferSelectModel<typeof usersEducation>;
export type NewUsersEducation = InferInsertModel<typeof usersEducation>;

export type UserWorkExperience = InferSelectModel<typeof userWorkExperience>;
export type NewUserWorkExperience = InferInsertModel<typeof userWorkExperience>;
