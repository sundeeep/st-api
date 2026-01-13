import { Context } from "elysia";
import * as paymentService from "./payment.service";
import { successResponse } from "../../utils/response.util";
import { SuccessResponse } from "../../types/response.types";

export const razorpayWebhookHandler = async (context: Context): Promise<SuccessResponse> => {
  const signature = context.request.headers.get("x-razorpay-signature");

  if (!signature) {
    throw new Error("Missing Razorpay signature");
  }

  const rawBody = await context.request.text();

  const result = await paymentService.handleRazorpayWebhook(rawBody, signature);

  return successResponse(result, result.message);
};

export const expireOrdersHandler = async (context: Context): Promise<SuccessResponse> => {
  const expiredCount = await paymentService.expirePendingOrders();

  return successResponse(
    { expiredCount },
    `${expiredCount} pending orders expired and tickets released.`
  );
};
