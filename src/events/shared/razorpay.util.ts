import { env } from "../../config/env.config";
import crypto from "crypto";

export interface RazorpayOrderRequest {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface RazorpayWebhookEvent {
  entity: string;
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        captured: boolean;
        email?: string;
        contact?: string;
        created_at: number;
      };
    };
  };
}

export async function createRazorpayOrder(request: RazorpayOrderRequest): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: request.amount,
      currency: request.currency || "INR",
      receipt: request.receipt,
      notes: request.notes || {},
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Razorpay order creation failed: ${error.error?.description || "Unknown error"}`
    );
  }

  return await response.json();
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const generatedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}

export function verifyRazorpayWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}
