import { Elysia, t } from "elysia";
import * as paymentController from "./payment.controller";

const paymentRoutes = new Elysia({ prefix: "/payments" })
  .post("/webhook/razorpay", paymentController.razorpayWebhookHandler, {
    detail: {
      tags: ["Payments"],
      summary: "Razorpay webhook",
      description:
        "Webhook endpoint for Razorpay payment events. Handles payment.captured and payment.failed events. Uses raw body for signature verification.",
    },
  })

  .post("/expire-orders", paymentController.expireOrdersHandler, {
    body: t.Object({}),
    detail: {
      tags: ["Payments"],
      summary: "Expire pending orders (Cron job)",
      description:
        "Expire orders past their expiry time and release tickets. Call this via cron every minute.",
    },
  });

export default paymentRoutes;
