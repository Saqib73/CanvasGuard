import mongoose from "mongoose";
const Schema = mongoose.Schema;

const mediaSchema = new Schema(
  {
    isWaterMarked: {
      type: Boolean,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
      index: true,
    },
    // Uploader; used to authorize watermarking and resolve ownership
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
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
    sha256: {
      type: String,
      index: true,
    },
    phash: {
      type: String,
    },
    // Hashes of the full image + its center crops (see utils/hashUtils.js)
    phashVariants: {
      type: [String],
      default: undefined,
    },
    // "<band>:<hex>" slices of phashVariants; multikey index for candidate lookup
    phashBands: {
      type: [String],
      default: undefined,
      index: true,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    format: {
      type: String,
      default: null,
    },
    blurDataUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Fields safe to send to clients; hashes and the watermark signature stay server-side
export const MEDIA_PUBLIC_FIELDS =
  "url public_id type width height format blurDataUrl isWaterMarked";

export const Media = mongoose.model("Media", mediaSchema);
