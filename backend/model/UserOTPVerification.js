import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userOTPVerificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
});

export const UserOTPVerification = mongoose.model(
  "UserOTPVerfication",
  userOTPVerificationSchema
);
