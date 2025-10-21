import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  addComment,
  deleteComment,
  likeComment,
  unlikeComment,
} from "../controllers/comment.controller.js";

const router = express.Router();

// Comment Routes
router.use(authMiddleware);
router.post("/", addComment); // Add Comment
router.delete("/:id", deleteComment); // Delete Comment
router.post("/:id/like", likeComment); // Like Comment
router.post("/:id/unlike", unlikeComment); // Unlike Comment

export default router;
