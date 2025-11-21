import { User } from "../model/User.js";
import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/ErrorHandler.js";

const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);

    const authToken = socket.request.cookies["jwt"];

    if (!authToken) return next(new ErrorHandler("No token provided", 401));

    const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);

    const user = await User.findById(decodedData.userId);

    if (!user)
      return next(new ErrorHandler("Please login to access this route", 401));

    socket.user = user;

    return next();
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Please login to access this route", 401));
    // throw new Error("Please login to access this route")
  }
};

export { socketAuthenticator };
