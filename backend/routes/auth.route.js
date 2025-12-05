import express from "express";
import {
  signup,
  login,
  logout,
  setupArtistProfile,
  verifyOTP,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { singleProfile } from "../middleware/multer.middleware.js";

const router = express.Router();

// Auth Routes
router.post("/signup", singleProfile, signup);
router.post("/login", login);
router.get("/logout", authMiddleware, logout);
router.post("/artistProfile", authMiddleware, setupArtistProfile);
router.post("/verify", verifyOTP);

export default router;
