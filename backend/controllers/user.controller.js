import { User } from "../model/User.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

export const getUserProfile = async (req, res, next) => {
  try {
    console.log("inside user profile");
    const userName = req.params;
    const user = await User.findOne(userName)
      .populate({
        path: "posts",
        populate: [
          {
            path: "author",
            select: "userName name profilePic",
          },
          {
            path: "media",
            select: "url",
          },
        ],
      })
      .populate("followers", "userName")
      .populate("following", "userName");

    if (!user) return res.status(404).json({ msg: "User not found" });

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    // const userName = req.params;
    const user = await User.findById(req.user._id)
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
            select: "url",
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
