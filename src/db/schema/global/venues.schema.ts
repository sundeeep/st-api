import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { addresses } from "./addresses.schema";

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    addressId: uuid("addressId").references(() => addresses.id),
    capacity: integer("capacity"),
    contactInfo: jsonb("contactInfo"),
    isActive: boolean("isActive").default(true).notNull(),
    slug: text("slug").notNull().unique(),
    averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0"),
    ratingCount: integer("ratingCount").default(0),
    googleMapsUrl: text("googleMapsUrl"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      slugIdx: index("idx_venues_slug").on(table.slug),
      addressIdIdx: index("idx_venues_address_id").on(table.addressId),
    },
  ]
);

export type Venue = InferSelectModel<typeof venues>;
export type NewVenue = InferInsertModel<typeof venues>;
