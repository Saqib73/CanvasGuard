import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getArtists } from "../controllers/commission.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/get", getArtists);

export default router;
