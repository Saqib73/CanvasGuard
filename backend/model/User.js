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
      trim: true,
      index: true,
    },
    // Stored lowercase; uniqueness is enforced (case-insensitively) in auth.controller
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    bio: {
      type: String,
      maxLength: 200,
      default: "new user",
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
    artistProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ArtistProfile",
    },

    // Optional; the client shows an initials placeholder when there's no url
    profilePic: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
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
    communities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
      },
    ],
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
    verified: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
