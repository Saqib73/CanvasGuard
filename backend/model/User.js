import mongoose, { mongo } from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      maxLength: 30,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    likedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    isArtist: {
      type: Boolean,
      required: true,
    },
    profilePic: {
      public_id: {
        type: String,
        // required: true,
      },
      url: {
        type: String,
        // required: true,
      },
    },
    communities: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tags: {
      type: String,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema) || mongoose.model.User;
