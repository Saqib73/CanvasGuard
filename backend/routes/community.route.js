import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  createCommunity,
  getAllCommunities,
  getCommunity,
  getExploreFeed,
  getHomeFeed,
  getMyCommunities,
  joinCommunity,
  leaveCommunity,
} from "../controllers/community.controller.js";
import { attachMentUpload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/all", getAllCommunities);
router.post("/create", attachMentUpload, createCommunity);
router.get("/my", getMyCommunities);
router.get("/feed/home", getHomeFeed);
router.get("/feed/explore", getExploreFeed);
router.get("/:communityId", getCommunity);
router.post("/join/:id", joinCommunity);
router.post("/join/:id", leaveCommunity);

export default router;
