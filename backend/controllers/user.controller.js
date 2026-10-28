import { MEDIA_PUBLIC_FIELDS } from "../model/Media.js";
import { PUBLISHED } from "../model/Post.js";
import { uploadFilesToCloudinary } from "../features/uploadFilesToCoudinary.js";
import { Notification } from "../model/Notification.js";
import { User } from "../model/User.js";
import { ArtistProfile } from "../model/ArtistProfile.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (req, res, next) => {
  try {
    console.log("inside user profile");
    const userName = req.params;
    const isSelf = req.user?.userName === userName.userName;
    // Public profile: never expose the password hash or someone else's email
    const user = await User.findOne(userName)
      .select("-password -email")
      .populate({
        path: "posts",
        // Posts still being watermarked are only visible to their author
        ...(!isSelf && { match: PUBLISHED }),
        options: { sort: { createdAt: -1 } },
        populate: [
          {
            path: "author",
            select: "userName name profilePic",
          },
          {
            path: "media",
            select: MEDIA_PUBLIC_FIELDS,
          },
        ],
      })
      .populate("followers", "userName")
      .populate("following", "userName")
      // Public commission details for the artist section on the profile
      .populate(
        "artistProfile",
        "artStyles baseFee deliveryTime openForCommission bio rating"
      );

    if (!user) return res.status(404).json({ msg: "User not found" });

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

const PROFILE_LIMITS = { name: 50, bio: 200 };

// Multipart fields: name, bio (both optional; "" clears the bio), profile (file),
// removePhoto ("true" to go back to the initials placeholder)
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const set = {};

    // Validate everything before uploading, so a rejected request leaves no image behind
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return next(new ErrorHandler("Name can't be empty", 400));
      if (name.length > PROFILE_LIMITS.name)
        return next(new ErrorHandler(`Name can be at most ${PROFILE_LIMITS.name} characters`, 400));
      set.name = name;
    }
    if (req.body.bio !== undefined) {
      const bio = String(req.body.bio).trim();
      if (bio.length > PROFILE_LIMITS.bio)
        return next(new ErrorHandler(`Bio can be at most ${PROFILE_LIMITS.bio} characters`, 400));
      set.bio = bio;
    }
    if (req.file && !req.file.mimetype?.startsWith("image/"))
      return next(new ErrorHandler("Your profile picture must be an image", 400));

    const removePhoto = !req.file && req.body.removePhoto === "true";
    const oldPhotoId = req.user.profilePic?.public_id;

    if (req.file) {
      const [result] = await uploadFilesToCloudinary([req.file]);
      set.profilePic = {
        public_id: result.public_id,
        url: result.url,
        width: result.width,
        height: result.height,
        blurDataUrl: result.blurDataUrl,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: set, ...(removePhoto && { $unset: { profilePic: 1 } }) },
      { new: true }
    ).select("-password");

    // The old picture isn't referenced anywhere once replaced or removed
    if ((req.file || removePhoto) && oldPhotoId) {
      cloudinary.uploader
        .destroy(oldPhotoId)
        .catch((err) => console.warn("Failed to delete old profile picture:", err.message));
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

const ARTIST_LIMITS = { styles: 10, style: 30, deliveryTime: 50, bio: 200 };

// JSON body; every field optional: artStyles, baseFee, deliveryTime, bio, openForCommission
export const updateArtistProfile = async (req, res, next) => {
  try {
    if (!req.user.isArtist)
      return next(new ErrorHandler("Only artist accounts have an artist profile", 403));

    const { artStyles, baseFee, deliveryTime, bio, openForCommission } = req.body;
    const set = {};

    if (artStyles !== undefined) {
      if (!Array.isArray(artStyles))
        return next(new ErrorHandler("Art styles must be a list", 400));
      const styles = [...new Set(artStyles.map((s) => String(s).trim()).filter(Boolean))];
      if (styles.length === 0) return next(new ErrorHandler("Add at least one art style", 400));
      if (styles.length > ARTIST_LIMITS.styles)
        return next(new ErrorHandler(`At most ${ARTIST_LIMITS.styles} art styles`, 400));
      if (styles.some((s) => s.length > ARTIST_LIMITS.style))
        return next(new ErrorHandler(`Art styles can be at most ${ARTIST_LIMITS.style} characters`, 400));
      set.artStyles = styles;
    }
    if (baseFee !== undefined) {
      const fee = Number(baseFee);
      if (!Number.isFinite(fee) || fee < 0)
        return next(new ErrorHandler("Starting price must be 0 or more", 400));
      set.baseFee = fee;
    }
    if (deliveryTime !== undefined) {
      const time = String(deliveryTime).trim();
      if (time.length > ARTIST_LIMITS.deliveryTime)
        return next(new ErrorHandler("Delivery time is too long", 400));
      set.deliveryTime = time;
    }
    if (bio !== undefined) {
      const text = String(bio).trim();
      if (text.length > ARTIST_LIMITS.bio)
        return next(new ErrorHandler(`About your work can be at most ${ARTIST_LIMITS.bio} characters`, 400));
      set.bio = text;
    }
    if (openForCommission !== undefined) {
      if (typeof openForCommission !== "boolean")
        return next(new ErrorHandler("openForCommission must be true or false", 400));
      set.openForCommission = openForCommission;
    }

    const artistProfile = await ArtistProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: set },
      { new: true }
    ).lean();
    if (!artistProfile)
      return next(new ErrorHandler("Set up your artist profile first", 404));

    return res.json({ success: true, message: "Artist profile updated", artistProfile });
  } catch (err) {
    next(err);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    // const userName = req.params;
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("posts")
      .populate("followers", "userName")
      .populate("following", "userName");

    if (!user) return res.status(404).json({ msg: "User not found" });

    return res.json(user);
  } catch (err) {
    next(err);
  }
};

export const followUser = async (req, res, next) => {
  try {
    console.log(req.user);
    const userId = req.user._id; // logged-in user
    const { targetId } = req.body;
    console.log("ids-->", userId, targetId);

    if (userId === targetId) {
      return next(new ErrorHandler("You cannot follow yourself", 400));
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser)
      return next(new ErrorHandler("Target user not found", 404));

    // Already following?
    if (user.following.includes(targetId)) {
      return next(new ErrorHandler("Already following the user", 400));
    }

    user.following.push(targetId);
    targetUser.followers.push(userId);

    await Promise.all([user.save(), targetUser.save()]);

    return res.status(200).json({
      success: true,
      message: "User followed successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

// Unfollow User
export const unfollowUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { targetId } = req.body;

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) return next(new ErrorHandler("User Not Found", 404));

    if (!user.following.includes(targetId)) {
      return next(new ErrorHandler("You are not following this user", 400));
    }

    user.following = user.following.filter(
      (uid) => uid.toString() !== targetId.toString()
    );
    targetUser.followers = targetUser.followers.filter(
      (uid) => uid.toString() !== userId.toString()
    );

    await user.save();
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const getAllLikedPosts = async (req, res, next) => {
  try {
    const allLikedPosts = await User.findById(req.user._id)
      .select("likedPosts")
      .populate({
        path: "likedPosts",
        populate: [
          {
            path: "author",
            select: "name userName profilePic",
          },
          {
            path: "media",
            select: MEDIA_PUBLIC_FIELDS,
          },
        ],
      });
    // .populate("author", "userName name profilePic");

    return res.status(200).json({
      success: true,
      allLikedPosts,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    console.log("Inside notifications", notifications);

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};
