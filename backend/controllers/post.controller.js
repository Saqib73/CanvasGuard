import { uploadFilesToCloudinary } from "../features/uploadFilesToCoudinary.js";
import { Post } from "../model/Post.js";
import { User } from "../model/User.js";
import { Media } from "../model/Media.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { generateImageHashes } from "../utils/hashUtils.js";
import * as fs from "fs/promises";
// import { fsync } from "fs";
import path from "path";

// export const upload = async (req, res, next) => {
//   try {
//     console.log(req.files);
//     const file = req.files || [];
//     if (file.length < 1)
//       return next(new ErrorHandler("Please upload a file", 401));
//     console.log("file", file);

//     const result = await uploadFilesToCloudinary(file);

//     return res.status(200).json({
//       success: true,
//       public_id: result[0].public_id,
//       url: result[0].url,
//     });
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// };

// Create Post

export const upload = async (req, res, next) => {
  try {
    const files = req.files || [];
    if (files.length < 1)
      return next(new ErrorHandler("Please upload a file", 401));

    const userId = req.userId;
    const file = files[0];
    const tempDir = path.join(process.cwd(), "temp");
    await fs.mkdir(tempDir, { recursive: true });

    // Save uploaded buffer to temp file
    const tempPath = path.join(tempDir, `${Date.now()}_${file.originalname}`);
    await fs.writeFile(tempPath, file.buffer);

    // Generate hash from the temp file
    // const newHash = await generateImageHash(tempPath);
    const buffer = await fs.readFile(tempPath);
    const { sha256, phash } = await generateImageHashes(buffer);

    if (!sha256 || !phash) {
      return res.status(500).json({
        success: failed,
        message: "hash generation failed",
      });
    }

    //  Check against existing hashes in DB
    // const existingHashes = await Media.find();
    // for (const existing of existingHashes) {
    //   if (areImagesSimilar(newHash, existing.hash)) {
    //     fs.unlink(tempPath);
    //     return res.status(409).json({
    //       success: false,
    //       message:
    //         "This image already exists or is very similar to another upload.",
    //     });
    //   }
    // }

    // 3️⃣ If unique, upload to Cloudinary
    const result = await uploadFilesToCloudinary(files);

    // Store hash with Cloudinary public_id for quick lookup
    await Media.create({
      public_id: result[0].public_id,
      url: result[0].url,
      type: "image",
      userId,
      sha256,
      phash,
      isWaterMarked: false,
    });

    // Cleanup local file
    await fs.unlink(tempPath);

    return res.status(200).json({
      success: true,
      public_id: result[0].public_id,
      url: result[0].url,
      sha256,
      phash,
      message: "File uploaded successfully.",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { description, public_id } = req.body;
    const userId = req.user._id;

    // Ensure at least one of description or media is present
    if (!description && !url) {
      return next(
        new ErrorHandler(
          "Post must have either a description or a media file.",
          400
        )
      );
    }

    const media = await Media.findOne({ public_id });

    // let newMediaId = undefined;
    // if (media !== undefined) {
    //   const newMedia = new Media(media);
    //   await newMedia.save();
    //   newMediaId = newMedia._id;
    // }

    const post = new Post({
      author: userId,
      description: description || "",
      media: media._id,
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
