import mongoose from "mongoose";
const Schema = mongoose.Schema;

const artistProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    openForCommission: {
      type: Boolean,
      default: false,
    },
    baseFee: {
      type: Number,
      default: 0,
    },
    artStyles: [
      {
        type: String,
      },
    ],
    deliveryTime: {
      type: String,
    },
    bio: {
      type: String,
      maxLength: 200,
    },
    portfolio: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    rating: {
      type: Number,
      default: 0,
    },
    slotsAvailable: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const ArtistProfile =
  mongoose.models.ArtistProfile ||
  mongoose.model("ArtistProfile", artistProfileSchema);
