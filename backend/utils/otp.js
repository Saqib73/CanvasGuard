import crypto from "crypto";
import bcrypt from "bcryptjs";
import { UserOTPVerification } from "../model/UserOTPVerification.js";
import { sendOtpEmail } from "./mailer.js";

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

export const hasActiveOtp = (userId) =>
  UserOTPVerification.exists({ userId, expiresAt: { $gt: new Date() } });

// Seconds until another code may be sent (0 = allowed now)
export const resendCooldownRemaining = async (userId) => {
  const latest = await UserOTPVerification.findOne({ userId })
    .sort({ createdAt: -1 })
    .select("createdAt")
    .lean();
  if (!latest?.createdAt) return 0;
  const elapsed = (Date.now() - latest.createdAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed));
};

/**
 * Replaces any previous code with a fresh 6-digit one and emails it.
 * If the email fails, the code is removed so the user can retry immediately.
 */
export const issueOtp = async (user, purpose) => {
  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

  await UserOTPVerification.deleteMany({ userId: user._id });
  const record = await UserOTPVerification.create({
    userId: user._id,
    otp: await bcrypt.hash(otp, 10),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    attempts: 0,
  });

  try {
    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      purpose,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (err) {
    await UserOTPVerification.deleteOne({ _id: record._id });
    console.error("Failed to send OTP email:", err.message);
    throw Object.assign(
      new Error("We couldn't send the verification email. Please try again."),
      { statusCode: 502 }
    );
  }
};

/**
 * Returns { ok: true } or { ok: false, message, statusCode }.
 * Each wrong guess counts; after OTP_MAX_ATTEMPTS the code is burned.
 */
export const checkOtp = async (userId, otp) => {
  const record = await UserOTPVerification.findOne({ userId }).sort({ createdAt: -1 });

  if (!record)
    return { ok: false, statusCode: 400, message: "No active code. Please request a new one." };

  if (record.expiresAt.getTime() < Date.now()) {
    await UserOTPVerification.deleteMany({ userId });
    return { ok: false, statusCode: 400, message: "This code has expired. Please request a new one." };
  }

  const valid = await bcrypt.compare(String(otp).trim(), record.otp);
  if (!valid) {
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await UserOTPVerification.deleteMany({ userId });
      return { ok: false, statusCode: 429, message: "Too many incorrect attempts. Please request a new code." };
    }
    await record.save();
    const left = OTP_MAX_ATTEMPTS - record.attempts;
    return { ok: false, statusCode: 400, message: `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` };
  }

  await UserOTPVerification.deleteMany({ userId });
  return { ok: true };
};
