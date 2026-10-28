import mongoose from "mongoose";
import { uploadFilesToCloudinary } from "../features/uploadFilesToCoudinary.js";
import { Community } from "../model/Community.js";
import { LICENSE_OPTIONS, PUBLISHED, Post } from "../model/Post.js";
import { User } from "../model/User.js";
import { Comment } from "../model/Comment.js";
import { ArtistProfile } from "../model/ArtistProfile.js";
import { checkOwnership } from "../services/watermark.service.js";
import { enqueueWatermark } from "../services/watermarkQueue.js";
import { extractHashtags, normalizeTag } from "../utils/hashtags.js";
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

const parseBool = (value) => value === true || value === "true";

// FormData sends repeated fields as an array, a single one as a string
const parseList = (value) =>
  Array.isArray(value) ? value : typeof value === "string" && value ? value.split(",") : [];

const removeUploadedImage = async (publicId, mediaId) => {
  await Promise.allSettled([
    cloudinary.uploader.destroy(publicId),
    mediaId && Media.deleteOne({ _id: mediaId }),
  ]);
};

// Create Post: text, an image (multipart "files"), or both. When the author asks
// for a watermark, the post is saved as "processing" and watermarked in the background.
export const createPost = async (req, res, next) => {
  const userId = req.user._id;
  const file = req.files?.[0];
  // Set once this request has uploaded an image, so a failure can clean it up
  let uploaded = null;

  try {
    const description = (req.body.description || "").trim();
    const { public_id } = req.body;
    const isArt = parseBool(req.body.isArt);
    // Watermarks and usage labels only apply to the author's own artwork
    const wantsWatermark = isArt && parseBool(req.body.watermark);
    const license = isArt ? [...new Set(parseList(req.body.license))] : [];

    if (!description && !file && !public_id)
      return next(new ErrorHandler("Write something or add an image.", 400));
    if (file && !file.mimetype?.startsWith("image/"))
      return next(new ErrorHandler("Only images can be posted.", 400));
    if (license.some((l) => !LICENSE_OPTIONS.includes(l)))
      return next(new ErrorHandler("Unknown usage label.", 400));

    // Posting into a community requires it to exist and the author to be a member
    const communityId = req.body.community || null;
    if (communityId) {
      if (!mongoose.isValidObjectId(communityId))
        return next(new ErrorHandler("Invalid community", 400));
      const isMember = await Community.exists({ _id: communityId, members: userId });
      if (!isMember)
        return next(new ErrorHandler("Join this community before posting in it", 403));
    }

    // Validation is done, so only now upload the image
    let media = null;
    if (file) {
      const [[result], hashes] = await Promise.all([
        uploadFilesToCloudinary([file]),
        generateImageHashes(file.buffer),
      ]);
      uploaded = { publicId: result.public_id };
      media = await Media.create({
        public_id: result.public_id,
        url: result.url,
        type: "image",
        userId,
        ...hashes,
        width: result.width,
        height: result.height,
        format: result.format,
        blurDataUrl: result.blurDataUrl,
        isWaterMarked: false,
      });
      uploaded.mediaId = media._id;
    } else if (public_id) {
      // Older two-step flow: the image was uploaded through /posts/upload first
      media = await Media.findOne({ public_id, deletedAt: null });
      if (!media) return next(new ErrorHandler("Uploaded media not found", 404));
      if (media.userId && media.userId.toString() !== userId.toString())
        return next(new ErrorHandler("You can only post media you uploaded", 403));
    }

    const status =
      media && wantsWatermark && !media.isWaterMarked ? "processing" : "published";
    const tags = extractHashtags(description);

    const post = await Post.create({
      author: userId,
      description,
      ...(media && { media: media._id }),
      isArt,
      community: communityId,
      status,
      ...(tags.length && { tags }),
      ...(license.length && { license }),
    });
    uploaded = null; // the post owns the image now

    await User.findByIdAndUpdate(userId, { $push: { posts: post._id } });
    if (status === "processing") enqueueWatermark(post._id);

    return res.status(201).json({
      success: true,
      message:
        status === "processing"
          ? "Posted! Adding your watermark before it goes live."
          : "Post created successfully",
      postId: post._id,
      status,
    });
  } catch (err) {
    if (uploaded) await removeUploadedImage(uploaded.publicId, uploaded.mediaId);
    next(err);
  }
};

// Get All Posts (?isArt=true, ?following=true, ?tag=watercolor)
export const getAllPosts = async (req, res, next) => {
  try {
    const { following, isArt, tag } = req.query;
    const query = { ...PUBLISHED };
    if (isArt === "true") query.isArt = true;
    const tagName = normalizeTag(tag);
    if (tagName) query.tags = tagName;
    // Filter in the query, not after limit(), so older followed posts aren't cut off
    if (following === "true") query.author = { $in: req.user.following };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", "userName profilePic")
      .populate({
        path: "comments",
        populate: { path: "author", select: "userName profilePic" },
      })
      .populate("media", MEDIA_PUBLIC_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Posts fetch successfully",
      posts,
    });
  } catch (err) {
    next(err);
  }
};

// Get Post by ID (a post that's still being watermarked is visible to its author only)
export const getPost = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.postId))
      return next(new ErrorHandler("Post not found", 404));

    const post = await Post.findById(req.params.postId)
      .populate("author", "userName profilePic")
      .populate({
        path: "comments",
        populate: { path: "author", select: "name userName profilePic" },
      })
      .populate("media", MEDIA_PUBLIC_FIELDS);

    const isAuthor = post?.author?._id.equals(req.user._id);
    if (!post || (post.status === "processing" && !isAuthor))
      return next(new ErrorHandler("Post not found", 404));

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

// Delete Post: by its author, or by the original artist once the server itself has
// verified the theft (the client's word is never trusted for that)
export const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id.toString();
    if (!mongoose.isValidObjectId(postId))
      return next(new ErrorHandler("Post not found", 404));

    const post = await Post.findById(postId).populate("media");
    if (!post) return next(new ErrorHandler("Post not found", 404));

    let isStolen = false;
    if (post.author.toString() !== userId) {
      const result = post.media ? await checkOwnership(post, userId) : null;
      if (!result?.isStolen)
        return next(
          new ErrorHandler(
            "Only the author can delete this post, or the original artist after a verified theft report.",
            403
          )
        );
      isStolen = true;
    }

    const commentIds = post.comments;
    const promises = [
      Comment.deleteMany({ postId: post._id }),
      User.updateMany(
        { comments: { $in: commentIds } },
        { $pull: { comments: { $in: commentIds } } }
      ),
      User.findByIdAndUpdate(post.author, { $pull: { posts: post._id } }),
      User.updateMany({ likedPosts: post._id }, { $pull: { likedPosts: post._id } }),
      ArtistProfile.updateMany({ portfolio: post._id }, { $pull: { portfolio: post._id } }),
      Post.findByIdAndDelete(post._id),
    ];

    if (post.media) {
      promises.push(
        cloudinary.uploader
          .destroy(post.media.public_id)
          .catch((err) => console.warn("Failed to delete image:", err.message)),
        // A stolen copy is evidence of nothing, so it goes entirely. The artist's own
        // image keeps its hashes, so copies posted earlier can still be traced to them.
        isStolen
          ? Media.deleteOne({ _id: post.media._id })
          : Media.updateOne({ _id: post.media._id }, { deletedAt: new Date() })
      );
    }

    await Promise.all(promises);

    if (isStolen) {
      const notif = await Notification.create({
        user: post.author,
        message:
          "Your post was removed because it contained stolen art. Continued violations may result in a ban.",
        type: "warning",
      });
      emitEvent(req, "warning", [post.author], notif);
    }

    return res.status(200).json({
      success: true,
      message: isStolen ? "The stolen post was removed." : "Post deleted successfully",
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
