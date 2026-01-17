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
import {
  EventListFilters,
  EventListItem,
  EventDetail,
  TicketCategoryDetail,
  BookTicketRequest,
  BookTicketResponse,
  MyOrder,
  MyTicket,
  TicketDetail,
} from "./student.types";
import { eq, and, gte, lte, ilike, or, sql, inArray, desc } from "drizzle-orm";
import { BadRequestError, NotFoundError, ConflictError } from "../../utils/errors.util";
import { EVENT_CONFIG } from "../shared/config";
import { createRazorpayOrder } from "../shared/razorpay.util";
import { env } from "../../config/env.config";
import crypto from "crypto";
import { checkUserInteractions } from "../../interactions/shared/interactions.service";

export async function browseEvents(
  filters: EventListFilters,
  userId?: string
): Promise<{
  events: EventListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = filters.page || 1;
  const limit = Math.min(
    filters.limit || EVENT_CONFIG.DEFAULT_PAGE_LIMIT,
    EVENT_CONFIG.MAX_PAGE_LIMIT
  );
  const offset = (page - 1) * limit;

  const conditions = [eq(events.status, "published"), eq(events.isActive, true)];

  if (filters.categoryId) {
    conditions.push(eq(events.categoryId, filters.categoryId));
  }

  if (filters.search) {
    conditions.push(ilike(events.name, `%${filters.search}%`));
  }

  const [eventsList, totalResult] = await Promise.all([
    db
      .select({
        id: events.id,
        name: events.name,
        slug: events.slug,
        posterImage: events.posterImage,
        coverImage: events.coverImage,
        categoryId: events.categoryId,
        categoryName: eventCategories.name,
        shortDescription: events.shortDescription,
        venueId: events.venueId,
        venueName: venues.name,
        city: addresses.city,
        state: addresses.state,
        totalCapacity: events.totalCapacity,
        status: events.status,
        likeCount: events.likeCount,
      })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(addresses, eq(venues.addressId, addresses.id))
      .where(and(...conditions))
      .orderBy(events.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(and(...conditions)),
  ]);

  const eventIds = eventsList.map((e) => e.id);

  // Get earliest startTime for each event from eventSchedules
  let earliestSchedules: { eventId: string; startTime: Date | null }[] = [];
  if (eventIds.length > 0) {
    const schedules = await db
      .select({
        eventId: eventSchedules.eventId,
        startTime: sql<Date>`MIN(${eventSchedules.startTime})`.as("startTime"),
      })
      .from(eventSchedules)
      .where(
        and(
          inArray(eventSchedules.eventId, eventIds),
          eq(eventSchedules.isActive, true)
        )
      )
      .groupBy(eventSchedules.eventId);
    earliestSchedules = schedules;
  }
  const startTimeMap = new Map(
    earliestSchedules.map((s) => [s.eventId, s.startTime])
  );

  let ticketStats: {
    eventId: string;
    soldCount: number;
    minPrice: number | null;
    maxPrice: number | null;
  }[] = [];

  if (eventIds.length > 0) {
    const soldTickets = await db
      .select({
        eventId: eventTicketCategories.eventId,
        soldCount: sql<number>`SUM(${eventTicketCategories.soldCount})::int`,
      })
      .from(eventTicketCategories)
      .where(inArray(eventTicketCategories.eventId, eventIds))
      .groupBy(eventTicketCategories.eventId);

    const priceStats = await db
      .select({
        eventId: eventTicketCategories.eventId,
        minPrice: sql<number>`MIN(${eventTicketCategories.price})`,
        maxPrice: sql<number>`MAX(${eventTicketCategories.price})`,
      })
      .from(eventTicketCategories)
      .where(
        and(
          inArray(eventTicketCategories.eventId, eventIds),
          eq(eventTicketCategories.isActive, true)
        )
      )
      .groupBy(eventTicketCategories.eventId);

    const soldMap = new Map(soldTickets.map((s) => [s.eventId, s.soldCount]));
    const priceMap = new Map(
      priceStats.map((p) => [p.eventId, { minPrice: p.minPrice, maxPrice: p.maxPrice }])
    );

    ticketStats = eventIds.map((eventId) => ({
      eventId,
      soldCount: soldMap.get(eventId) || 0,
      minPrice: priceMap.get(eventId)?.minPrice || null,
      maxPrice: priceMap.get(eventId)?.maxPrice || null,
    }));
  }

  const statsMap = new Map(ticketStats.map((s) => [s.eventId, s]));

  let likedSet = new Set<string>();
  let bookmarkedSet = new Set<string>();

  if (userId && eventIds.length > 0) {
    const interactions = await checkUserInteractions(userId, "event", eventIds);
    likedSet = new Set(interactions.liked);
    bookmarkedSet = new Set(interactions.bookmarked);
  }

  const eventsWithStats: EventListItem[] = eventsList.map((event) => {
    const stats = statsMap.get(event.id) || { soldCount: 0, minPrice: null, maxPrice: null };
    const totalCapacity = event.totalCapacity || 0;
    const bookedCount = stats.soldCount;
    const availableTickets = totalCapacity > 0 ? totalCapacity - bookedCount : 0;
    const startTime = startTimeMap.get(event.id);

    // Ensure startTime is a Date object before calling toISOString
    let startTimeISO: string | null = null;
    if (startTime) {
      const dateObj = startTime instanceof Date ? startTime : new Date(startTime);
      if (!isNaN(dateObj.getTime())) {
        startTimeISO = dateObj.toISOString();
      }
    }

    return {
      id: event.id,
      name: event.name,
      slug: event.slug,
      posterImage: event.posterImage,
      coverImage: event.coverImage,
      categoryId: event.categoryId,
      categoryName: event.categoryName,
      shortDescription: event.shortDescription,
      startTime: startTimeISO,
      venueName: event.venueName,
      city: event.city,
      state: event.state,
      totalCapacity: event.totalCapacity,
      bookedCount,
      availableTickets,
      minPrice: stats.minPrice || 0,
      maxPrice: stats.maxPrice || 0,
      status: event.status as "draft" | "published" | "cancelled" | "completed",
      likeCount: event.likeCount || 0,
      isLiked: userId ? likedSet.has(event.id) : undefined,
      isBookmarked: userId ? bookmarkedSet.has(event.id) : undefined,
    };
  });

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    events: eventsWithStats,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getEventDetails(eventId: string, userId?: string): Promise<EventDetail> {
  const eventData = await db
    .select({
      id: events.id,
      categoryId: events.categoryId,
      categoryName: eventCategories.name,
      name: events.name,
      slug: events.slug,
      description: events.description,
      shortDescription: events.shortDescription,
      posterImage: events.posterImage,
      coverImage: events.coverImage,
      totalCapacity: events.totalCapacity,
      status: events.status,
      likeCount: events.likeCount,
      venueId: events.venueId,
      venueName: venues.name,
      venueSlug: venues.slug,
      venueCapacity: venues.capacity,
      venueGoogleMapsUrl: venues.googleMapsUrl,
      venueAddressId: venues.addressId,
      addressStreetAddress: addresses.streetAddress,
      addressCity: addresses.city,
      addressState: addresses.state,
      addressPincode: addresses.pincode,
      addressCountry: addresses.country,
      hostId: events.hostId,
      hostName: hosts.hostName,
      hostSlug: hosts.slug,
      hostDescription: hosts.description,
      hostLogo: hosts.logo,
      hostIsVerified: hosts.isVerified,
    })
    .from(events)
    .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(addresses, eq(venues.addressId, addresses.id))
    .leftJoin(hosts, eq(events.hostId, hosts.id))
    .where(and(eq(events.id, eventId), eq(events.status, "published"), eq(events.isActive, true)))
    .limit(1);

  if (!eventData.length) {
    throw NotFoundError("Event not found");
  }

  const event = eventData[0];

  // Get event schedules
  const schedulesData = await db
    .select({
      id: eventSchedules.id,
      startTime: eventSchedules.startTime,
      timeZone: eventSchedules.timeZone,
      isActive: eventSchedules.isActive,
    })
    .from(eventSchedules)
    .where(and(eq(eventSchedules.eventId, eventId), eq(eventSchedules.isActive, true)))
    .orderBy(eventSchedules.startTime);

  const soldResult = await db
    .select({
      soldCount: sql<number>`SUM(${eventTicketCategories.soldCount})::int`,
    })
    .from(eventTicketCategories)
    .where(eq(eventTicketCategories.eventId, eventId));

  const bookedCount = soldResult[0]?.soldCount || 0;

  const ticketCategoriesData = await db
    .select({
      id: eventTicketCategories.id,
      ticketTitle: eventTicketCategories.ticketTitle,
      description: eventTicketCategories.description,
      price: eventTicketCategories.price,
      quantity: eventTicketCategories.quantity,
      soldCount: eventTicketCategories.soldCount,
      saleStartDate: eventTicketCategories.saleStartDate,
      saleEndDate: eventTicketCategories.saleEndDate,
      minPerOrder: eventTicketCategories.minPerOrder,
      maxPerOrder: eventTicketCategories.maxPerOrder,
      isActive: eventTicketCategories.isActive,
    })
    .from(eventTicketCategories)
    .where(
      and(eq(eventTicketCategories.eventId, eventId), eq(eventTicketCategories.isActive, true))
    )
    .orderBy(eventTicketCategories.price);

  const ticketCategories: TicketCategoryDetail[] = ticketCategoriesData.map((tc) => ({
    id: tc.id,
    ticketTitle: tc.ticketTitle,
    description: tc.description,
    price: parseFloat(tc.price),
    quantity: tc.quantity,
    soldCount: tc.soldCount || 0,
    availableCount: tc.quantity - (tc.soldCount || 0),
    saleStartDate: tc.saleStartDate ? tc.saleStartDate.toISOString() : null,
    saleEndDate: tc.saleEndDate ? tc.saleEndDate.toISOString() : null,
    minPerOrder: tc.minPerOrder || 1,
    maxPerOrder: tc.maxPerOrder || 6,
    isActive: tc.isActive || false,
  }));

  let isLiked: boolean | undefined;
  let isBookmarked: boolean | undefined;

  if (userId) {
    const interactions = await checkUserInteractions(userId, "event", [eventId]);
    isLiked = interactions.liked.includes(eventId);
    isBookmarked = interactions.bookmarked.includes(eventId);
  }

  const schedules = schedulesData.map((s) => {
    const dateObj = s.startTime instanceof Date ? s.startTime : new Date(s.startTime);
    const startTimeISO = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : "";
    return {
      id: s.id,
      startTime: startTimeISO,
      timeZone: s.timeZone,
      isActive: s.isActive,
    };
  });

  const venue: EventDetail["venue"] = event.venueId
    ? {
        id: event.venueId,
        name: event.venueName || "",
        slug: event.venueSlug || "",
        capacity: event.venueCapacity,
        address: event.venueAddressId
          ? {
              streetAddress: event.addressStreetAddress,
              city: event.addressCity,
              state: event.addressState,
              pincode: event.addressPincode,
              country: event.addressCountry,
            }
          : null,
        googleMapsUrl: event.venueGoogleMapsUrl,
      }
    : null;

  const host: EventDetail["host"] = event.hostId
    ? {
        id: event.hostId,
        hostName: event.hostName || "",
        slug: event.hostSlug || "",
        description: event.hostDescription,
        logo: event.hostLogo,
        isVerified: event.hostIsVerified || false,
      }
    : null;

  return {
    id: event.id,
    categoryId: event.categoryId,
    categoryName: event.categoryName,
    name: event.name,
    slug: event.slug,
    description: event.description,
    shortDescription: event.shortDescription,
    posterImage: event.posterImage,
    coverImage: event.coverImage,
    schedules,
    venue,
    host,
    totalCapacity: event.totalCapacity,
    bookedCount,
    status: event.status as "draft" | "published" | "cancelled" | "completed",
    ticketCategories,
    likeCount: event.likeCount || 0,
    isLiked,
    isBookmarked,
  };
}

export async function bookTickets(
  userId: string,
  eventId: string,
  request: BookTicketRequest
): Promise<BookTicketResponse> {
  const { ticketCategoryId, quantity } = request;

  if (quantity < 1) {
    throw BadRequestError("Quantity must be at least 1");
  }

  const eventData = await db
    .select({
      id: events.id,
      name: events.name,
      status: events.status,
      platformFeeType: events.platformFeeType,
      platformFeePercentage: events.platformFeePercentage,
      platformFeeFixed: events.platformFeeFixed,
    })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.isActive, true)))
    .limit(1);

  if (!eventData.length) {
    throw NotFoundError("Event not found");
  }

  const event = eventData[0];

  if (event.status !== "published") {
    throw BadRequestError("Event is not available for booking");
  }

  const ticketCategoryData = await db
    .select()
    .from(eventTicketCategories)
    .where(
      and(
        eq(eventTicketCategories.id, ticketCategoryId),
        eq(eventTicketCategories.eventId, eventId),
        eq(eventTicketCategories.isActive, true)
      )
    )
    .limit(1);

  if (!ticketCategoryData.length) {
    throw NotFoundError("Ticket category not found");
  }

  const ticketCategory = ticketCategoryData[0];

  const minPerOrder = ticketCategory.minPerOrder || 1;
  const maxPerOrder = ticketCategory.maxPerOrder || 6;
  const soldCount = ticketCategory.soldCount || 0;

  if (quantity < minPerOrder || quantity > maxPerOrder) {
    throw BadRequestError(`Quantity must be between ${minPerOrder} and ${maxPerOrder}`);
  }

  const availableTickets = ticketCategory.quantity - soldCount;

  if (availableTickets < quantity) {
    throw ConflictError(`Only ${availableTickets} tickets available`);
  }

  const now = new Date();

  if (ticketCategory.saleStartDate && new Date(ticketCategory.saleStartDate) > now) {
    throw BadRequestError("Ticket sales have not started yet");
  }

  if (ticketCategory.saleEndDate && new Date(ticketCategory.saleEndDate) < now) {
    throw BadRequestError("Ticket sales have ended");
  }

  const ticketPrice = parseFloat(ticketCategory.price);
  const subtotal = ticketPrice * quantity;
  let platformFee = 0;

  if (event.platformFeeType === "percentage" && event.platformFeePercentage) {
    platformFee = (subtotal * parseFloat(event.platformFeePercentage)) / 100;
  } else if (event.platformFeeType === "fixed" && event.platformFeeFixed) {
    platformFee = parseFloat(event.platformFeeFixed);
  } else if (
    event.platformFeeType === "both" &&
    event.platformFeePercentage &&
    event.platformFeeFixed
  ) {
    const percentageFee = (subtotal * parseFloat(event.platformFeePercentage)) / 100;
    const fixedFee = parseFloat(event.platformFeeFixed);
    platformFee = percentageFee + fixedFee;
  }

  const totalAmount = subtotal + platformFee;
  const expiresAt = new Date(now.getTime() + EVENT_CONFIG.ORDER_EXPIRY_MINUTES * 60 * 1000);

  const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const amountInPaise = Math.round(totalAmount * 100);

  const razorpayOrder = await createRazorpayOrder({
    amount: amountInPaise,
    currency: "INR",
    receipt: orderNumber,
    notes: {
      eventId,
      eventName: event.name,
      userId,
    },
  });

  const [order] = await db
    .insert(eventOrders)
    .values({
      orderNumber,
      eventId,
      userId,
      totalTickets: quantity,
      subtotal: subtotal.toString(),
      platformFee: platformFee.toString(),
      totalAmount: totalAmount.toString(),
      paymentStatus: "pending",
      razorpayOrderId: razorpayOrder.id,
      expiresAt,
    })
    .returning();

  const totalPrice = subtotal;

  await db.insert(eventOrderItems).values({
    orderId: order.id,
    ticketCategoryId,
    quantity,
    pricePerTicket: ticketCategory.price,
    totalPrice: totalPrice.toString(),
  });

  await db
    .update(eventTicketCategories)
    .set({
      soldCount: sql`${eventTicketCategories.soldCount} + ${quantity}`,
    })
    .where(eq(eventTicketCategories.id, ticketCategoryId));

  await db
    .update(events)
    .set({
      bookedCount: sql`${events.bookedCount} + ${quantity}`,
    })
    .where(eq(events.id, eventId));

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    eventId,
    eventName: event.name,
    ticketCategoryTitle: ticketCategory.ticketTitle,
    quantity,
    ticketPrice,
    platformFee,
    totalAmount,
    paymentStatus: order.paymentStatus as "pending" | "completed" | "failed" | "expired",
    expiresAt: order.expiresAt ? order.expiresAt.toISOString() : null,
    createdAt: order.createdAt.toISOString(),
    razorpay: {
      orderId: razorpayOrder.id,
      keyId: env.RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: "INR",
    },
  };
}

export async function getMyOrders(
  userId: string,
  page: number = 1,
  limit: number = EVENT_CONFIG.DEFAULT_PAGE_LIMIT
): Promise<{
  orders: MyOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const validLimit = Math.min(limit, EVENT_CONFIG.MAX_PAGE_LIMIT);
  const offset = (page - 1) * validLimit;

  const [ordersData, totalResult] = await Promise.all([
    db
      .select({
        orderId: eventOrders.id,
        eventId: events.id,
        eventName: events.name,
        coverImage: events.coverImage,
        venueId: events.venueId,
        venueName: venues.name,
        venueCity: addresses.city,
        ticketCategoryTitle: eventTicketCategories.ticketTitle,
        quantity: eventOrderItems.quantity,
        pricePerTicket: eventOrderItems.pricePerTicket,
        platformFee: eventOrders.platformFee,
        totalAmount: eventOrders.totalAmount,
        paymentStatus: eventOrders.paymentStatus,
        razorpayPaymentId: eventOrders.razorpayPaymentId,
        createdAt: eventOrders.createdAt,
        expiresAt: eventOrders.expiresAt,
      })
      .from(eventOrders)
      .innerJoin(eventOrderItems, eq(eventOrders.id, eventOrderItems.orderId))
      .innerJoin(events, eq(eventOrders.eventId, events.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(addresses, eq(venues.addressId, addresses.id))
      .innerJoin(
        eventTicketCategories,
        eq(eventOrderItems.ticketCategoryId, eventTicketCategories.id)
      )
      .where(eq(eventOrders.userId, userId))
      .orderBy(desc(eventOrders.createdAt))
      .limit(validLimit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventOrders)
      .where(eq(eventOrders.userId, userId)),
  ]);

  const orderEventIds = [...new Set(ordersData.map((o) => o.eventId))];
  const earliestSchedules: { eventId: string; startTime: Date | null }[] = [];
  if (orderEventIds.length > 0) {
    const schedules = await db
      .select({
        eventId: eventSchedules.eventId,
        startTime: sql<Date>`MIN(${eventSchedules.startTime})`.as("startTime"),
      })
      .from(eventSchedules)
      .where(
        and(
          inArray(eventSchedules.eventId, orderEventIds),
          eq(eventSchedules.isActive, true)
        )
      )
      .groupBy(eventSchedules.eventId);
    earliestSchedules.push(...schedules);
  }
  const startTimeMap = new Map(
    earliestSchedules.map((s) => [s.eventId, s.startTime])
  );

  const orders: MyOrder[] = ordersData.map((order) => {
    const startTime = startTimeMap.get(order.eventId);
    let startTimeISO: string | null = null;
    if (startTime) {
      const dateObj = startTime instanceof Date ? startTime : new Date(startTime);
      if (!isNaN(dateObj.getTime())) {
        startTimeISO = dateObj.toISOString();
      }
    }
    return {
      orderId: order.orderId,
      eventId: order.eventId,
      eventName: order.eventName,
      startTime: startTimeISO,
      venueName: order.venueName,
      city: order.venueCity,
      coverImage: order.coverImage,
      ticketCategoryTitle: order.ticketCategoryTitle,
      quantity: order.quantity,
      ticketPrice: parseFloat(order.pricePerTicket),
      platformFee: parseFloat(order.platformFee),
      totalAmount: parseFloat(order.totalAmount),
      paymentStatus: order.paymentStatus as "pending" | "completed" | "failed" | "expired",
      paymentId: order.razorpayPaymentId,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : new Date(order.createdAt).toISOString(),
      expiresAt: order.expiresAt ? (order.expiresAt instanceof Date ? order.expiresAt.toISOString() : new Date(order.expiresAt).toISOString()) : null,
    };
  });

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / validLimit);

  return {
    orders,
    total,
    page,
    limit: validLimit,
    totalPages,
  };
}

export async function getMyTickets(
  userId: string,
  page: number = 1,
  limit: number = EVENT_CONFIG.DEFAULT_PAGE_LIMIT
): Promise<{
  tickets: MyTicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const validLimit = Math.min(limit, EVENT_CONFIG.MAX_PAGE_LIMIT);
  const offset = (page - 1) * validLimit;

  const [ticketsData, totalResult] = await Promise.all([
    db
      .select({
        ticketId: eventTickets.id,
        qrCode: eventTickets.qrCode,
        orderId: eventTickets.orderId,
        eventId: eventTickets.eventId,
        eventName: events.name,
        coverImage: events.coverImage,
        venueId: events.venueId,
        venueName: venues.name,
        venueCity: addresses.city,
        venueState: addresses.state,
        ticketCategoryTitle: eventTicketCategories.ticketTitle,
        ticketPrice: eventTicketCategories.price,
        checkedInAt: eventTickets.checkedInAt,
      })
      .from(eventTickets)
      .innerJoin(eventOrders, eq(eventTickets.orderId, eventOrders.id))
      .innerJoin(events, eq(eventTickets.eventId, events.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(addresses, eq(venues.addressId, addresses.id))
      .innerJoin(eventTicketCategories, eq(eventTickets.ticketCategoryId, eventTicketCategories.id))
      .where(and(eq(eventOrders.userId, userId), eq(eventOrders.paymentStatus, "completed")))
      .orderBy(desc(events.createdAt))
      .limit(validLimit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventTickets)
      .innerJoin(eventOrders, eq(eventTickets.orderId, eventOrders.id))
      .where(and(eq(eventOrders.userId, userId), eq(eventOrders.paymentStatus, "completed"))),
  ]);

  const ticketEventIds = [...new Set(ticketsData.map((t) => t.eventId))];
  const earliestSchedules: { eventId: string; startTime: Date | null }[] = [];
  if (ticketEventIds.length > 0) {
    const schedules = await db
      .select({
        eventId: eventSchedules.eventId,
        startTime: sql<Date>`MIN(${eventSchedules.startTime})`.as("startTime"),
      })
      .from(eventSchedules)
      .where(
        and(
          inArray(eventSchedules.eventId, ticketEventIds),
          eq(eventSchedules.isActive, true)
        )
      )
      .groupBy(eventSchedules.eventId);
    earliestSchedules.push(...schedules);
  }
  const startTimeMap = new Map(
    earliestSchedules.map((s) => [s.eventId, s.startTime])
  );

  const tickets: MyTicket[] = ticketsData.map((ticket) => ({
    ticketId: ticket.ticketId,
    qrCode: ticket.qrCode,
    orderId: ticket.orderId,
    eventId: ticket.eventId,
    eventName: ticket.eventName,
    startTime: (() => {
      const startTime = startTimeMap.get(ticket.eventId);
      if (!startTime) return null;
      const dateObj = startTime instanceof Date ? startTime : new Date(startTime);
      return !isNaN(dateObj.getTime()) ? dateObj.toISOString() : null;
    })(),
    venueName: ticket.venueName,
    city: ticket.venueCity,
    state: ticket.venueState,
    coverImage: ticket.coverImage,
    ticketCategoryTitle: ticket.ticketCategoryTitle,
    ticketPrice: parseFloat(ticket.ticketPrice),
    isCheckedIn: !!ticket.checkedInAt,
    checkedInAt: ticket.checkedInAt ? ticket.checkedInAt.toISOString() : null,
    seatNumber: null,
  }));

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / validLimit);

  return {
    tickets,
    total,
    page,
    limit: validLimit,
    totalPages,
  };
}

export async function getTicketDetails(userId: string, ticketId: string): Promise<TicketDetail> {
  const ticketData = await db
    .select({
      ticketId: eventTickets.id,
      qrCode: eventTickets.qrCode,
      checkedInAt: eventTickets.checkedInAt,
      eventId: eventTickets.eventId,
      eventName: events.name,
      coverImage: events.coverImage,
      eventStatus: events.status,
      venueId: events.venueId,
      venueName: venues.name,
      venueCity: addresses.city,
      venueState: addresses.state,
      ticketCategoryId: eventTicketCategories.id,
      ticketTitle: eventTicketCategories.ticketTitle,
      ticketPrice: eventTicketCategories.price,
      orderId: eventOrders.id,
      totalAmount: eventOrders.totalAmount,
      paymentStatus: eventOrders.paymentStatus,
      orderCreatedAt: eventOrders.createdAt,
      orderUserId: eventOrders.userId,
    })
    .from(eventTickets)
    .innerJoin(eventOrders, eq(eventTickets.orderId, eventOrders.id))
    .innerJoin(events, eq(eventTickets.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(addresses, eq(venues.addressId, addresses.id))
    .innerJoin(eventTicketCategories, eq(eventTickets.ticketCategoryId, eventTicketCategories.id))
    .where(and(eq(eventTickets.id, ticketId), eq(eventOrders.userId, userId)))
    .limit(1);

  if (!ticketData.length) {
    throw NotFoundError("Ticket not found");
  }

  const ticket = ticketData[0];

  // Get earliest startTime from eventSchedules
  const scheduleData = await db
    .select({
      startTime: sql<Date>`MIN(${eventSchedules.startTime})`.as("startTime"),
      timeZone: sql<string>`MIN(${eventSchedules.timeZone})`.as("timeZone"),
    })
    .from(eventSchedules)
    .where(
      and(
        eq(eventSchedules.eventId, ticket.eventId),
        eq(eventSchedules.isActive, true)
      )
    )
    .groupBy(eventSchedules.eventId)
    .limit(1);

  const schedule = scheduleData[0];

  return {
    ticketId: ticket.ticketId,
    qrCode: ticket.qrCode,
    seatNumber: null,
    isCheckedIn: !!ticket.checkedInAt,
    checkedInAt: ticket.checkedInAt ? ticket.checkedInAt.toISOString() : null,
    event: {
      id: ticket.eventId,
      name: ticket.eventName,
      coverImage: ticket.coverImage,
      startTime: schedule?.startTime
        ? (() => {
            const dateObj = schedule.startTime instanceof Date ? schedule.startTime : new Date(schedule.startTime);
            return !isNaN(dateObj.getTime()) ? dateObj.toISOString() : null;
          })()
        : null,
      timeZone: schedule?.timeZone || null,
      venueName: ticket.venueName,
      city: ticket.venueCity,
      state: ticket.venueState,
      status: ticket.eventStatus ?? "published",
    },
    ticketCategory: {
      id: ticket.ticketCategoryId,
      ticketTitle: ticket.ticketTitle,
      price: parseFloat(ticket.ticketPrice),
    },
    order: {
      id: ticket.orderId,
      totalAmount: parseFloat(ticket.totalAmount),
      paymentStatus: ticket.paymentStatus ?? "completed",
      createdAt: ticket.orderCreatedAt.toISOString(),
    },
  };
}
