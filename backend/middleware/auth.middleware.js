import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { User } from "../model/User.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token)
    return next(new ErrorHandler("Unauthporized - No token provided", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return next(new ErrorHandler("Unauthorized - no token provided", 401));
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return next(new ErrorHandler("User not found", 404));

    req.user = user;
    next();
  } catch (err) {
    console.error("Error in auth middleware", err);
    next(err);
  }
};
