import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  followUser,
  getAllLikedPosts,
  getMyProfile,
  getUserProfile,
  unfollowUser,
  updateProfile,
} from "../controllers/user.controller.js";
import { singleProfile } from "../middleware/multer.middleware.js";

const router = express.Router();

// User Routes
router.use(authMiddleware);
router.get("/me", getMyProfile);
router.get("/getLikedPosts", getAllLikedPosts);
router.get("/:userName", getUserProfile); // Show User Profile (my/others)
router.post("/follow", followUser);
router.post("/unfollow", unfollowUser);
router.put("/me", singleProfile, updateProfile);

// You can later add follow/unfollow here

export default router;
