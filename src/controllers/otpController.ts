import * as otpService from "../services/otp.service";
import { successResponse } from "../utils/response.util";

export const sendOTPHandler = async (context: any) => {
  const { body } = context;
  const result = await otpService.sendOTP(body.phoneNumber);
  return successResponse(result, "OTP sent successfully");
};

export const verifyOTPHandler = async (context: any) => {
  const { body } = context;
  const result = await otpService.verifyOTPAndLogin(body.phoneNumber, body.otp, body.otpId);
  return successResponse(result, "Phone verified successfully");
};

export const resendOTPHandler = async (context: any) => {
  const { body } = context;
  const result = await otpService.resendOTP(body.phoneNumber);
  return successResponse(result, "OTP resent successfully");
};
