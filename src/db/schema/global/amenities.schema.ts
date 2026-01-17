import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const amenityTypeEnum = pgEnum("amenity_type", ["event", "venue", "organization"]);

export const amenities = pgTable(
  "amenities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: amenityTypeEnum("type").notNull(),
    typeId: uuid("typeId").notNull(),
    icon: text("icon"),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      typeTypeIdIdx: index("idx_amenities_type_type_id").on(table.type, table.typeId),
    },
  ]
);

export type Amenity = InferSelectModel<typeof amenities>;
export type NewAmenity = InferInsertModel<typeof amenities>;
