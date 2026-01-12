// import { pgTable, varchar, timestamp, uuid, text, pgEnum, index } from "drizzle-orm/pg-core";
// import { InferSelectModel, InferInsertModel } from "drizzle-orm";
// import { users } from "./users.schema";

// export const organizationTypeEnum = pgEnum("organization_type", [
//   "non-profit",
//   "for-profit",
//   "ngo",
//   "public",
//   "private",
//   "ppp",
// ]);

// export const organizations = pgTable(
//   "organizations",
//   {
//     id: uuid("id").defaultRandom().primaryKey(),
//     title: varchar("title", { length: 255 }).notNull(),
//     description: text("description").notNull(),
//     type: organizationTypeEnum("type").notNull(),
//     city: varchar("city", { length: 100 }).notNull(),
//     logo: varchar("logo", { length: 500 }),
//     createdById: uuid("created_by_id")
//       .references(() => users.id)
//       .notNull(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//   },
//   (table) => ({
//     createdByIdIdx: index("organizations_created_by_id_idx").on(table.createdById),
//     cityIdx: index("organizations_city_idx").on(table.city),
//     typeIdx: index("organizations_type_idx").on(table.type),
//   })
// );

// export type Organization = InferSelectModel<typeof organizations>;
// export type NewOrganization = InferInsertModel<typeof organizations>;
