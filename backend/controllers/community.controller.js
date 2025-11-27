import { uploadFilesToCloudinary } from "../features/uploadFilesToCoudinary.js";
import { Community } from "../model/Community.js";
import { Post } from "../model/Post.js";
import { User } from "../model/User.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

// Create a new community
export const createCommunity = async (req, res, next) => {
  try {
    const { name, rules, description } = req.body;

    const file = req.files;
    console.log("file-->", file);

    if (!file) return new ErrorHandler("please upload profile", 403);
    const result = await uploadFilesToCloudinary(file);

    const coverArt = {
      public_id: result[0].public_id,
      url: result[0].url,
    };
    const createdBy = req.user._id;
    const user = await User.findById(createdBy);

    const community = new Community({
      name,
      coverArt,
      rules,
      createdBy,
      members: [createdBy],
      description,
    });

    await community.save();
    user.communities.push(community._id);

    await user.save();
    return res.status(201).json({
      success: true,
      message: "Community Created!",
      community,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// Join or leave community
export const joinCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(communityId);
    const user = await User.findById(userId);

    if (!community || !user)
      return res.status(404).json({ message: "Community or User not found" });

    if (community.members.includes(userId))
      return res.status(400).json({ message: "Already a member" });

    community.members.push(userId);
    user.communities.push(communityId);

    await Promise.all([community.save(), user.save()]);

    res.status(200).json({ message: "Joined community successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const leaveCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(communityId);
    const user = await User.findById(userId);

    if (!community || !user)
      return res.status(404).json({ message: "Community or User not found" });

    if (!community.members.includes(userId))
      return res.status(400).json({ message: "You are not a member" });

    community.members.pull(userId);
    user.communities.pull(communityId);

    await Promise.all([community.save(), user.save()]);

    res.status(200).json({ message: "Left community successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllCommunities = async (req, res, next) => {
  try {
    const communities = await Community.find()
      .populate("createdBy", "userName name profilePic")
      .select("name coverArt members createdBy");
    return res.status(200).json({
      success: true,
      communities,
    });
  } catch (err) {
    next(err);
  }
};

export const getCommunity = async (req, res, next) => {
  try {
    const { communityId } = req.params;

    const community = await Community.findById(communityId)
      .populate("createdBy", "userName name profilePic")
      .populate("members", "userName name profilePic")
      .populate({
        path: "posts",
        populate: { path: "author", select: "userName name profilePic" },
      });

    if (!community) return next(new ErrorHandler("Community Not Found", 404));

    return res.status(200).json({
      success: true,
      community,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyCommunities = async (req, res) => {
  try {
    const userId = req.user._id;

    const communities = await Community.find({ members: userId })
      .populate("createdBy", "name userName profilePic")
      .populate({
        path: "members",
        select: "name userName profilePic",
      })
      .populate({
        path: "posts",
        populate: [
          { path: "author", select: "name userName profilePic" },
          { path: "media" }, // media contains url, public_id
          {
            path: "comments",
            populate: { path: "author", select: "name userName profilePic" },
          },
        ],
      });

    res.status(200).json({ success: true, communities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getHomeFeed = async (req, res) => {
  const userId = req.user._id;

  const userCommunities = await Community.find({
    members: userId,
  }).select("_id");

  const posts = await Post.find({
    community: { $in: userCommunities }, // only posts inside joined communities
  })
    .sort({ createdAt: -1 })
    .populate("author", "userName name profilePic")
    .populate("community", "name coverArt")
    .populate("media");

  res.json({ success: true, posts });
};

export const getExploreFeed = async (req, res) => {
  const posts = await Post.find({
    community: { $ne: null }, // only posts that belong to communities
  })
    .sort({ createdAt: -1 })
    .populate("author", "userName name profilePic")
    .populate("community", "name coverArt")
    .populate("media");

  res.json({ success: true, posts });
};
