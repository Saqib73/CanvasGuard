import { Post } from "../model/Post.js";
import { User } from "../model/User.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

// Create Post
export const createPost = async (req, res, next) => {
  try {
    const { description, type, url, public_id, isArt, isWatermarked } =
      req.body;
    const userId = req.userId;

    // Ensure at least one of description or media is present
    if (!description && !url) {
      return next(
        new ErrorHandler(
          "Post must have either a description or a media file.",
          400
        )
      );
    }

    const media = url
      ? { isWatermarked, public_id, url, type, isArt }
      : undefined;

    const post = new Post({
      author: userId,
      description: description || "",
      ...(media && { media }),
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
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", "userName profilePic")
      .populate({
        path: "comments",
        populate: { path: "author", select: "userName profilePic" },
      });

    return res.status(200).json({
      success: true,
      message: "Posts fetch sucessfully",
      posts,
    });
  } catch (err) {
    next(err);
  }
};

// Get Post by ID
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "userName profilePic")
      .populate({
        path: "comments",
        populate: { path: "author", select: "userName profilePic" },
      });

    if (!post) return next(new ErrorHandler("Post not found", 404));

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    await Post.findByIdAndDelete(postId);
    return res.json({ msg: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Like Post
export const likePost = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.body; // postId

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (post.likes.includes(userId)) {
      return res.status(400).json({ msg: "Already liked" });
    }

    post.likes.push(userId);
    await post.save();

    return res.json({ msg: "Post liked", likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unlike Post
export const unlikePost = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (!post.likes.includes(userId)) {
      return res.status(400).json({ msg: "You haven't liked this post" });
    }

    post.likes = post.likes.filter((uid) => uid.toString() !== userId);
    await post.save();

    return res.json({ msg: "Post unliked", likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
