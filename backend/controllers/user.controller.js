import { User } from "../model/User.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

export const getUserProfile = async (req, res, next) => {
  try {
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
    const userId = req.userId; // logged-in user
    const targetId = req.params.id; // user to follow

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
      msg: "User followed successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unfollow User
export const unfollowUser = async (req, res) => {
  try {
    const userId = req.userId;
    const targetId = req.params.id;

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) return next(new ErrorHandler("User Not Found", 404));

    if (!user.following.includes(targetId)) {
      return next(new ErrorHandler("You are not following this user", 400));
    }

    user.following = user.following.filter(
      (uid) => uid.toString() !== targetId
    );
    targetUser.followers = targetUser.followers.filter(
      (uid) => uid.toString() !== userId
    );

    await user.save();
    await targetUser.save();

    return res.staus(200).json({
      success: true,
      msg: "User unfollowed successfully",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
