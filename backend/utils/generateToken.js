import jwt from "jsonwebtoken";

const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, in milliseconds
  httpOnly: true, //prevent XXS attacks--> cross-side scripting attacks
  sameSite: "none", //CSRF attacks--> cross-site request frogery attacks
  secure: true,
};

// Never send the password hash to the client
const toPublicUser = (user) => {
  const obj = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

// The token carries only the user id; everything else is looked up per request
const generateTokenAndCookie = (user, res, message) => {
  const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return res.cookie("jwt", token, cookieOptions).json({
    success: true,
    user: toPublicUser(user),
    message,
  });
};

export { generateTokenAndCookie, cookieOptions, toPublicUser };
