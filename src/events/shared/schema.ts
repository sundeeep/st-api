import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersProfile } from "../../auth/auth.schema";
import { hosts, venues } from "../../db/schema/global";

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
  "completed",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "expired",
]);
export const ticketStatusEnum = pgEnum("ticket_status", ["valid", "used", "cancelled"]);
export const platformFeeTypeEnum = pgEnum("platform_fee_type", ["percentage", "fixed", "both"]);

export const eventCategories = pgTable(
  "event_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    icon: text("icon"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      nameIdx: index("idx_event_categories_name").on(table.name),
    },
  ]
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("categoryId").references(() => eventCategories.id),
    hostId: uuid("hostId").references(() => hosts.id),
    venueId: uuid("venueId").references(() => venues.id),

    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    shortDescription: text("shortDescription"),
    posterImage: text("posterImage"),
    coverImage: text("coverImage"),

    totalCapacity: integer("totalCapacity"),
    bookedCount: integer("bookedCount").default(0),
    likeCount: integer("likeCount").default(0),

    platformFeeType: platformFeeTypeEnum("platformFeeType").default("percentage"),
    platformFeePercentage: decimal("platformFeePercentage", { precision: 5, scale: 2 }).default(
      "0"
    ),
    platformFeeFixed: decimal("platformFeeFixed", { precision: 10, scale: 2 }).default("0"),

    averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0"),
    ratingCount: integer("ratingCount").default(0),

    status: eventStatusEnum("status").default("draft"),
    isActive: boolean("isActive").default(true),
    isFeatured: boolean("isFeatured").default(false),
    publishedAt: timestamp("publishedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      categoryIdx: index("idx_events_category").on(table.categoryId),
      hostIdIdx: index("idx_events_host_id").on(table.hostId),
      venueIdIdx: index("idx_events_venue_id").on(table.venueId),
      slugIdx: index("idx_events_slug").on(table.slug),
      statusIdx: index("idx_events_status").on(table.status),
      isFeaturedIdx: index("idx_events_is_featured").on(table.isFeatured),
    },
  ]
);

export const eventSchedules = pgTable(
  "event_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("eventId")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    startTime: timestamp("startTime").notNull(),
    timeZone: text("timeZone").default("Asia/Kolkata"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      eventIdIdx: index("idx_event_schedules_event_id").on(table.eventId),
      startTimeIdx: index("idx_event_schedules_start_time").on(table.startTime),
    },
  ]
);

export const eventTicketCategories = pgTable(
  "event_ticket_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("eventId")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),

    ticketTitle: text("ticketTitle").notNull(),
    description: text("description"),

    price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
    quantity: integer("quantity").notNull(),
    soldCount: integer("soldCount").default(0),

    saleStartDate: timestamp("saleStartDate"),
    saleEndDate: timestamp("saleEndDate"),

    minPerOrder: integer("minPerOrder").default(1),
    maxPerOrder: integer("maxPerOrder").default(6),

    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      eventIdx: index("idx_ticket_categories_event").on(table.eventId),
    },
  ]
);

export const eventOrders = pgTable(
  "event_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: text("orderNumber").notNull().unique(),

    eventId: uuid("eventId")
      .notNull()
      .references(() => events.id),
    userId: uuid("userId")
      .notNull()
      .references(() => usersProfile.id),

    totalTickets: integer("totalTickets").notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    platformFee: decimal("platformFee", { precision: 10, scale: 2 }).notNull().default("0"),
    totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),

    paymentStatus: paymentStatusEnum("paymentStatus").default("pending"),
    paymentMethod: text("paymentMethod"),
    razorpayOrderId: text("razorpayOrderId"),
    razorpayPaymentId: text("razorpayPaymentId"),
    razorpaySignature: text("razorpaySignature"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"),
    paidAt: timestamp("paidAt"),
  },
  (table) => [
    {
      eventIdx: index("idx_event_orders_event").on(table.eventId),
      userIdx: index("idx_event_orders_user").on(table.userId),
      statusIdx: index("idx_event_orders_status").on(table.paymentStatus),
      orderNumberIdx: index("idx_event_orders_order_number").on(table.orderNumber),
    },
  ]
);

export const eventOrderItems = pgTable(
  "event_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("orderId")
      .notNull()
      .references(() => eventOrders.id, { onDelete: "cascade" }),
    ticketCategoryId: uuid("ticketCategoryId")
      .notNull()
      .references(() => eventTicketCategories.id),

    quantity: integer("quantity").notNull(),
    pricePerTicket: decimal("pricePerTicket", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [
    {
      orderIdx: index("idx_order_items_order").on(table.orderId),
      ticketCategoryIdx: index("idx_order_items_ticket_category").on(table.ticketCategoryId),
    },
  ]
);

export const eventTickets = pgTable(
  "event_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("orderId")
      .notNull()
      .references(() => eventOrders.id),
    eventId: uuid("eventId")
      .notNull()
      .references(() => events.id),
    ticketCategoryId: uuid("ticketCategoryId")
      .notNull()
      .references(() => eventTicketCategories.id),
    userId: uuid("userId")
      .notNull()
      .references(() => usersProfile.id),

    ticketNumber: text("ticketNumber").notNull().unique(),
    qrCode: text("qrCode").notNull().unique(),

    attendeeName: text("attendeeName").notNull(),
    attendeeEmail: text("attendeeEmail"),
    attendeePhone: text("attendeePhone"),

    status: ticketStatusEnum("status").default("valid"),
    checkedInAt: timestamp("checkedInAt"),
    checkedInBy: uuid("checkedInBy").references(() => usersProfile.id),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      orderIdx: index("idx_event_tickets_order").on(table.orderId),
      eventIdx: index("idx_event_tickets_event").on(table.eventId),
      userIdx: index("idx_event_tickets_user").on(table.userId),
      ticketNumberIdx: index("idx_event_tickets_ticket_number").on(table.ticketNumber),
      qrCodeIdx: index("idx_event_tickets_qr_code").on(table.qrCode),
    },
  ]
);

export type EventCategory = InferSelectModel<typeof eventCategories>;
export type NewEventCategory = InferInsertModel<typeof eventCategories>;

export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;

export type EventTicketCategory = InferSelectModel<typeof eventTicketCategories>;
export type NewEventTicketCategory = InferInsertModel<typeof eventTicketCategories>;

export type EventOrder = InferSelectModel<typeof eventOrders>;
export type NewEventOrder = InferInsertModel<typeof eventOrders>;

export type EventOrderItem = InferSelectModel<typeof eventOrderItems>;
export type NewEventOrderItem = InferInsertModel<typeof eventOrderItems>;

export type EventTicket = InferSelectModel<typeof eventTickets>;
export type NewEventTicket = InferInsertModel<typeof eventTickets>;

export type EventSchedule = InferSelectModel<typeof eventSchedules>;
export type NewEventSchedule = InferInsertModel<typeof eventSchedules>;
