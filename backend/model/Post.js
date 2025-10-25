import mongoose from "mongoose";
const Schema = mongoose.Schema;

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
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);
