import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  acceptCommissionRequest,
  getAllCommissionRequests,
  getArtists,
  sendCommissionRequest,
} from "../controllers/commission.controller.js";
import { attachMentUpload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/get", getArtists);
router.post("/requestCommission", attachMentUpload, sendCommissionRequest);
router.get("/getCommissionReqs", getAllCommissionRequests);
router.post("/confirmCommissionReq/:id", acceptCommissionRequest);

export default router;
