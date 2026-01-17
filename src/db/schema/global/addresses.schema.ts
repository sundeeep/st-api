import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  pgEnum,
  geometry,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const addressTypeEnum = pgEnum("address_type", ["user", "venue", "host"]);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: addressTypeEnum("type").notNull(),
    typeId: uuid("typeId").notNull(),
    streetAddress: text("streetAddress"),
    city: text("city"),
    state: text("state"),
    pincode: text("pincode"),
    country: text("country"),
    coordinates: geometry("coordinates", { type: "point", mode: "xy", srid: 4326 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      typeTypeIdIdx: index("idx_addresses_type_type_id").on(table.type, table.typeId),
      coordinatesGistIdx: index("idx_addresses_coordinates_gist").using(
        "gist",
        table.coordinates
      ),
    },
  ]
);

export type Address = InferSelectModel<typeof addresses>;
export type NewAddress = InferInsertModel<typeof addresses>;
