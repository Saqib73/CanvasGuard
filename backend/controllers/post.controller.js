import mongoose from "mongoose";
import { uploadFilesToCloudinary } from "../features/uploadFilesToCoudinary.js";
import { Community } from "../model/Community.js";
import { Post } from "../model/Post.js";
import { User } from "../model/User.js";
import { Media, MEDIA_PUBLIC_FIELDS } from "../model/Media.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { generateImageHashes } from "../utils/hashUtils.js";
import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs/promises";
import path from "path";
import { emitEvent } from "../utils/features.js";
import { Notification } from "../model/Notification.js";

// Upload Image / Media
export const upload = async (req, res, next) => {
  try {
    const files = req.files || [];
    if (files.length < 1)
      return next(new ErrorHandler("Please upload a file", 401));

    const userId = req.user._id;
    const file = files[0];

    // Hash while uploading; Media must exist before we respond, or createPost can't find it
    const [result, hashes] = await Promise.all([
      uploadFilesToCloudinary(files),
      generateImageHashes(file.buffer),
    ]);

    await Media.create({
      public_id: result[0].public_id,
      url: result[0].url,
      type: "image",
      userId,
      ...hashes,
      width: result[0].width,
      height: result[0].height,
      format: result[0].format,
      blurDataUrl: result[0].blurDataUrl,
      isWaterMarked: false,
    });

    return res.status(200).json({
      success: true,
      public_id: result[0].public_id,
      url: result[0].url,
      width: result[0].width,
      height: result[0].height,
      format: result[0].format,
      blurDataUrl: result[0].blurDataUrl,
      message: "File uploaded successfully.",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Create Post
export const createPost = async (req, res, next) => {
  try {
    const { description, public_id, isArt, community } = req.body;
    const userId = req.user._id;

    // Ensure at least one of description or media is present
    if (!description && !public_id) {
      return next(
        new ErrorHandler(
          "Post must have either a description or a media file.",
          400
        )
      );
    }

    const media = public_id ? await Media.findOne({ public_id }) : null;
    if (public_id && !media)
      return next(new ErrorHandler("Uploaded media not found", 404));
    if (media?.userId && media.userId.toString() !== userId.toString())
      return next(new ErrorHandler("You can only post media you uploaded", 403));

    // Posting into a community requires it to exist and the author to be a member
    const communityId = community ? community : null;
    if (communityId) {
      if (!mongoose.isValidObjectId(communityId))
        return next(new ErrorHandler("Invalid community", 400));
      const isMember = await Community.exists({
        _id: communityId,
        members: userId,
      });
      if (!isMember)
        return next(
          new ErrorHandler("Join this community before posting in it", 403)
        );
    }

    const post = new Post({
      author: userId,
      description: description || "",
      ...(media && { media: media._id }),
      isArt,
      community: communityId,
    });

    await post.save();

    await User.findByIdAndUpdate(userId, { $push: { posts: post._id } });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      postId: post._id,
    });
  } catch (err) {
    next(err);
  }
};

// Get All Posts
export const getAllPosts = async (req, res, next) => {
  try {
    const { following, isArt } = req.query;
    console.log(req.params);
    const query = {};
    if (isArt === "true") query.isArt = true;
    let posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", "userName profilePic")
      .populate({
        path: "comments",
        populate: { path: "author", select: "userName profilePic" },
      })
      .populate("media", MEDIA_PUBLIC_FIELDS);

    if (following === "true") {
      const user = await User.findById(req.user._id).populate("following");
      const followingIds = user.following.map((f) => f._id.toString());
      posts = posts.filter((p) =>
        followingIds.includes(p.author._id.toString())
      );
    }

    return res.status(200).json({
      success: true,
      message: "Posts fetch successfully",
      posts,
    });
  } catch (err) {
    next(err);
  }
};

// Get Post by ID
export const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("author", "userName profilePic")
      .populate({
        path: "comments",
        populate: { path: "author", select: "name userName profilePic" },
      })
      .populate("media", MEDIA_PUBLIC_FIELDS);

    if (!post) return next(new ErrorHandler("Post not found", 404));

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// Delete Post
export const deletePost = async (req, res, next) => {
  try {
    console.log("inside delete post");
    const { postId } = req.params;
    const { isStolen } = req.body;
    const post = await Post.findById(postId).populate("media", "public_id");

    if (!post) return next(new ErrorHandler("Post not found", 404));
    console.log("post.author:", post.author, typeof post.author);
    console.log("req.user._id:", req.user._id, typeof req.user._id);

    if (post.author.toString() !== req.user._id.toString() && !isStolen) {
      return next(new ErrorHandler("Not authorized", 403));
    }

    const promises = [];

    if (post.media?.public_id) {
      promises.push(cloudinary.uploader.destroy(post.media.public_id));
    }

    if (post.media?._id) {
      promises.push(Media.findByIdAndDelete(post.media._id));
    }

    promises.push(
      User.findByIdAndUpdate(post.author, { $pull: { posts: postId } })
    );

    promises.push(
      User.updateMany({ likedPosts: postId }, { $pull: { likedPosts: postId } })
    );

    promises.push(Post.findByIdAndDelete(postId));

    await Promise.all(promises);
    const userToWarn = [post.author._id];

    if (isStolen) {
      const notif = await Notification.create({
        user: post.author._id,
        message:
          "Your post was removed because it contained stolen art. Continued violations may result in a ban.",
        type: "warning",
      });
      emitEvent(req, "warning", userToWarn, notif);
    }

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// Like Post
export const likePost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return next(new ErrorHandler("Post not Found", 404));
    if (post.likes.includes(userId)) {
      return next(new ErrorHandler("Already Liked", 400));
    }

    post.likes.push(userId);
    user.likedPosts.push(post._id);
    await post.save();
    await user.save();

    return res.json({ msg: "Post liked", likes: post.likes.length });
  } catch (err) {
    next(err);
  }
};

// Unlike Post
export const unlikePost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { postId } = req.body;

    const post = await Post.findById(postId);
    const user = await User.findById(userId);
    if (!post) return next(new ErrorHandler("Post not Found", 404));

    if (!post.likes.includes(userId)) {
      return res.status(400).json({ msg: "You haven't liked this post" });
    }

    post.likes = post.likes.filter(
      (uid) => uid.toString() !== userId.toString()
    );

    user.likedPosts = user.likedPosts.filter((p) => p.toString() !== post._id);
    await post.save();
    await user.save();
    console.log("Unliked");

    return res.json({ msg: "Post unliked", likes: post.likes.length });
  } catch (err) {
    next(err);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    const userId = req.body;
    const userPosts = await Post.find({ author: userId })
      .populate("author", "userName name profilePic")
      .populate("media", MEDIA_PUBLIC_FIELDS);

    return res.status(200).json({
      success: true,
      myPosts: userPosts,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
