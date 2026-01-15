import { db } from "../../db";
import {
  eventCategories,
  events,
  eventTicketCategories,
  eventOrders,
  eventOrderItems,
  eventTickets,
} from "../shared/schema";
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
        ilike(events.venueName, `%${filters.search}%`)
      )!
    );
  }

  const [eventsList, totalResult] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        coverImage: events.coverImage,
        categoryId: events.categoryId,
        categoryName: eventCategories.name,
        eventDate: events.eventDate,
        eventTime: events.eventTime,
        venueName: events.venueName,
        city: events.city,
        state: events.state,
        totalCapacity: events.totalCapacity,
        status: events.status,
        likeCount: events.likeCount,
      })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .where(and(...conditions))
      .orderBy(events.eventDate)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(and(...conditions)),
  ]);

  const eventIds = eventsList.map((e) => e.id);

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

    return {
      id: event.id,
      title: event.title,
      coverImage: event.coverImage,
      categoryId: event.categoryId,
      categoryName: event.categoryName,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
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
      hostName: events.hostName,
      hostEmail: events.hostEmail,
      hostPhone: events.hostPhone,
      status: events.status,
      likeCount: events.likeCount,
    })
    .from(events)
    .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .where(and(eq(events.id, eventId), eq(events.status, "published"), eq(events.isActive, true)))
    .limit(1);

  if (!eventData.length) {
    throw NotFoundError("Event not found");
  }

  const event = eventData[0];

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

  return {
    id: event.id,
    categoryId: event.categoryId,
    categoryName: event.categoryName,
    title: event.title,
    coverImage: event.coverImage,
    description: event.description as { content: string },
    eventDate: event.eventDate,
    eventTime: event.eventTime,
    timeZone: event.timeZone,
    duration: event.duration,
    venueName: event.venueName,
    address: event.address,
    city: event.city,
    state: event.state,
    pincode: event.pincode,
    googleMapsUrl: event.googleMapsUrl,
    totalCapacity: event.totalCapacity,
    bookedCount,
    hostName: event.hostName,
    hostEmail: event.hostEmail,
    hostPhone: event.hostPhone,
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
      title: events.title,
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
      eventTitle: event.title,
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
    eventTitle: event.title,
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
        eventTitle: events.title,
        eventDate: events.eventDate,
        eventTime: events.eventTime,
        venueName: events.venueName,
        city: events.city,
        coverImage: events.coverImage,
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

  const orders: MyOrder[] = ordersData.map((order) => ({
    orderId: order.orderId,
    eventId: order.eventId,
    eventTitle: order.eventTitle,
    eventDate: order.eventDate,
    eventTime: order.eventTime,
    venueName: order.venueName,
    city: order.city,
    coverImage: order.coverImage,
    ticketCategoryTitle: order.ticketCategoryTitle,
    quantity: order.quantity,
    ticketPrice: parseFloat(order.pricePerTicket),
    platformFee: parseFloat(order.platformFee),
    totalAmount: parseFloat(order.totalAmount),
    paymentStatus: order.paymentStatus as "pending" | "completed" | "failed" | "expired",
    paymentId: order.razorpayPaymentId,
    createdAt: order.createdAt.toISOString(),
    expiresAt: order.expiresAt ? order.expiresAt.toISOString() : null,
  }));

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
        eventTitle: events.title,
        eventDate: events.eventDate,
        eventTime: events.eventTime,
        venueName: events.venueName,
        address: events.address,
        city: events.city,
        state: events.state,
        coverImage: events.coverImage,
        ticketCategoryTitle: eventTicketCategories.ticketTitle,
        ticketPrice: eventTicketCategories.price,
        checkedInAt: eventTickets.checkedInAt,
      })
      .from(eventTickets)
      .innerJoin(eventOrders, eq(eventTickets.orderId, eventOrders.id))
      .innerJoin(events, eq(eventTickets.eventId, events.id))
      .innerJoin(eventTicketCategories, eq(eventTickets.ticketCategoryId, eventTicketCategories.id))
      .where(and(eq(eventOrders.userId, userId), eq(eventOrders.paymentStatus, "completed")))
      .orderBy(desc(events.eventDate))
      .limit(validLimit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventTickets)
      .innerJoin(eventOrders, eq(eventTickets.orderId, eventOrders.id))
      .where(and(eq(eventOrders.userId, userId), eq(eventOrders.paymentStatus, "completed"))),
  ]);

  const tickets: MyTicket[] = ticketsData.map((ticket) => ({
    ticketId: ticket.ticketId,
    qrCode: ticket.qrCode,
    orderId: ticket.orderId,
    eventId: ticket.eventId,
    eventTitle: ticket.eventTitle,
    eventDate: ticket.eventDate,
    eventTime: ticket.eventTime,
    venueName: ticket.venueName,
    address: ticket.address,
    city: ticket.city,
    state: ticket.state,
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
      eventTitle: events.title,
      coverImage: events.coverImage,
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
      hostName: events.hostName,
      eventStatus: events.status,
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
    .innerJoin(eventTicketCategories, eq(eventTickets.ticketCategoryId, eventTicketCategories.id))
    .where(and(eq(eventTickets.id, ticketId), eq(eventOrders.userId, userId)))
    .limit(1);

  if (!ticketData.length) {
    throw NotFoundError("Ticket not found");
  }

  const ticket = ticketData[0];

  return {
    ticketId: ticket.ticketId,
    qrCode: ticket.qrCode,
    seatNumber: null,
    isCheckedIn: !!ticket.checkedInAt,
    checkedInAt: ticket.checkedInAt ? ticket.checkedInAt.toISOString() : null,
    event: {
      id: ticket.eventId,
      title: ticket.eventTitle,
      coverImage: ticket.coverImage,
      eventDate: ticket.eventDate,
      eventTime: ticket.eventTime,
      timeZone: ticket.timeZone,
      duration: ticket.duration,
      venueName: ticket.venueName,
      address: ticket.address,
      city: ticket.city,
      state: ticket.state,
      pincode: ticket.pincode ?? "",
      googleMapsUrl: ticket.googleMapsUrl ?? "",
      hostName: ticket.hostName ?? "",
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
