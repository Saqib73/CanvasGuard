import mongoose from "mongoose";
const Schema = mongoose.Schema;

const communitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    coverArt: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      width: {
        type: Number,
        default: null,
      },
      height: {
        type: Number,
        default: null,
      },
      blurDataUrl: {
        type: String,
        default: null,
      },
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // No `posts` array here: posts are linked via Post.community
    rules: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Community = mongoose.model("Community", communitySchema);
