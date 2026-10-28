import { Media } from "../model/Media.js";
import { Post } from "../model/Post.js";
import { checkOwnership, watermarkMedia } from "../services/watermark.service.js";

export const applyWatermark = async (req, res) => {
  try {
    const { public_id } = req.body;
    const userId = req.user._id.toString();

    if (!public_id)
      return res
        .status(400)
        .json({ success: false, message: "Upload an image before applying a watermark." });

    // Only the uploader may watermark their own, not-yet-watermarked image
    const media = await Media.findOne({ public_id, deletedAt: null });
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

    const newMedia = await watermarkMedia(media, { userId, userName: req.user.userName });

    res.status(200).json({
      success: true,
      message: "Visible + Invisible watermark applied successfully",
      url: newMedia.url,
      public_id: newMedia.public_id,
      width: newMedia.width,
      height: newMedia.height,
      blurDataUrl: newMedia.blurDataUrl,
    });
  } catch (err) {
    console.error("Watermarking failed:", err);
    return res.status(500).json({
      success: false,
      message: "Watermarking failed",
      error: err.message,
    });
  }
};

export const verifyOwnership = async (req, res) => {
  try {
    const { postId } = req.body;
    const reporterId = req.user._id.toString();

    const post = await Post.findById(postId).populate("media");
    if (!post || !post.media)
      return res.status(404).json({
        success: false,
        message: "Post or media not found.",
      });

    if (post.author.toString() === reporterId)
      return res.status(400).json({
        success: false,
        message: "This is your own post.",
      });

    const result = await checkOwnership(post, reporterId);
    return res.status(200).json({
      success: result.matchFound,
      ...result,
      ...(result.isStolen && { stolenPost: post }),
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
