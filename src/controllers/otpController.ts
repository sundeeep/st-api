import type { Context } from "elysia";
import * as otpService from "../services/otp.service";
import { successResponse } from "../utils/response.util";
import type { SuccessResponse } from "../types/response.types";

interface SendOTPBody {
  phoneNumber: string;
}

interface VerifyOTPBody {
  phoneNumber: string;
  otp: string;
  otpId: string;
}

interface ResendOTPBody {
  phoneNumber: string;
}

export const sendOTPHandler = async (context: Context): Promise<SuccessResponse> => {
  const body = context.body as SendOTPBody;
  const result = await otpService.sendOTP(body.phoneNumber);
  return successResponse(result, "OTP sent successfully");
};

export const verifyOTPHandler = async (context: Context): Promise<SuccessResponse> => {
  const body = context.body as VerifyOTPBody;
  const result = await otpService.verifyOTPAndLogin(body.phoneNumber, body.otp, body.otpId);
  return successResponse(result, "Phone verified successfully");
};

export const resendOTPHandler = async (context: Context): Promise<SuccessResponse> => {
  const body = context.body as ResendOTPBody;
  const result = await otpService.resendOTP(body.phoneNumber);
  return successResponse(result, "OTP resent successfully");
};
