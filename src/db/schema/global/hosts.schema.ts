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

export const hosts = pgTable(
  "hosts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hostName: text("hostName").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    logo: text("logo"),
    contactInfo: jsonb("contactInfo"),
    socialLinks: jsonb("socialLinks"),
    totalEventsHosted: integer("totalEventsHosted").default(0),
    averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0"),
    ratingCount: integer("ratingCount").default(0),
    isVerified: boolean("isVerified").default(false).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      slugIdx: index("idx_hosts_slug").on(table.slug),
      averageRatingIdx: index("idx_hosts_average_rating").on(table.averageRating),
      isVerifiedIdx: index("idx_hosts_is_verified").on(table.isVerified),
      isActiveIdx: index("idx_hosts_is_active").on(table.isActive),
    },
  ]
);

export type Host = InferSelectModel<typeof hosts>;
export type NewHost = InferInsertModel<typeof hosts>;
