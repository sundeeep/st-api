import { eq, desc, and, sql, count, sum, gte, lte, ilike, or, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
  eventCategories,
  events,
  eventSchedules,
  eventTicketCategories,
  eventOrders,
  eventOrderItems,
  eventTickets,
} from "../shared/schema";
import { venues, hosts, addresses } from "../../db/schema/global";
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

  const [category] = await db
    .insert(eventCategories)
    .values({
      name: data.name,
      icon: data.icon,
    })
    .returning();

  return category;
}

export async function getCategories() {
  const categories = await db
    .select({
      id: eventCategories.id,
      name: eventCategories.name,
      icon: eventCategories.icon,
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

export async function createEvent(data: CreateEventBody) {
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

  if (data.hostId) {
    const host = await db.select().from(hosts).where(eq(hosts.id, data.hostId)).limit(1);
    if (!host.length) {
      throw ValidationError("Invalid host");
    }
  }

  if (data.venueId) {
    const venue = await db.select().from(venues).where(eq(venues.id, data.venueId)).limit(1);
    if (!venue.length) {
      throw ValidationError("Invalid venue");
    }
  }

  const [event] = await db
    .insert(events)
    .values({
      categoryId: data.categoryId,
      hostId: data.hostId,
      venueId: data.venueId,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      shortDescription: data.shortDescription || null,
      posterImage: data.posterImage || null,
      coverImage: data.coverImage || null,
      totalCapacity: data.totalCapacity || null,
      platformFeeType: data.platformFeeType || "percentage",
      platformFeePercentage: data.platformFeePercentage?.toString() || "5.00",
      platformFeeFixed: data.platformFeeFixed?.toString() || "0",
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

  if (filters.search) {
    conditions.push(ilike(events.name, `%${filters.search}%`));
  }

  const [eventsList, totalCount] = await Promise.all([
    db
      .select({
        id: events.id,
        name: events.name,
        slug: events.slug,
        posterImage: events.posterImage,
        coverImage: events.coverImage,
        city: addresses.city,
        state: addresses.state,
        venueName: venues.name,
        totalCapacity: events.totalCapacity,
        bookedCount: events.bookedCount,
        status: events.status,
        isActive: events.isActive,
        categoryName: eventCategories.name,
        createdAt: events.createdAt,
      })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(addresses, eq(venues.addressId, addresses.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(events.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(events)
      .where(conditions.length ? and(...conditions) : undefined),
  ]);

  const eventIds = eventsList.map((e) => e.id);

  // Get earliest startTime and timeZone for each event from eventSchedules
  let earliestSchedules: {
    eventId: string;
    startTime: Date | null;
    timeZone: string | null;
  }[] = [];
  if (eventIds.length > 0) {
    // Get all active schedules for these events
    const allSchedules = await db
      .select({
        eventId: eventSchedules.eventId,
        startTime: eventSchedules.startTime,
        timeZone: eventSchedules.timeZone,
      })
      .from(eventSchedules)
      .where(
        and(
          inArray(eventSchedules.eventId, eventIds),
          eq(eventSchedules.isActive, true)
        )
      );

    // Group by eventId and find the earliest startTime with its timeZone
    const scheduleMap = new Map<string, { startTime: Date; timeZone: string | null }>();
    for (const schedule of allSchedules) {
      const existing = scheduleMap.get(schedule.eventId);
      if (!existing || (schedule.startTime && (!existing.startTime || schedule.startTime < existing.startTime))) {
        scheduleMap.set(schedule.eventId, {
          startTime: schedule.startTime,
          timeZone: schedule.timeZone,
        });
      }
    }
    earliestSchedules = Array.from(scheduleMap.entries()).map(([eventId, data]) => ({
      eventId,
      startTime: data.startTime,
      timeZone: data.timeZone,
    }));
  }
  const scheduleMap = new Map(
    earliestSchedules.map((s) => [
      s.eventId,
      { startTime: s.startTime, timeZone: s.timeZone },
    ])
  );

  // Map events with schedule information
  const eventsWithSchedules = eventsList.map((event) => {
    const schedule = scheduleMap.get(event.id);
    return {
      ...event,
      startTime: schedule?.startTime || null,
      timeZone: schedule?.timeZone || null,
    };
  });

  return {
    events: eventsWithSchedules,
    total: totalCount[0]?.count || 0,
  };
}

export async function getEventById(eventId: string) {
  const event = await db
    .select({
      id: events.id,
      categoryId: events.categoryId,
      categoryName: eventCategories.name,
      hostId: events.hostId,
      venueId: events.venueId,
      name: events.name,
      slug: events.slug,
      description: events.description,
      shortDescription: events.shortDescription,
      posterImage: events.posterImage,
      coverImage: events.coverImage,
      totalCapacity: events.totalCapacity,
      bookedCount: events.bookedCount,
      platformFeeType: events.platformFeeType,
      platformFeePercentage: events.platformFeePercentage,
      platformFeeFixed: events.platformFeeFixed,
      status: events.status,
      isActive: events.isActive,
      isFeatured: events.isFeatured,
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

  const [tickets, schedules] = await Promise.all([
    db
      .select()
      .from(eventTicketCategories)
      .where(eq(eventTicketCategories.eventId, eventId)),
    db
      .select()
      .from(eventSchedules)
      .where(eq(eventSchedules.eventId, eventId)),
  ]);

  return {
    ...event[0],
    tickets,
    schedules,
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

  if (data.hostId) {
    const host = await db.select().from(hosts).where(eq(hosts.id, data.hostId)).limit(1);
    if (!host.length) {
      throw ValidationError("Invalid host");
    }
  }

  if (data.venueId) {
    const venue = await db.select().from(venues).where(eq(venues.id, data.venueId)).limit(1);
    if (!venue.length) {
      throw ValidationError("Invalid venue");
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

  const [tickets, schedules] = await Promise.all([
    db
      .select()
      .from(eventTicketCategories)
      .where(eq(eventTicketCategories.eventId, eventId)),
    db
      .select()
      .from(eventSchedules)
      .where(
        and(
          eq(eventSchedules.eventId, eventId),
          eq(eventSchedules.isActive, true)
        )
      ),
  ]);

  if (!tickets.length) {
    throw BadRequestError("Cannot publish event without ticket categories");
  }

  if (!schedules.length) {
    throw BadRequestError("Cannot publish event without at least one active schedule");
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
