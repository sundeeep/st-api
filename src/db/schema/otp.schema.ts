import { pgTable, varchar, timestamp, uuid, boolean, integer, index } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const otpVerifications = pgTable(
  "otp_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    otpHash: varchar("otp_hash", { length: 255 }).notNull(),
    otpId: uuid("otp_id").defaultRandom().notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    verified: boolean("verified").default(false).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    phoneNumberIdx: index("otp_phone_number_idx").on(table.phoneNumber),
    expiresAtIdx: index("otp_expires_at_idx").on(table.expiresAt),
  })
);

// Type inference for TypeScript
export type OtpVerification = InferSelectModel<typeof otpVerifications>;
export type NewOtpVerification = InferInsertModel<typeof otpVerifications>;
