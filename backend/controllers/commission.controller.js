import { ArtistProfile } from "../model/ArtistProfile";

///artists?open=true&style=anime&minFee=50&maxFee=300&sort=fee_low
export const getArtists = async (req, res) => {
  try {
    const { open, style, minFee, maxFee, sort } = req.query;

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
    res.json(artists);
  } catch (err) {
    next(err);
  }
};
