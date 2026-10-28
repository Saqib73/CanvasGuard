import mongoose from "mongoose";
import { uploadFilesToCloudinary } from "../features/uploadFilesToCoudinary.js";
import { Community } from "../model/Community.js";
import { MEDIA_PUBLIC_FIELDS } from "../model/Media.js";
import { PUBLISHED, Post } from "../model/Post.js";
import { User } from "../model/User.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

const AUTHOR_FIELDS = "userName name profilePic";

// Community feed posts with only client-safe media fields
const findCommunityPosts = (filter) =>
  Post.find({ ...filter, ...PUBLISHED })
    .sort({ createdAt: -1 })
    .populate("author", AUTHOR_FIELDS)
    .populate("community", "name coverArt")
    .populate("media", MEDIA_PUBLIC_FIELDS);

// Same limits as the create form
const LIMITS = { name: 50, description: 300, rules: 1000 };

// Create a new community
export const createCommunity = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const description = req.body.description?.trim();
    const rules = req.body.rules?.trim() || "";
    const files = req.files || [];

    // Validate before uploading so failures don't leave orphaned images
    if (!name || !description)
      return next(new ErrorHandler("Name and description are required", 400));
    if (name.length > LIMITS.name)
      return next(new ErrorHandler(`Name can be at most ${LIMITS.name} characters`, 400));
    if (description.length > LIMITS.description)
      return next(new ErrorHandler(`Description can be at most ${LIMITS.description} characters`, 400));
    if (rules.length > LIMITS.rules)
      return next(new ErrorHandler(`Rules can be at most ${LIMITS.rules} characters`, 400));
    if (files.length < 1)
      return next(new ErrorHandler("Please upload a cover image", 400));
    if (!files[0].mimetype?.startsWith("image/"))
      return next(new ErrorHandler("The cover must be an image", 400));

    const nameTaken = await Community.exists({
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
    if (nameTaken)
      return next(new ErrorHandler("A community with this name already exists", 409));

    const result = await uploadFilesToCloudinary(files);

    const coverArt = {
      public_id: result[0].public_id,
      url: result[0].url,
      width: result[0].width,
      height: result[0].height,
      blurDataUrl: result[0].blurDataUrl,
    };
    const createdBy = req.user._id;

    const community = await Community.create({
      name,
      coverArt,
      rules,
      createdBy,
      members: [createdBy],
      description,
    });

    await User.updateOne(
      { _id: createdBy },
      { $addToSet: { communities: community._id } }
    );

    return res.status(201).json({
      success: true,
      message: "Community Created!",
      community,
    });
  } catch (err) {
    // Lost a race with another request creating the same name
    if (err?.code === 11000)
      return next(new ErrorHandler("A community with this name already exists", 409));
    next(err);
  }
};

export const joinCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(id))
      return next(new ErrorHandler("Invalid community id", 400));

    // Atomic: only matches if the user isn't already a member
    const result = await Community.updateOne(
      { _id: id, members: { $ne: userId } },
      { $addToSet: { members: userId } }
    );

    if (result.matchedCount === 0) {
      const exists = await Community.exists({ _id: id });
      return next(
        exists
          ? new ErrorHandler("Already a member", 400)
          : new ErrorHandler("Community not found", 404)
      );
    }

    await User.updateOne({ _id: userId }, { $addToSet: { communities: id } });

    res.status(200).json({ success: true, message: "Joined community successfully" });
  } catch (err) {
    next(err);
  }
};

export const leaveCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(id))
      return next(new ErrorHandler("Invalid community id", 400));

    const community = await Community.findById(id).select("createdBy members").lean();
    if (!community) return next(new ErrorHandler("Community not found", 404));

    if (community.createdBy?.toString() === userId.toString())
      return next(
        new ErrorHandler("The creator can't leave their own community", 400)
      );

    const result = await Community.updateOne(
      { _id: id, members: userId },
      { $pull: { members: userId } }
    );
    if (result.matchedCount === 0)
      return next(new ErrorHandler("You are not a member", 400));

    await User.updateOne({ _id: userId }, { $pull: { communities: id } });

    res.status(200).json({ success: true, message: "Left community successfully" });
  } catch (err) {
    next(err);
  }
};

export const getAllCommunities = async (req, res, next) => {
  try {
    const communities = await Community.find()
      .populate("createdBy", AUTHOR_FIELDS)
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

    if (!mongoose.isValidObjectId(communityId))
      return next(new ErrorHandler("Invalid community id", 400));

    const community = await Community.findById(communityId)
      .populate("createdBy", AUTHOR_FIELDS)
      .populate("members", AUTHOR_FIELDS)
      .lean();

    if (!community) return next(new ErrorHandler("Community Not Found", 404));

    // Posts are linked by Post.community, the single source of truth
    const posts = await findCommunityPosts({ community: community._id });

    return res.status(200).json({
      success: true,
      community: { ...community, posts },
    });
  } catch (err) {
    next(err);
  }
};

// Lightweight list for the communities strip; posts come from the feeds
export const getMyCommunities = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const communities = await Community.find({ members: userId })
      .populate("createdBy", AUTHOR_FIELDS)
      .select("name description coverArt members createdBy");

    res.status(200).json({ success: true, communities });
  } catch (err) {
    next(err);
  }
};

export const getHomeFeed = async (req, res, next) => {
  try {
    const communityIds = await Community.find({
      members: req.user._id,
    }).distinct("_id");

    // only posts inside joined communities
    const posts = await findCommunityPosts({ community: { $in: communityIds } });

    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};

export const getExploreFeed = async (req, res, next) => {
  try {
    // only posts that belong to communities
    const posts = await findCommunityPosts({ community: { $ne: null } });

    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};
