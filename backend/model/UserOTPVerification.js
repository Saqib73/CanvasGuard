import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userOTPVerificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
  },
  // TTL index: MongoDB deletes the record once it expires
  expiresAt: {
    type: Date,
    expires: 0,
  },
  attempts: {
    type: Number,
    default: 0,
  },
});

export const UserOTPVerification = mongoose.model(
  "UserOTPVerfication",
  userOTPVerificationSchema
);
