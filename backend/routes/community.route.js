import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createCommunity,
  getAllCommunities,
  getCommunity,
} from "../controllers/community.controller";

const router = express.Router();

router.use(authMiddleware);
router.get("/all", getAllCommunities);
router.post("/create", createCommunity);
router.get("/:communityId", getCommunity);

export default router;
