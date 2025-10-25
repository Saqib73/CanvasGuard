import jwt from "jsonwebtoken";

const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000, //millisecond(15days)
  httpOnly: true, //prevent XXS attacks--> cross-side scripting attacks
  sameSite: "none", //CSRF attacks--> cross-site request frogery attacks
  secure: true,
};

const generateTokenAndCookie = (userId, res, message) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return res.cookie("jwt", token, cookieOptions).json({
    success: true,
    userId,
    message,
  });
};

export { generateTokenAndCookie, cookieOptions };
