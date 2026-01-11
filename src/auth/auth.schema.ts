import { pgTable, uuid, text, boolean, date, integer, timestamp, index } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const usersProfile = pgTable(
  "usersProfile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("fullName"),
    email: text("email").unique(), // ✅ Optional (can be null)
    emailVerified: boolean("emailVerified").default(false),
    aboutMe: text("aboutMe"),
    location: text("location"),
    birthday: date("birthday"),
    gender: text("gender"), // 'male', 'female', 'other', 'prefer_not_to_say'
    mobile: text("mobile").unique().notNull(), // ✅ Mobile is primary identifier
    role: text("role").default("user").notNull(), // 'user', 'admin'
    profileImage: text("profileImage"),
    onboardingStep: integer("onboardingStep").default(0),
    onboardingComplete: boolean("onboardingComplete").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      emailIdx: index("idx_users_email").on(table.email),
      mobileIdx: index("idx_users_mobile").on(table.mobile),
      roleIdx: index("idx_users_role").on(table.role),
    },
  ]
);

// Type inference for TypeScript
export type UserProfile = InferSelectModel<typeof usersProfile>;
export type NewUserProfile = InferInsertModel<typeof usersProfile>;
