import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersProfile } from "../../../auth/auth.schema";

export const ratingTypeEnum = pgEnum("rating_type", ["event", "venue", "host"]);

export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: ratingTypeEnum("type").notNull(),
    typeId: uuid("typeId").notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => usersProfile.id),
    ratingNumber: decimal("ratingNumber", { precision: 3, scale: 2 }).notNull(),
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      typeTypeIdIdx: index("idx_ratings_type_type_id").on(table.type, table.typeId),
      userIdIdx: index("idx_ratings_user_id").on(table.userId),
    },
  ]
);

export type Rating = InferSelectModel<typeof ratings>;
export type NewRating = InferInsertModel<typeof ratings>;
