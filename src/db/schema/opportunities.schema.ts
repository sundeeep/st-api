import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  text,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { organizations } from "./organizations.schema";
import { users } from "./users.schema";

export const opportunityTypeEnum = pgEnum("opportunity_type", [
  "fulltime",
  "parttime",
  "internship",
  "gig",
]);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    yearsOfExperienceRequired: integer("years_of_experience_required").notNull(),
    type: opportunityTypeEnum("type").notNull(),
    compensation: varchar("compensation", { length: 100 }).notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    postedById: uuid("posted_by_id")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    organizationIdIdx: index("opportunities_organization_id_idx").on(table.organizationId),
    typeIdx: index("opportunities_type_idx").on(table.type),
    createdAtIdx: index("opportunities_created_at_idx").on(table.createdAt),
  })
);

export type Opportunity = InferSelectModel<typeof opportunities>;
export type NewOpportunity = InferInsertModel<typeof opportunities>;
