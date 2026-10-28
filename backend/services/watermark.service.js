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

/**
 * Applies the visible signature and the signed invisible payload to `media`,
 * stores the result as a new Media, points posts at it and removes the original.
 * Returns the new Media document.
 */
export const watermarkMedia = async (media, { userId, userName }) => {
  const originalBuffer = await downloadImage(media.url);
  const visibleBuffer = await applyVisibleWatermark(originalBuffer, userName);

  const newMediaId = new mongoose.Types.ObjectId();
  const signature = signWatermark(userId, newMediaId.toString());
  const stegoBuffer = await embedPayload(
    visibleBuffer,
    buildPayload(userId, newMediaId.toString())
  );

  // Hash + blur placeholder while uploading the watermarked file
  const [uploaded, hashes, blurDataUrl] = await Promise.all([
    uploadBuffer(stegoBuffer, {
      folder: [process.env.CLOUDINARY_FOLDER, "watermarked"].filter(Boolean).join("/"),
      public_id: `${media.public_id.split("/").pop()}_wm`,
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

  // The unwatermarked original is no longer referenced anywhere
  cloudinary.uploader
    .destroy(media.public_id)
    .catch((err) => console.warn("Failed to delete original image:", err.message));

  return newMedia;
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

  // Deleted originals are included on purpose: their hashes are kept as evidence
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
    .select("phash phashVariants userId createdAt url public_id isWaterMarked deletedAt")
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

/**
 * Works out who originally made a post's image, from the reporter's point of view.
 * `post` must have `media` populated. `isStolen` means "stolen from the reporter".
 */
export const checkOwnership = async (post, reporterId) => {
  const authorId = post.author._id?.toString() ?? post.author.toString();
  const media = post.media;
  const imageBuffer = await downloadImage(media.url);

  // A signed invisible watermark is the strongest evidence of the original owner
  const watermark = parsePayload(await extractPayload(imageBuffer));
  if (watermark) {
    const ownerId = watermark.userId;
    if (ownerId === authorId)
      return {
        verifiedBy: "watermark",
        message: "The watermark confirms this post's author is the original artist.",
        matchFound: true,
        isStolen: false,
        originalOwner: ownerId,
      };

    return {
      verifiedBy: "watermark",
      message:
        ownerId === reporterId
          ? "Ownership verified via invisible watermark."
          : "The watermark shows this image belongs to a different artist.",
      matchFound: true,
      isStolen: ownerId === reporterId,
      originalOwner: ownerId,
    };
  }

  // No genuine watermark (missing, stripped by recompression, or forged): compare hashes
  const original = await findOriginalByHash(media, imageBuffer, authorId);
  if (original) {
    return {
      verifiedBy: original.verifiedBy,
      message:
        original.owner === reporterId
          ? "Ownership verified via image similarity."
          : "A visually identical image was uploaded earlier by a different artist.",
      matchFound: true,
      isStolen: original.owner === reporterId,
      originalMedia: original.media,
      originalOwner: original.owner,
    };
  }

  return {
    message: "No watermark or hash match found. Image may not belong to the reporter.",
    matchFound: false,
    isStolen: false,
  };
};
