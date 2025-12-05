import { uploadFilesToCloudinary } from "../features/uploadFilesToCoudinary.js";
import { ArtistProfile } from "../model/ArtistProfile.js";
import { CommissionDetail } from "../model/CommissionDetail.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

///artists?open=true&style=anime&minFee=50&maxFee=300&sort=fee_low
export const getArtists = async (req, res, next) => {
  try {
    const { open, style, minFee, maxFee, sort } = req.query;
    console.log("sort-->", sort, style);

    const query = {};

    if (open) query.isOpenForCommission = open === "true";
    if (style) query.artStyles = { $regex: style, $options: "i" };
    if (minFee || maxFee) {
      query.baseFee = {};
      if (minFee) query.baseFee.$gte = Number(minFee);
      if (maxFee) query.baseFee.$lte = Number(maxFee);
    }

    let q = await ArtistProfile.find(query).populate({
      path: "user",
      select: "name userName profilePic",
    });

    // sorting
    if (sort === "fee_low") q = q.sort({ baseFee: 1 });
    else if (sort === "fee_high") q = q.sort({ baseFee: -1 });
    else if (sort === "newest") q = q.sort({ createdAt: -1 });

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
    const {
      deadline,
      artStyle,
      price,
      description,
      shippingDetails,
      artistId,
    } = req.body;
    const customerId = req.user._id;
    const files = req.files || [];
    console.log("inside func");

    const parsedShippingDetails = JSON.parse(shippingDetails);

    let refrences;

    if (files.length > 0) {
      const result = await uploadFilesToCloudinary(files);
      refrences = {
        public_id: result[0].public_id,
        url: result[0].url,
      };
    }

    console.log(parsedShippingDetails);

    if (!deadline)
      return next(new ErrorHandler("Please give an idea about deadline", 400));
    if (
      !parsedShippingDetails.country ||
      !parsedShippingDetails.state ||
      !parsedShippingDetails.postal
    )
      return next(
        new ErrorHandler("Please provide necessary shipping details", 400)
      );

    const request = new CommissionDetail({
      deadline,
      artStyle,
      price,
      description,
      shippingDetails: parsedShippingDetails,
      artistId,
      customerId,
      refrences,
      isConfirmed: false,
    });

    console.log("saving request");
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Request sent successfully",
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const getAllCommissionRequests = async (req, res, next) => {
  try {
    const { artist } = req.query;

    if (artist) {
      const commissionReqs = await CommissionDetail.find({
        artistId: req.user._id,
      }).populate("customerId", "name userName profilePic");

      return res.status(200).json({
        success: true,
        commissionReqs,
      });
    }
  } catch (error) {
    return next(error);
  }
};

export const acceptCommissionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accept } = req.body;
    const comm = await CommissionDetail.findById(id);

    comm.isConfirmed = accept;
    await comm.save();

    //create a temp chat
  } catch (error) {
    return next(error);
  }
};
