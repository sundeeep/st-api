import { pgTable, varchar, uuid } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Domains table - predefined list
 */
export const domains = pgTable("domains", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

// Type inference for TypeScript
export type Domain = InferSelectModel<typeof domains>;
export type NewDomain = InferInsertModel<typeof domains>;
