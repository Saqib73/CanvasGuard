import { Community } from "../model/Community.js";
import { User } from "../model/User.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

// Create a new community
export const createCommunity = async (req, res, next) => {
  try {
    const { name, coverArt, rules, description } = req.body;
    const createdBy = req.user._id;
    const user = User.findById(createdBy);

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
