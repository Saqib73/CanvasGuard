import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
  likePost,
  unlikePost,
} from "../controllers/post.controller.js";

const router = express.Router();

// Post Routes
router.use(authMiddleware);
router.post("/", createPost); // Create Post
router.get("/", getAllPosts); // Get All Posts
router.get("/:id", getPost); // Get Post by ID
router.delete("/:id", deletePost); // Delete Post
router.post("/:id/like", likePost); // Like Post
router.post("/:id/unlike", unlikePost); // Unlike Post

export default router;
