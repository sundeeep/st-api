import { eq, desc, and, sql, count, sum, gte, lte, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import {
  eventCategories,
  events,
  eventTicketCategories,
  eventOrders,
  eventOrderItems,
  eventTickets,
} from "../shared/schema";
import { ValidationError, NotFoundError, BadRequestError } from "../../utils/errors.util";
import { EVENT_CONFIG } from "../shared/config";
import type {
  CreateCategoryBody,
  UpdateCategoryBody,
  CreateEventBody,
  UpdateEventBody,
  CreateTicketCategoryBody,
  UpdateTicketCategoryBody,
  EventFilters,
  OrderFilters,
  AttendeeFilters,
} from "./admin.types";

export async function createCategory(data: CreateCategoryBody, createdBy: string) {
  const existing = await db
    .select()
    .from(eventCategories)
    .where(eq(eventCategories.name, data.name))
    .limit(1);

  if (existing.length) {
    throw ValidationError("Category with this name already exists");
  }

  const [category] = await db.insert(eventCategories).values({ name: data.name }).returning();

  return category;
}

export async function getCategories() {
  const categories = await db
    .select({
      id: eventCategories.id,
      name: eventCategories.name,
      isActive: eventCategories.isActive,
      createdAt: eventCategories.createdAt,
    })
    .from(eventCategories)
    .orderBy(eventCategories.name);

  return categories;
}

export async function updateCategory(categoryId: string, data: UpdateCategoryBody) {
  const category = await db
    .select()
    .from(eventCategories)
    .where(eq(eventCategories.id, categoryId))
    .limit(1);

  if (!category.length) {
    throw NotFoundError("Category not found");
  }

  if (data.name) {
    const existing = await db
      .select()
      .from(eventCategories)
      .where(and(eq(eventCategories.name, data.name), sql`${eventCategories.id} != ${categoryId}`))
      .limit(1);

    if (existing.length) {
      throw ValidationError("Category with this name already exists");
    }
  }

  const [updated] = await db
    .update(eventCategories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(eventCategories.id, categoryId))
    .returning();

  return updated;
}

export async function deleteCategory(categoryId: string) {
  const eventsCount = await db
    .select({ count: count() })
    .from(events)
    .where(eq(events.categoryId, categoryId));

  if (eventsCount[0]?.count > 0) {
    throw BadRequestError("Cannot delete category with existing events");
  }

  const result = await db.delete(eventCategories).where(eq(eventCategories.id, categoryId));

  return { deleted: true };
}

export async function createEvent(data: CreateEventBody, createdBy: string) {
  if (data.categoryId) {
    const category = await db
      .select()
      .from(eventCategories)
      .where(eq(eventCategories.id, data.categoryId))
      .limit(1);

    if (!category.length) {
      throw ValidationError("Invalid category");
    }
  }

  const [event] = await db
    .insert(events)
    .values({
      createdBy,
      categoryId: data.categoryId,
      title: data.title,
      coverImage: data.coverImage,
      description: data.description,
      eventDate: data.eventDate,
      eventTime: data.eventTime,
      timeZone: data.timeZone || "Asia/Kolkata",
      duration: data.duration,
      venueName: data.venueName,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      googleMapsUrl: data.googleMapsUrl,
      totalCapacity: data.totalCapacity,
      platformFeeType: data.platformFeeType || "percentage",
      platformFeePercentage: data.platformFeePercentage?.toString() || "5.00",
      platformFeeFixed: data.platformFeeFixed?.toString() || "0",
      hostName: data.hostName,
      hostEmail: data.hostEmail,
      hostPhone: data.hostPhone,
    })
    .returning();

  return event;
}

export async function getEvents(filters: EventFilters) {
  const page = parseInt(filters.page || "1");
  const limit = Math.min(parseInt(filters.limit || "10"), EVENT_CONFIG.DEFAULT_PAGE_LIMIT);
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filters.categoryId) {
    conditions.push(eq(events.categoryId, filters.categoryId));
  }

  if (filters.status) {
    conditions.push(eq(events.status, filters.status));
  }

  if (filters.city) {
    conditions.push(ilike(events.city, `%${filters.city}%`));
  }

  if (filters.state) {
    conditions.push(ilike(events.state, `%${filters.state}%`));
  }

  if (filters.startDate) {
    conditions.push(gte(events.eventDate, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(events.eventDate, filters.endDate));
  }

  if (filters.search) {
    conditions.push(
      or(
        ilike(events.title, `%${filters.search}%`),
        ilike(events.city, `%${filters.search}%`),
        ilike(events.venueName, `%${filters.search}%`)
      )
    );
  }

  const [eventsList, totalCount] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        coverImage: events.coverImage,
        eventDate: events.eventDate,
        eventTime: events.eventTime,
        city: events.city,
        state: events.state,
        venueName: events.venueName,
        totalCapacity: events.totalCapacity,
        bookedCount: events.bookedCount,
        status: events.status,
        isActive: events.isActive,
        categoryName: eventCategories.name,
        createdAt: events.createdAt,
      })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(events.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(events)
      .where(conditions.length ? and(...conditions) : undefined),
  ]);

  return {
    events: eventsList,
    total: totalCount[0]?.count || 0,
  };
}

export async function getEventById(eventId: string) {
  const event = await db
    .select({
      id: events.id,
      createdBy: events.createdBy,
      categoryId: events.categoryId,
      categoryName: eventCategories.name,
      title: events.title,
      coverImage: events.coverImage,
      description: events.description,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      timeZone: events.timeZone,
      duration: events.duration,
      venueName: events.venueName,
      address: events.address,
      city: events.city,
      state: events.state,
      pincode: events.pincode,
      googleMapsUrl: events.googleMapsUrl,
      totalCapacity: events.totalCapacity,
      bookedCount: events.bookedCount,
      platformFeeType: events.platformFeeType,
      platformFeePercentage: events.platformFeePercentage,
      platformFeeFixed: events.platformFeeFixed,
      hostName: events.hostName,
      hostEmail: events.hostEmail,
      hostPhone: events.hostPhone,
      status: events.status,
      isActive: events.isActive,
      publishedAt: events.publishedAt,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
    })
    .from(events)
    .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event.length) {
    throw NotFoundError("Event not found");
  }

  const tickets = await db
    .select()
    .from(eventTicketCategories)
    .where(eq(eventTicketCategories.eventId, eventId));

  return {
    ...event[0],
    tickets,
  };
}

export async function updateEvent(eventId: string, data: UpdateEventBody) {
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

  if (!event.length) {
    throw NotFoundError("Event not found");
  }

  if (data.categoryId) {
    const category = await db
      .select()
      .from(eventCategories)
      .where(eq(eventCategories.id, data.categoryId))
      .limit(1);

    if (!category.length) {
      throw ValidationError("Invalid category");
    }
  }

  const updateData: any = { ...data, updatedAt: new Date() };

  if (data.platformFeePercentage !== undefined) {
    updateData.platformFeePercentage = data.platformFeePercentage.toString();
  }

  if (data.platformFeeFixed !== undefined) {
    updateData.platformFeeFixed = data.platformFeeFixed.toString();
  }

  const [updated] = await db
    .update(events)
    .set(updateData)
    .where(eq(events.id, eventId))
    .returning();

  return updated;
}

export async function deleteEvent(eventId: string) {
  const ordersCount = await db
    .select({ count: count() })
    .from(eventOrders)
    .where(and(eq(eventOrders.eventId, eventId), eq(eventOrders.paymentStatus, "completed")));

  if (ordersCount[0]?.count > 0) {
    throw BadRequestError("Cannot delete event with completed bookings");
  }

  await db.delete(events).where(eq(events.id, eventId));

  return { deleted: true };
}

export async function publishEvent(eventId: string) {
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

  if (!event.length) {
    throw NotFoundError("Event not found");
  }

  if (event[0].status === "published") {
    throw BadRequestError("Event is already published");
  }

  const tickets = await db
    .select()
    .from(eventTicketCategories)
    .where(eq(eventTicketCategories.eventId, eventId));

  if (!tickets.length) {
    throw BadRequestError("Cannot publish event without ticket categories");
  }

  const [updated] = await db
    .update(events)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId))
    .returning();

  return updated;
}

export async function cancelEvent(eventId: string) {
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

  if (!event.length) {
    throw NotFoundError("Event not found");
  }

  const [updated] = await db
    .update(events)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId))
    .returning();

  return updated;
}

export async function getEventAnalytics(eventId: string) {
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

  if (!event.length) {
    throw NotFoundError("Event not found");
  }

  const [orderStats] = await db
    .select({
      totalOrders: count(eventOrders.id),
      completedOrders: count(sql`CASE WHEN ${eventOrders.paymentStatus} = 'completed' THEN 1 END`),
      totalRevenue: sum(eventOrders.totalAmount),
      totalTicketsSold: sum(eventOrders.totalTickets),
    })
    .from(eventOrders)
    .where(eq(eventOrders.eventId, eventId));

  const ticketStats = await db
    .select({
      ticketTitle: eventTicketCategories.ticketTitle,
      price: eventTicketCategories.price,
      quantity: eventTicketCategories.quantity,
      soldCount: eventTicketCategories.soldCount,
    })
    .from(eventTicketCategories)
    .where(eq(eventTicketCategories.eventId, eventId));

  const [attendanceStats] = await db
    .select({
      totalAttendees: count(eventTickets.id),
      checkedIn: count(sql`CASE WHEN ${eventTickets.status} = 'used' THEN 1 END`),
    })
    .from(eventTickets)
    .where(eq(eventTickets.eventId, eventId));

  return {
    event: event[0],
    orders: {
      total: Number(orderStats?.totalOrders) || 0,
      completed: Number(orderStats?.completedOrders) || 0,
      revenue: Number(orderStats?.totalRevenue) || 0,
      ticketsSold: Number(orderStats?.totalTicketsSold) || 0,
    },
    tickets: ticketStats,
    attendance: {
      total: Number(attendanceStats?.totalAttendees) || 0,
      checkedIn: Number(attendanceStats?.checkedIn) || 0,
    },
  };
}

export async function createTicketCategory(eventId: string, data: CreateTicketCategoryBody) {
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

  if (!event.length) {
    throw NotFoundError("Event not found");
  }

  const [ticket] = await db
    .insert(eventTicketCategories)
    .values({
      eventId,
      ticketTitle: data.ticketTitle,
      description: data.description,
      price: data.price.toString(),
      quantity: data.quantity,
      saleStartDate: data.saleStartDate ? new Date(data.saleStartDate) : undefined,
      saleEndDate: data.saleEndDate ? new Date(data.saleEndDate) : undefined,
      minPerOrder: data.minPerOrder || 1,
      maxPerOrder: data.maxPerOrder || EVENT_CONFIG.MAX_TICKETS_PER_ORDER,
    })
    .returning();

  return ticket;
}

export async function updateTicketCategory(ticketId: string, data: UpdateTicketCategoryBody) {
  const ticket = await db
    .select()
    .from(eventTicketCategories)
    .where(eq(eventTicketCategories.id, ticketId))
    .limit(1);

  if (!ticket.length) {
    throw NotFoundError("Ticket category not found");
  }

  const updateData: any = { ...data };

  if (data.price !== undefined) {
    updateData.price = data.price.toString();
  }

  if (data.saleStartDate) {
    updateData.saleStartDate = new Date(data.saleStartDate);
  }

  if (data.saleEndDate) {
    updateData.saleEndDate = new Date(data.saleEndDate);
  }

  const [updated] = await db
    .update(eventTicketCategories)
    .set(updateData)
    .where(eq(eventTicketCategories.id, ticketId))
    .returning();

  return updated;
}

export async function deleteTicketCategory(ticketId: string) {
  const ordersCount = await db
    .select({ count: count() })
    .from(eventOrderItems)
    .where(eq(eventOrderItems.ticketCategoryId, ticketId));

  if (ordersCount[0]?.count > 0) {
    throw BadRequestError("Cannot delete ticket category with existing orders");
  }

  await db.delete(eventTicketCategories).where(eq(eventTicketCategories.id, ticketId));

  return { deleted: true };
}

export async function getEventOrders(eventId: string, filters: OrderFilters) {
  const page = parseInt(filters.page || "1");
  const limit = Math.min(parseInt(filters.limit || "10"), EVENT_CONFIG.DEFAULT_PAGE_LIMIT);
  const offset = (page - 1) * limit;

  const conditions = [eq(eventOrders.eventId, eventId)];

  if (filters.paymentStatus) {
    conditions.push(eq(eventOrders.paymentStatus, filters.paymentStatus));
  }

  if (filters.startDate) {
    conditions.push(gte(eventOrders.createdAt, new Date(filters.startDate)));
  }

  if (filters.endDate) {
    conditions.push(lte(eventOrders.createdAt, new Date(filters.endDate)));
  }

  const [ordersList, totalCount] = await Promise.all([
    db
      .select({
        id: eventOrders.id,
        orderNumber: eventOrders.orderNumber,
        userId: eventOrders.userId,
        totalTickets: eventOrders.totalTickets,
        totalAmount: eventOrders.totalAmount,
        paymentStatus: eventOrders.paymentStatus,
        paymentMethod: eventOrders.paymentMethod,
        createdAt: eventOrders.createdAt,
        paidAt: eventOrders.paidAt,
      })
      .from(eventOrders)
      .where(and(...conditions))
      .orderBy(desc(eventOrders.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(eventOrders)
      .where(and(...conditions)),
  ]);

  return {
    orders: ordersList,
    total: totalCount[0]?.count || 0,
  };
}

export async function getEventAttendees(eventId: string, filters: AttendeeFilters) {
  const page = parseInt(filters.page || "1");
  const limit = Math.min(parseInt(filters.limit || "10"), EVENT_CONFIG.DEFAULT_PAGE_LIMIT);
  const offset = (page - 1) * limit;

  const conditions = [eq(eventTickets.eventId, eventId)];

  if (filters.ticketCategoryId) {
    conditions.push(eq(eventTickets.ticketCategoryId, filters.ticketCategoryId));
  }

  if (filters.checkedIn === "true") {
    conditions.push(eq(eventTickets.status, "used"));
  } else if (filters.checkedIn === "false") {
    conditions.push(eq(eventTickets.status, "valid"));
  }

  if (filters.search) {
    const searchConditions = [
      ilike(eventTickets.attendeeName, `%${filters.search}%`),
      ilike(eventTickets.attendeeEmail, `%${filters.search}%`),
      ilike(eventTickets.ticketNumber, `%${filters.search}%`),
    ].filter(Boolean);

    if (searchConditions.length > 0) {
      conditions.push(or(...searchConditions)!);
    }
  }

  const [attendeesList, totalCount] = await Promise.all([
    db
      .select({
        id: eventTickets.id,
        ticketNumber: eventTickets.ticketNumber,
        attendeeName: eventTickets.attendeeName,
        attendeeEmail: eventTickets.attendeeEmail,
        attendeePhone: eventTickets.attendeePhone,
        ticketTitle: eventTicketCategories.ticketTitle,
        status: eventTickets.status,
        checkedInAt: eventTickets.checkedInAt,
        createdAt: eventTickets.createdAt,
      })
      .from(eventTickets)
      .leftJoin(eventTicketCategories, eq(eventTickets.ticketCategoryId, eventTicketCategories.id))
      .where(and(...conditions))
      .orderBy(desc(eventTickets.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(eventTickets)
      .where(and(...conditions)),
  ]);

  return {
    attendees: attendeesList,
    total: totalCount[0]?.count || 0,
  };
}

export async function checkInTicket(ticketId: string, adminUserId: string) {
  const ticket = await db.select().from(eventTickets).where(eq(eventTickets.id, ticketId)).limit(1);

  if (!ticket.length) {
    throw NotFoundError("Ticket not found");
  }

  if (ticket[0].status === "used") {
    throw BadRequestError(`Ticket already checked in at ${ticket[0].checkedInAt?.toISOString()}`);
  }

  if (ticket[0].status === "cancelled") {
    throw BadRequestError("Ticket is cancelled");
  }

  const [updated] = await db
    .update(eventTickets)
    .set({
      status: "used",
      checkedInAt: new Date(),
      checkedInBy: adminUserId,
    })
    .where(eq(eventTickets.id, ticketId))
    .returning();

  return updated;
}
