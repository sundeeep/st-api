import { db } from "../../db";
import {
  eventOrders,
  eventOrderItems,
  eventTickets,
  eventTicketCategories,
  events,
} from "./schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { NotFoundError, BadRequestError } from "../../utils/errors.util";
import { verifyRazorpayWebhookSignature } from "./razorpay.util";
import crypto from "crypto";

export async function handleRazorpayWebhook(
  payload: string,
  signature: string
): Promise<{ success: boolean; message: string }> {
  const isValid = verifyRazorpayWebhookSignature(payload, signature);
  if (!isValid) {
    throw BadRequestError("Invalid webhook signature");
  }

  const webhookData = JSON.parse(payload);
  const event = webhookData.event;
  const paymentEntity = webhookData.payload?.payment?.entity;

  if (!paymentEntity) {
    throw BadRequestError("Invalid webhook payload");
  }

  const razorpayOrderId = paymentEntity.order_id;
  const razorpayPaymentId = paymentEntity.id;
  const paymentStatus = paymentEntity.status;

  const orderData = await db
    .select({
      orderId: eventOrders.id,
    })
    .from(eventOrders)
    .where(eq(eventOrders.razorpayOrderId, razorpayOrderId))
    .limit(1);

  if (!orderData.length) {
    throw NotFoundError("Order not found for this Razorpay order ID");
  }

  const orderId = orderData[0].orderId;

  if (event === "payment.captured" && paymentStatus === "captured") {
    await generateTicketsForOrder(orderId, razorpayPaymentId);
    return { success: true, message: "Payment captured and tickets generated" };
  } else if (event === "payment.failed" && paymentStatus === "failed") {
    await markOrderAsFailed(orderId);
    return { success: true, message: "Payment failed and tickets released" };
  }

  return { success: true, message: "Webhook received but no action taken" };
}

export async function generateTicketsForOrder(orderId: string, paymentId: string): Promise<void> {
  const orderData = await db
    .select({
      orderId: eventOrders.id,
      eventId: eventOrders.eventId,
      userId: eventOrders.userId,
      paymentStatus: eventOrders.paymentStatus,
    })
    .from(eventOrders)
    .where(eq(eventOrders.id, orderId))
    .limit(1);

  if (!orderData.length) {
    throw NotFoundError("Order not found");
  }

  const order = orderData[0];

  if (order.paymentStatus !== "pending") {
    throw BadRequestError(`Order is already ${order.paymentStatus}`);
  }

  const orderItems = await db
    .select({
      id: eventOrderItems.id,
      ticketCategoryId: eventOrderItems.ticketCategoryId,
      quantity: eventOrderItems.quantity,
    })
    .from(eventOrderItems)
    .where(eq(eventOrderItems.orderId, orderId));

  if (!orderItems.length) {
    throw BadRequestError("No items found in order");
  }

  const userProfile = await db.query.usersProfile.findFirst({
    where: (usersProfile, { eq }) => eq(usersProfile.id, order.userId),
    columns: {
      fullName: true,
      email: true,
      mobile: true,
    },
  });

  const userName = userProfile?.fullName || "Guest";
  const userEmail = userProfile?.email || null;
  const userPhone = userProfile?.mobile || null;

  const ticketsToGenerate: Array<{
    orderId: string;
    eventId: string;
    ticketCategoryId: string;
    userId: string;
    ticketNumber: string;
    qrCode: string;
    attendeeName: string;
    attendeeEmail: string | null;
    attendeePhone: string | null;
    status: string;
  }> = [];

  for (const item of orderItems) {
    for (let i = 0; i < item.quantity; i++) {
      const ticketNumber = generateTicketNumber(orderId, i);
      const qrCode = generateQRCode(orderId, order.eventId, item.ticketCategoryId, i);

      ticketsToGenerate.push({
        orderId,
        eventId: order.eventId,
        ticketCategoryId: item.ticketCategoryId,
        userId: order.userId,
        ticketNumber,
        qrCode,
        attendeeName: userName,
        attendeeEmail: userEmail,
        attendeePhone: userPhone,
        status: "valid",
      });
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(eventOrders)
      .set({
        paymentStatus: "completed",
        razorpayPaymentId: paymentId,
        paidAt: new Date(),
      })
      .where(eq(eventOrders.id, orderId));

    if (ticketsToGenerate.length > 0) {
      await tx.insert(eventTickets).values(ticketsToGenerate);
    }
  });
}

export async function markOrderAsFailed(orderId: string): Promise<void> {
  const orderData = await db
    .select({
      orderId: eventOrders.id,
      paymentStatus: eventOrders.paymentStatus,
    })
    .from(eventOrders)
    .where(eq(eventOrders.id, orderId))
    .limit(1);

  if (!orderData.length) {
    throw NotFoundError("Order not found");
  }

  const order = orderData[0];

  if (order.paymentStatus !== "pending") {
    throw BadRequestError(`Order is already ${order.paymentStatus}`);
  }

  const orderItems = await db
    .select({
      ticketCategoryId: eventOrderItems.ticketCategoryId,
      quantity: eventOrderItems.quantity,
    })
    .from(eventOrderItems)
    .where(eq(eventOrderItems.orderId, orderId));

  const orderData2 = await db
    .select({ eventId: eventOrders.eventId })
    .from(eventOrders)
    .where(eq(eventOrders.id, orderId))
    .limit(1);

  const eventId = orderData2[0]?.eventId;

  await db.transaction(async (tx) => {
    await tx
      .update(eventOrders)
      .set({
        paymentStatus: "failed",
      })
      .where(eq(eventOrders.id, orderId));

    for (const item of orderItems) {
      await tx
        .update(eventTicketCategories)
        .set({
          soldCount: sql`${eventTicketCategories.soldCount} - ${item.quantity}`,
        })
        .where(eq(eventTicketCategories.id, item.ticketCategoryId));
    }

    if (eventId) {
      const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      await tx
        .update(events)
        .set({
          bookedCount: sql`${events.bookedCount} - ${totalQuantity}`,
        })
        .where(eq(events.id, eventId));
    }
  });
}

export async function expirePendingOrders(): Promise<number> {
  const now = new Date();

  const expiredOrders = await db
    .select({
      orderId: eventOrders.id,
    })
    .from(eventOrders)
    .where(and(eq(eventOrders.paymentStatus, "pending"), lt(eventOrders.expiresAt, now)));

  if (!expiredOrders.length) {
    return 0;
  }

  const orderIds = expiredOrders.map((o) => o.orderId);

  const orderItems = await db
    .select({
      orderId: eventOrderItems.orderId,
      ticketCategoryId: eventOrderItems.ticketCategoryId,
      quantity: eventOrderItems.quantity,
    })
    .from(eventOrderItems)
    .where(
      sql`${eventOrderItems.orderId} IN (${sql.join(
        orderIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

  const ticketUpdates = new Map<string, number>();
  const eventUpdates = new Map<string, number>();

  for (const item of orderItems) {
    const current = ticketUpdates.get(item.ticketCategoryId) || 0;
    ticketUpdates.set(item.ticketCategoryId, current + item.quantity);
  }

  // Get event IDs for bookedCount update
  const orderEventMap = await db
    .select({
      orderId: eventOrders.id,
      eventId: eventOrders.eventId,
    })
    .from(eventOrders)
    .where(
      sql`${eventOrders.id} IN (${sql.join(
        orderIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

  for (const order of orderEventMap) {
    const items = orderItems.filter((item) => item.orderId === order.orderId);
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const current = eventUpdates.get(order.eventId) || 0;
    eventUpdates.set(order.eventId, current + totalQty);
  }

  await db.transaction(async (tx) => {
    await tx
      .update(eventOrders)
      .set({
        paymentStatus: "expired",
      })
      .where(
        sql`${eventOrders.id} IN (${sql.join(
          orderIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    for (const [ticketCategoryId, quantity] of ticketUpdates.entries()) {
      await tx
        .update(eventTicketCategories)
        .set({
          soldCount: sql`${eventTicketCategories.soldCount} - ${quantity}`,
        })
        .where(eq(eventTicketCategories.id, ticketCategoryId));
    }

    for (const [eventId, quantity] of eventUpdates.entries()) {
      await tx
        .update(events)
        .set({
          bookedCount: sql`${events.bookedCount} - ${quantity}`,
        })
        .where(eq(events.id, eventId));
    }
  });

  return expiredOrders.length;
}

function generateTicketNumber(orderId: string, index: number): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const orderPrefix = orderId.substring(0, 8).toUpperCase();
  return `ST-${orderPrefix}-${timestamp}-${index + 1}`;
}

function generateQRCode(
  orderId: string,
  eventId: string,
  ticketCategoryId: string,
  index: number
): string {
  const data = `${orderId}:${eventId}:${ticketCategoryId}:${index}:${Date.now()}`;
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  return `STTKT-${hash.substring(0, 16).toUpperCase()}`;
}
