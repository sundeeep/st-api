import twilio from "twilio";
import { env } from "../config/env.config";

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const sendOTPViaSMS = async (phoneNumber: string, otp: string): Promise<void> => {
  const message = `Your OTP code is: ${otp}. Valid for ${env.OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`;

  await twilioClient.messages.create({
    body: message,
    from: env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });

  console.log(`✅ SMS sent to ${phoneNumber} via Twilio`);
};
