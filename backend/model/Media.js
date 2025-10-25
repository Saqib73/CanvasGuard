import mongoose from "mongoose";
const Schema = mongoose.Schema;

const mediaSchema = new Schema(
  {
    isWaterMarked: {
      type: Boolean,
    },
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    signature: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Media = mongoose.model("Media", mediaSchema);
