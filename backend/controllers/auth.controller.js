import { User } from "../model/User.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  cookieOptions,
  generateTokenAndCookie,
  toPublicUser,
} from "../utils/generateToken.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { ArtistProfile } from "../model/ArtistProfile.js";
import { uploadFilesToCloudinary } from "../features/uploadFilesToCoudinary.js";
import { UserOTPVerification } from "../model/UserOTPVerification.js";
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  checkOtp,
  hasActiveOtp,
  issueOtp,
  resendCooldownRemaining,
} from "../utils/otp.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactCaseInsensitive = (s) => new RegExp(`^${escapeRegex(s)}$`, "i");

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

// Older accounts may have mixed-case emails stored, so match case-insensitively
const findUserByEmail = (email) =>
  User.findOne({ email: exactCaseInsensitive(normalizeEmail(email)) });

const findUserByUserName = (userName) =>
  User.findOne({ userName: exactCaseInsensitive(String(userName || "").trim()) });

// Shape the client needs to show the "enter your code" step
const pendingVerificationResponse = (res, user, message, status = 200) =>
  res.status(status).json({
    success: status < 400,
    status: "PENDING",
    needsVerification: true,
    message,
    data: {
      userId: user._id,
      email: user.email,
      resendAvailableIn: OTP_RESEND_COOLDOWN_SECONDS,
    },
  });

// Signup
export const signup = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const userName = String(req.body.userName || "").trim();
    const email = normalizeEmail(req.body.email);
    const { password = "", confirmPassword = "" } = req.body;
    const isArtist = req.body.isArtist === true || req.body.isArtist === "true";

    // 1️⃣ Validate input before touching the database or Cloudinary
    if (!name) return next(new ErrorHandler("Please enter your full name", 400));
    if (!USERNAME_RE.test(userName))
      return next(
        new ErrorHandler(
          "Username must be 3–20 characters: letters, numbers, _ or .",
          400
        )
      );
    if (!EMAIL_RE.test(email))
      return next(new ErrorHandler("Please enter a valid email address", 400));
    if (password.length < 6)
      return next(new ErrorHandler("Password must have at least 6 characters", 400));
    if (password !== confirmPassword)
      return next(new ErrorHandler("Passwords do not match", 400));

    // 2️⃣ The email decides which account this is
    const byEmail = await findUserByEmail(email);
    if (byEmail?.verified)
      return next(
        new ErrorHandler("An account with this email already exists. Please log in.", 409)
      );

    const byUserName = await findUserByUserName(userName);
    const userNameHeldByOther =
      byUserName && (!byEmail || !byUserName._id.equals(byEmail._id));

    if (userNameHeldByOther) {
      if (byUserName.verified)
        return next(new ErrorHandler("That username is already taken", 409));

      // An unfinished signup only keeps its username while its code is live,
      // unless it's the same person (same password) changing their email
      const reclaimable =
        !(await hasActiveOtp(byUserName._id)) ||
        (await bcrypt.compare(password, byUserName.password));
      if (!reclaimable)
        return next(new ErrorHandler("That username is already taken", 409));
    }

    // 3️⃣ Profile picture is optional
    let profilePic;
    if (req.file) {
      const [uploaded] = await uploadFilesToCloudinary([req.file]);
      profilePic = {
        public_id: uploaded.public_id,
        url: uploaded.url,
        width: uploaded.width,
        height: uploaded.height,
        blurDataUrl: uploaded.blurDataUrl,
      };
    }

    // 4️⃣ Reuse the unfinished signup if there is one, otherwise create the user
    let user = byEmail || (userNameHeldByOther ? byUserName : null);
    if (byEmail && userNameHeldByOther) {
      // Two unfinished signups collapse into the one that owns this email
      await Promise.all([
        User.deleteOne({ _id: byUserName._id }),
        UserOTPVerification.deleteMany({ userId: byUserName._id }),
      ]);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fields = { name, userName, email, password: hashedPassword, isArtist, verified: false };

    if (user) {
      user.set(fields);
      if (profilePic) user.profilePic = profilePic;
    } else {
      user = new User({ ...fields, ...(profilePic && { profilePic }) });
    }
    await user.save();

    // 5️⃣ Send the code
    await issueOtp(user, "signup");

    return pendingVerificationResponse(
      res,
      user,
      `We sent a 6-digit code to ${user.email}`
    );
  } catch (err) {
    next(err);
  }
};

// Login with email or username
export const login = async (req, res, next) => {
  try {
    // `userName` kept for older clients
    const identifier = String(req.body.identifier ?? req.body.userName ?? "").trim();
    const { password = "" } = req.body;

    if (!identifier || !password)
      return next(new ErrorHandler("Please enter your email/username and password", 400));

    const user = identifier.includes("@")
      ? await findUserByEmail(identifier)
      : await findUserByUserName(identifier);

    const match = await bcrypt.compare(password, user?.password || "");
    if (!user || !match)
      return next(new ErrorHandler("Incorrect email/username or password", 401));

    // Unverified accounts must confirm their email before they can sign in
    if (!user.verified) {
      const wait = await resendCooldownRemaining(user._id);
      if (wait === 0) await issueOtp(user, "login");
      return pendingVerificationResponse(
        res,
        user,
        wait === 0
          ? `Please verify your email first. We sent a code to ${user.email}`
          : `Please verify your email first. Use the code we sent to ${user.email}`,
        403
      );
    }

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
      message: "Logged out successfully!",
    });
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp)
      return next(new ErrorHandler("Please enter the code we emailed you", 400));
    if (!mongoose.isValidObjectId(userId))
      return next(new ErrorHandler("Invalid verification request", 400));

    const user = await User.findById(userId);
    if (!user)
      return next(new ErrorHandler("This signup has expired. Please sign up again.", 404));
    if (user.verified)
      return next(new ErrorHandler("This account is already verified. Please log in.", 409));

    const result = await checkOtp(userId, otp);
    if (!result.ok) return next(new ErrorHandler(result.message, result.statusCode));

    user.verified = true;
    await user.save();

    generateTokenAndCookie(user, res, `Welcome to CanvasGuard, ${user.name}!`);
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!mongoose.isValidObjectId(userId))
      return next(new ErrorHandler("Invalid verification request", 400));

    const user = await User.findById(userId);
    if (!user)
      return next(new ErrorHandler("This signup has expired. Please sign up again.", 404));
    if (user.verified)
      return next(new ErrorHandler("This account is already verified. Please log in.", 409));

    const wait = await resendCooldownRemaining(user._id);
    if (wait > 0)
      return res.status(429).json({
        success: false,
        message: `Please wait ${wait}s before requesting another code`,
        data: { resendAvailableIn: wait },
      });

    await issueOtp(user, "signup");
    return pendingVerificationResponse(res, user, `A new code is on its way to ${user.email}`);
  } catch (err) {
    next(err);
  }
};

export const setupArtistProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const { baseFee, bio, deliveryTime, openForCommission } = req.body;

    if (!user.isArtist)
      return next(new ErrorHandler("Only artist accounts can set up an artist profile", 403));

    // One profile per artist; a second call would orphan the first
    const existing = await ArtistProfile.exists({ user: userId });
    if (existing || user.artistProfile)
      return next(new ErrorHandler("Artist profile already exists", 409));

    const artStyles = (Array.isArray(req.body.artStyles) ? req.body.artStyles : [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 10);
    if (artStyles.length === 0)
      return next(new ErrorHandler("Add at least one art style", 400));

    const fee = Number(baseFee);
    if (!Number.isFinite(fee) || fee < 0)
      return next(new ErrorHandler("Starting price must be 0 or more", 400));

    if (bio && String(bio).length > 200)
      return next(new ErrorHandler("About your work can be at most 200 characters", 400));

    const artistProfile = await ArtistProfile.create({
      user: userId,
      artStyles,
      baseFee: fee,
      bio: bio?.trim(),
      deliveryTime: deliveryTime?.trim() || undefined,
      openForCommission: Boolean(openForCommission),
    });

    user.artistProfile = artistProfile._id;
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Your artist profile is live!",
      user: toPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
};
