import mongoose from "mongoose";
const Schema = mongoose.Schema;

export const POST_STATUSES = ["processing", "published"];
export const LICENSE_OPTIONS = ["no_ai", "credit_required", "no_commercial"];

// Filter for posts other users may see (missing status = older, published post)
export const PUBLISHED = { status: { $ne: "processing" } };

const postSchema = new Schema(
  {
    author: {
      type: Schema.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    media: {
      type: Schema.Types.ObjectId,
      ref: "Media",
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reposts: {
      type: Number,
    },
    isArt: {
      type: Boolean,
    },
    createdAt: {
      type: Date,
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
    // "processing" while the watermark job runs; only the author can see it then.
    // Posts created before this field existed have no status and count as published.
    status: {
      type: String,
      enum: POST_STATUSES,
      default: "published",
      index: true,
    },
    // Hashtags parsed from the description, lowercased
    tags: {
      type: [String],
      default: undefined,
      index: true,
    },
    // Usage labels the artist opted into
    license: {
      type: [{ type: String, enum: LICENSE_OPTIONS }],
      default: undefined,
    },
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);
