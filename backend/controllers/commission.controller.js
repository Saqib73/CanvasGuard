import mongoose from "mongoose";
import { uploadFilesToCloudinary } from "../features/uploadFilesToCoudinary.js";
import { ArtistProfile } from "../model/ArtistProfile.js";
import { CommissionDetail } from "../model/CommissionDetail.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toNumber = (v) => {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// Requests saved before `status` existed only have isConfirmed
const withStatus = (req) => ({
  ...req,
  status: req.status ?? (req.isConfirmed ? "accepted" : "pending"),
});

// Older requests stored the ArtistProfile id as artistId; match both
const artistIdsFor = (user) =>
  [user._id, user.artistProfile].filter(Boolean);

///artists?open=true&style=anime&minFee=50&maxFee=300&sort=fee_low
export const getArtists = async (req, res, next) => {
  try {
    const { open, style, sort } = req.query;
    const minFee = toNumber(req.query.minFee);
    const maxFee = toNumber(req.query.maxFee);

    const query = {};

    if (open === "true" || open === "false")
      query.openForCommission = open === "true";
    if (style?.trim())
      query.artStyles = { $regex: escapeRegex(style.trim()), $options: "i" };
    if (minFee !== undefined || maxFee !== undefined) {
      query.baseFee = {};
      if (minFee !== undefined) query.baseFee.$gte = minFee;
      if (maxFee !== undefined) query.baseFee.$lte = maxFee;
    }

    // Build the whole query (incl. sort) before awaiting it
    const q = ArtistProfile.find(query).populate({
      path: "user",
      select: "name userName profilePic",
    });

    if (sort === "fee_low") q.sort({ baseFee: 1 });
    else if (sort === "fee_high") q.sort({ baseFee: -1 });
    else if (sort === "newest") q.sort({ createdAt: -1 });

    const artists = await q;
    res.json({
      success: true,
      artists,
    });
  } catch (err) {
    next(err);
  }
};

export const sendCommissionRequest = async (req, res, next) => {
  try {
    const { deadline, artStyle, description, shippingDetails, artistId } =
      req.body;
    const customerId = req.user._id;
    const files = req.files || [];

    // 1️⃣ Validate everything before uploading anything
    if (!artistId || !mongoose.isValidObjectId(artistId))
      return next(new ErrorHandler("Invalid artist", 400));

    // The client links by ArtistProfile id; accept a User id too
    const artistProfile = await ArtistProfile.findOne({
      $or: [{ _id: artistId }, { user: artistId }],
    }).lean();
    if (!artistProfile) return next(new ErrorHandler("Artist not found", 404));

    if (artistProfile.user.toString() === customerId.toString())
      return next(new ErrorHandler("You can't commission yourself", 400));

    const deadlineDate = new Date(deadline);
    if (!deadline || Number.isNaN(deadlineDate.getTime()))
      return next(new ErrorHandler("Please give an idea about deadline", 400));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (deadlineDate < startOfToday)
      return next(new ErrorHandler("Deadline can't be in the past", 400));

    if (!description?.trim())
      return next(
        new ErrorHandler("Please describe the commission you want", 400)
      );

    let parsedShippingDetails;
    try {
      parsedShippingDetails = JSON.parse(shippingDetails || "{}");
    } catch {
      return next(new ErrorHandler("Invalid shipping details", 400));
    }
    const { country, state, postal, city } = parsedShippingDetails;
    if (!country?.trim() || !state?.trim() || !String(postal ?? "").trim())
      return next(
        new ErrorHandler("Please provide necessary shipping details", 400)
      );

    // 2️⃣ Upload the reference image only once the request is valid
    let refrences;
    if (files.length > 0) {
      const result = await uploadFilesToCloudinary(files);
      refrences = {
        public_id: result[0].public_id,
        url: result[0].url,
      };
    }

    const request = await CommissionDetail.create({
      deadline: deadlineDate,
      artStyle,
      price: toNumber(req.body.price),
      description: description.trim(),
      shippingDetails: {
        country: country.trim(),
        state: state.trim(),
        postal: String(postal).trim(),
        city: city?.trim(),
      },
      artistId: artistProfile.user,
      customerId,
      refrences,
      status: "pending",
      isConfirmed: false,
    });

    return res.status(201).json({
      success: true,
      message: "Request sent successfully",
      request,
    });
  } catch (error) {
    return next(error);
  }
};

// ?artist=true → requests sent to me as an artist; otherwise requests I sent
export const getAllCommissionRequests = async (req, res, next) => {
  try {
    const asArtist = req.query.artist === "true";

    const filter = asArtist
      ? { artistId: { $in: artistIdsFor(req.user) } }
      : { customerId: req.user._id };

    const commissionReqs = await CommissionDetail.find(filter)
      .sort({ _id: -1 })
      .populate(asArtist ? "customerId" : "artistId", "name userName profilePic")
      .lean();

    return res.status(200).json({
      success: true,
      commissionReqs: commissionReqs.map(withStatus),
    });
  } catch (error) {
    return next(error);
  }
};

export const acceptCommissionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accept } = req.body;

    if (!mongoose.isValidObjectId(id))
      return next(new ErrorHandler("Invalid request id", 400));
    if (typeof accept !== "boolean")
      return next(new ErrorHandler("`accept` must be true or false", 400));

    const comm = await CommissionDetail.findById(id).lean();
    if (!comm) return next(new ErrorHandler("Commission request not found", 404));

    const isArtist = artistIdsFor(req.user).some(
      (aid) => aid.toString() === comm.artistId?.toString()
    );
    if (!isArtist)
      return next(
        new ErrorHandler("Only the artist can respond to this request", 403)
      );

    if (withStatus(comm).status !== "pending")
      return next(
        new ErrorHandler("This request has already been answered", 409)
      );

    const status = accept ? "accepted" : "declined";
    const updated = await CommissionDetail.findByIdAndUpdate(
      id,
      // Also migrates old requests to the User id as artistId
      { status, isConfirmed: accept, artistId: req.user._id },
      { new: true }
    ).populate("customerId", "name userName profilePic");

    //create a temp chat

    return res.status(200).json({
      success: true,
      message: accept ? "Commission accepted" : "Commission declined",
      request: updated,
    });
  } catch (error) {
    return next(error);
  }
};
