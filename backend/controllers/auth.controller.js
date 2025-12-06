import { User } from "../model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  cookieOptions,
  generateTokenAndCookie,
} from "../utils/generateToken.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { ArtistProfile } from "../model/ArtistProfile.js";
import { uploadFilesToCloudinary } from "../features/uploadFilesToCoudinary.js";
import { UserOTPVerification } from "../model/UserOTPVerification.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: `${process.env.EMAIL_USER}`,
    pass: `${process.env.EMAIL_PASS}`,
  },
});

export const sendMail = async ({ _id, email }, res) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(_id, email);

    const mailOptions = {
      from: `"CanvasGuard" <RAAINA WHALLA>`,
      to: `${email}`,
      subject: "Veirfy your email",
      html: `<p>OTP for verification of your email that you used to signup with canvasguard is: ${otp}</p>`,
    };

    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);

    const newOTPVerification = new UserOTPVerification({
      userId: _id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    await newOTPVerification.save();

    await transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
        throw new Error(err.message);
      } else {
        return info;
      }
    });

    return res.json({
      success: true,
      status: "PENDING",
      message: "Verification otp mail sent",
      data: {
        userId: _id,
        email,
      },
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      error: error.message,
    });
  }
};

// Signup
export const signup = async (req, res, next) => {
  try {
    const { name, userName, password, confirmPassword, email, bio, isArtist } =
      req.body;

    let user = await User.findOne({ userName });

    if (user) {
      if (user.verified)
        return next(new ErrorHandler("User already exists", 400));
      else {
        console.log(user);
        console.log("inside user exists but not verified");
        await UserOTPVerification.deleteMany({ userId: user._id });
        await sendMail({ _id: user._id, email: user.email }, res);
        return;
      }
    }

    if (password.length < 6)
      return next(new ErrorHandler("password must have at least 6 characters"));
    if (password != confirmPassword)
      return next(new ErrorHandler("Passwords do not match"), 400);

    if (bio == "") {
      bio = "New User";
    }

    const file = req.file;

    if (!file || file.length < 1)
      return next(new ErrorHandler("please upload profile", 400));
    const result = await uploadFilesToCloudinary([file]);

    const profilePic = {
      public_id: result[0].public_id,
      url: result[0].url,
    };
    const existing = await User.findOne({ userName });
    console.log(existing);
    if (existing) return next(new ErrorHandler("Username already exists", 400));

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      userName,
      password: hashedPassword,
      email,
      bio,
      profilePic,
      isArtist,
      verified: false,
    });

    await user.save().then((result) => {
      console.log(result);
      sendMail(result, res);
    });
    // generateTokenAndCookie(user, res, "User Created");
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName });

    const match = await bcrypt.compare(password, user?.password || "");
    if (!user || !match)
      return next(new ErrorHandler("Invalid Credentials", 400));

    generateTokenAndCookie(user, res, `Welcome back ${user.name}`);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  return res
    .cookie("jwt", "", { ...cookieOptions, maxAge: 0 })
    .status(200)
    .json({
      success: true,
      message: "Logged out successfulyy!",
    });
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    console.log(userId, otp);

    if (!userId || !otp)
      return next(new ErrorHandler("Empty details are not allowed", 400));

    //get all records(could be multiple)
    const UserOTPVerficationRecords = await UserOTPVerification.find({
      userId,
    });

    if (UserOTPVerficationRecords.length < 1)
      return next(
        new ErrorHandler(
          "Account does not exist or has been verified already. Please Signup or lagin again"
        )
      );
    else {
      const { expiresAt } = UserOTPVerficationRecords[0];
      const hashedOTP = UserOTPVerficationRecords[0].otp;

      if (Date.now() > expiresAt) {
        await UserOTPVerification.deleteMany({ userId });
        return next(new ErrorHandler("OTP has expired. Please request again."));
      } else {
        const validOTP = await bcrypt.compare(otp, hashedOTP);

        if (!validOTP) return next(new ErrorHandler("Invalid OTP"));

        await Promise.all([
          await User.updateMany({ _id: userId }, { verified: true }),
          await UserOTPVerification.deleteMany({ userId }),
        ]);

        const activatedUser = await User.findById(userId);
        console.log("just before generate token");
        // await User.updateMany({ _id: userId }, { verified: true });
        // await UserOTPVerification.deleteMany({ userId });

        generateTokenAndCookie(activatedUser, res, "User VERIFIED");
      }
    }
  } catch (error) {
    next(error);
  }
};

export const setupArtistProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const { artStyles, baseFee, bio, samples } = req.body;

    const artistProfile = await ArtistProfile.create({
      user: userId,
      artStyles,
      baseFee,
      bio,
      samples,
    });

    user.artistProfile = artistProfile._id;
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Signed Up!",
      user,
    });
  } catch (err) {
    next(err);
  }
};
