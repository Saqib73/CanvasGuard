import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getAllLikedPosts,
  getMyProfile,
  getUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

// User Routes
router.use(authMiddleware);
router.get("/me", getMyProfile);
router.get("/getLikedPosts", getAllLikedPosts);
router.get("/:userName", getUserProfile); // Show User Profile (my/others)

// You can later add follow/unfollow here

export default router;
