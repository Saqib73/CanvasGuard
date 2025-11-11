import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
  likePost,
  unlikePost,
  upload,
  getUserPosts,
} from "../controllers/post.controller.js";
import { attachMentUpload } from "../middleware/multer.middleware.js";
import {
  applyWatermark,
  verifyOwnership,
} from "../controllers/watermark.controller.js";

const router = express.Router();

// Post Routes
router.use(authMiddleware);
router.post("/createPost", createPost); // Create Post
router.get("/", getAllPosts); // Get All Posts
router.get("/getMyPosts", getUserPosts);
router.post("/upload", attachMentUpload, upload);
router.post("/watermark", applyWatermark);
router.post("/verify", verifyOwnership);
router.get("/:postId", getPost); // Get Post by ID
router.delete("/:id", deletePost); // Delete Post
router.post("/like", likePost); // Like Post
router.post("/unlike", unlikePost); // Unlike Post

export default router;
