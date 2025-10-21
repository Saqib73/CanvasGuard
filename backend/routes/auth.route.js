import express from "express";
import { signup, login, logout } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Auth Routes
router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", authMiddleware, logout);

export default router;
