import mongoose from "mongoose";
const Schema = mongoose.Schema;

export const COMMISSION_STATUSES = ["pending", "accepted", "declined"];

const commissionDetailSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // The artist's User id (not their ArtistProfile id)
    artistId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    artStyle: {
      type: String,
    },
    refrences: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    price: {
      type: Number,
    },
    description: {
      type: String,
    },
    shippingDetails: {
      country: {
        type: String,
        required: true,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
        required: true,
      },
      // String: postal codes can have letters (UK, Canada) and leading zeros
      postal: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: COMMISSION_STATUSES,
      default: "pending",
    },
    // Kept in sync with status for older clients; status is the source of truth
    isConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const CommissionDetail =
  mongoose.models.CommissionDetail ||
  mongoose.model("CommissionDetail", commissionDetailSchema);
