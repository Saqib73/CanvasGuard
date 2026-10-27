import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import mongoose from "mongoose";
import { Media } from "../model/Media.js";
import { Post } from "../model/Post.js";
import { generateImageHashes, minVariantDistance } from "../utils/hashUtils.js";
import { generateBlurPlaceholder } from "../utils/imageUtils.js";
import {
  applyVisibleWatermark,
  buildPayload,
  embedPayload,
  extractPayload,
  parsePayload,
  signWatermark,
} from "../utils/watermarkUtils.js";

// Max differing bits (of 256) for two perceptual hashes to count as the same artwork
const PHASH_MATCH_THRESHOLD = 24;

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

// Only ever called with URLs from our own Media records, never client input
const downloadImage = async (url) => {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 15000,
    maxContentLength: MAX_IMAGE_BYTES,
  });
  return Buffer.from(response.data);
};

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) =>
      err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });

// Older Media docs never stored userId, so fall back to the author of the post using it
const resolveMediaOwner = async (media) => {
  if (media.userId) return media.userId.toString();
  const post = await Post.findOne({ media: media._id }).select("author").lean();
  return post?.author?.toString() || null;
};

export const applyWatermark = async (req, res) => {
  try {
    const { public_id } = req.body;
    const userId = req.user._id.toString();

    if (!public_id)
      return res
        .status(400)
        .json({ success: false, message: "Missing public_id" });

    // 1️⃣ Only the uploader may watermark their own, not-yet-watermarked image
    const media = await Media.findOne({ public_id });
    if (!media)
      return res
        .status(404)
        .json({ success: false, message: "Media not found" });

    if (media.userId?.toString() !== userId)
      return res.status(403).json({
        success: false,
        message: "You can only watermark images you uploaded.",
      });

    if (media.isWaterMarked)
      return res.status(409).json({
        success: false,
        message:
          "This image already contains a watermark and cannot be watermarked again.",
      });

    if (media.type !== "image")
      return res
        .status(400)
        .json({ success: false, message: "Only images can be watermarked." });

    // 2️⃣ Visible watermark, then a signed invisible payload on top of it
    const originalBuffer = await downloadImage(media.url);
    const visibleBuffer = await applyVisibleWatermark(
      originalBuffer,
      req.user.userName
    );

    const newMediaId = new mongoose.Types.ObjectId();
    const signature = signWatermark(userId, newMediaId.toString());
    const stegoBuffer = await embedPayload(
      visibleBuffer,
      buildPayload(userId, newMediaId.toString())
    );

    // 3️⃣ Hash + blur placeholder while uploading the watermarked file
    const [uploaded, hashes, blurDataUrl] = await Promise.all([
      uploadBuffer(stegoBuffer, {
        folder: "watermarked",
        public_id: `${public_id.split("/").pop()}_wm`,
        overwrite: true,
        context: {
          userId,
          mediaId: newMediaId.toString(),
          signature,
          created_at: new Date().toISOString(),
        },
      }),
      generateImageHashes(stegoBuffer),
      generateBlurPlaceholder(stegoBuffer),
    ]);

    // 4️⃣ Persist before responding so createPost can find the new media immediately
    const newMedia = await Media.create({
      _id: newMediaId,
      public_id: uploaded.public_id,
      url: uploaded.secure_url,
      userId,
      type: media.type,
      ...hashes,
      signature,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
      blurDataUrl,
      isWaterMarked: true,
    });

    await Post.updateMany({ media: media._id }, { media: newMedia._id });
    await Media.deleteOne({ _id: media._id });

    res.status(200).json({
      success: true,
      message: "Visible + Invisible watermark applied successfully",
      url: newMedia.url,
      public_id: newMedia.public_id,
      width: newMedia.width,
      height: newMedia.height,
      blurDataUrl: newMedia.blurDataUrl,
    });

    // 5️⃣ The unwatermarked original is no longer referenced anywhere
    cloudinary.uploader
      .destroy(public_id)
      .catch((err) =>
        console.warn("Failed to delete original image:", err.message)
      );
  } catch (err) {
    console.error("Watermarking failed:", err);
    return res.status(500).json({
      success: false,
      message: "Watermarking failed",
      error: err.message,
    });
  }
};

// Finds the earliest upload of the same artwork by someone other than the post's author
const findOriginalByHash = async (media, imageBuffer, authorId) => {
  let { sha256, phashVariants, phashBands } = media;

  // Media saved before crop hashes existed: compute now and store for next time
  if (!sha256 || !phashVariants?.length || !phashBands?.length) {
    const hashes = await generateImageHashes(imageBuffer);
    ({ sha256, phashVariants, phashBands } = hashes);
    await Media.updateOne({ _id: media._id }, hashes);
  }

  const olderThan = media.createdAt ? { createdAt: { $lt: media.createdAt } } : {};
  const baseFilter = { _id: { $ne: media._id }, ...olderThan };

  // Exact byte-for-byte copy first: one indexed lookup
  const exact = await Media.find({ ...baseFilter, sha256 })
    .sort({ createdAt: 1 })
    .lean();
  for (const m of exact) {
    const owner = await resolveMediaOwner(m);
    if (owner && owner !== authorId) return { media: m, owner, verifiedBy: "sha256" };
  }

  // Perceptual match: the band index narrows the search to images sharing a hash slice,
  // then the full distance is checked here. Oldest first so the first hit is the original.
  const candidates = await Media.find({
    ...baseFilter,
    phashBands: { $in: phashBands },
  })
    .select("phash phashVariants userId createdAt url public_id isWaterMarked")
    .sort({ createdAt: 1 })
    .lean();

  for (const m of candidates) {
    const candidateHashes = m.phashVariants?.length ? m.phashVariants : [m.phash];
    if (minVariantDistance(phashVariants, candidateHashes) > PHASH_MATCH_THRESHOLD) continue;
    const owner = await resolveMediaOwner(m);
    if (owner && owner !== authorId) return { media: m, owner, verifiedBy: "hash" };
  }

  return null;
};

export const verifyOwnership = async (req, res) => {
  try {
    const { postId } = req.body;
    const reporterId = req.user._id.toString();

    // 1️⃣ Get the target post + its media
    const post = await Post.findById(postId).populate("media");
    if (!post || !post.media)
      return res.status(404).json({
        success: false,
        message: "Post or media not found.",
      });

    const authorId = post.author.toString();
    if (authorId === reporterId)
      return res.status(400).json({
        success: false,
        message: "This is your own post.",
      });

    const media = post.media;
    const imageBuffer = await downloadImage(media.url);

    // 2️⃣ A signed invisible watermark is the strongest evidence of the original owner
    const watermark = parsePayload(await extractPayload(imageBuffer));
    if (watermark) {
      const ownerId = watermark.userId;

      if (ownerId === authorId)
        return res.status(200).json({
          success: true,
          verifiedBy: "watermark",
          message: "The watermark confirms this post's author is the original artist.",
          matchFound: true,
          isStolen: false,
          originalOwner: ownerId,
        });

      // `isStolen` means "stolen from the reporter", which is what the client acts on
      return res.status(200).json({
        success: true,
        verifiedBy: "watermark",
        message:
          ownerId === reporterId
            ? "Ownership verified via invisible watermark."
            : "The watermark shows this image belongs to a different artist.",
        matchFound: true,
        isStolen: ownerId === reporterId,
        stolenPost: post,
        originalOwner: ownerId,
      });
    }

    // 3️⃣ No genuine watermark (missing, stripped by recompression, or forged): compare hashes
    const original = await findOriginalByHash(media, imageBuffer, authorId);
    if (original) {
      return res.status(200).json({
        success: true,
        verifiedBy: original.verifiedBy,
        message:
          original.owner === reporterId
            ? "Ownership verified via image similarity."
            : "A visually identical image was uploaded earlier by a different artist.",
        matchFound: true,
        isStolen: original.owner === reporterId,
        stolenPost: post,
        originalMedia: original.media,
        originalOwner: original.owner,
      });
    }

    // 4️⃣ If we reach here, no match found
    return res.status(200).json({
      success: false,
      message:
        "No watermark or hash match found. Image may not belong to the reporter.",
      matchFound: false,
      isStolen: false,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to verify ownership",
      error: err.message,
    });
  }
};
