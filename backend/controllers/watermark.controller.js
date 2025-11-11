import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import sharp from "sharp";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { Media } from "../model/Media.js";
import { generateImageHashes } from "../utils/hashUtils.js";
import { Post } from "../model/Post.js";

const execAsync = promisify(exec);

export const applyWatermark = async (req, res, next) => {
  const tempDir = path.join(process.cwd(), "temp");
  try {
    const { url, public_id, type } = req.body;
    const userId = req.user._id.toString();

    if (!url || !public_id)
      return res
        .status(400)
        .json({ success: false, message: "Missing url or public_id" });

    // 1️⃣ Download image
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const originalBuffer = Buffer.from(response.data, "binary");

    // 2️⃣ Check if Cloudinary image already has watermark metadata
    const existing = await cloudinary.api
      .resource(public_id, { context: true })
      .catch(() => null);
    if (existing?.context?.custom?.signature) {
      return res.status(400).json({
        success: false,
        message:
          "This image already contains a watermark and cannot be watermarked again.",
      });
    }

    const signature = crypto
      .createHash("sha256")
      .update(`${userId}-${public_id}-${Date.now()}`)
      .digest("hex");

    // 5️⃣ Apply visible watermark
    const visibleSVG = `
      <svg width="400" height="400">
        <style>
          .title { fill: black; font-size: 85px; font-weight: 500; opacity: 0.8; font-family: "Brush Script MT", "Lucida Handwriting", cursive;}
        </style>
        <text x="10" y="90" class="title">© ${userId.slice(0, 6)}</text>
      </svg>
    `;
    const visibleBuffer = Buffer.from(visibleSVG);

    const visibleImageBuffer = await sharp(originalBuffer)
      .composite([
        { input: visibleBuffer, gravity: "center", blend: "overlay" },
      ])
      .png()
      .toBuffer();

    // 6️⃣ Temp files for OpenStego
    const uuid = crypto.randomUUID();
    const origPath = path.join(tempDir, `${uuid}_orig.png`);
    const watermarkPath = path.join(tempDir, `${uuid}_watermark.txt`);
    const stegoPath = path.join(tempDir, `${uuid}_stego.png`);

    await fs.writeFile(origPath, visibleImageBuffer);
    await fs.writeFile(
      watermarkPath,
      `userId:${userId}\nsignature:${signature}`
    );

    const openstegoJar = path.join(
      process.cwd(),
      "openstego-0.8.6",
      "openstego-0.8.6",
      "lib",
      "openstego.jar"
    );
    const cmd = `java -jar "${openstegoJar}" embed -mf "${watermarkPath}" -cf "${origPath}" -sf "${stegoPath}" -p ""`;
    await execAsync(cmd);

    const stegoBuffer = await fs.readFile(stegoPath);
    const { sha256, phash } = await generateImageHashes(stegoBuffer);
    if (!sha256 || !phash) {
      return res.status(500).json({
        success: failed,
        message: "hash generation failed",
      });
    }

    // 7️⃣ Upload watermarked image to Cloudinary
    const uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "watermarked",
          public_id: `${public_id.split("/").pop()}_wm`,
          overwrite: true,
          context: { userId, signature, created_at: new Date().toISOString() },
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(stegoBuffer);
    });

    // const buffer = await fs.readFile(tempPath);

    await Media.deleteOne({ public_id });

    try {
      await cloudinary.uploader
        .destroy(public_id)
        .then((res) => console.log(res));
    } catch (err) {
      console.warn("Failed to delete original image:", err.message);
    }

    // 8️⃣ Store hash
    await Media.create({
      public_id: uploaded.public_id,
      url: uploaded.url,
      userId,
      sha256,
      phash,
      type,
      isWaterMarked: true,
    });

    // 9️⃣ Cleanup
    await fs.rm(origPath, { force: true });
    await fs.rm(watermarkPath, { force: true });
    await fs.rm(stegoPath, { force: true });

    return res.status(200).json({
      success: true,
      message: "Visible + Invisible watermark applied successfully",
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
      signature,
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
// export const applyWatermark = async (req, res, next) => {
//   const tempDir = path.join(process.cwd(), "temp");
//   try {
//     const { url, public_id, type } = req.body;
//     const userId = req.user._id.toString();

//     if (!url || !public_id)
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing url or public_id" });

//     // 1️⃣ Download image
//     const response = await axios.get(url, { responseType: "arraybuffer" });
//     const originalBuffer = Buffer.from(response.data, "binary");

//     // 2️⃣ Check if Cloudinary image already has watermark metadata
//     const existing = await cloudinary.api
//       .resource(public_id, { context: true })
//       .catch(() => null);
//     if (existing?.context?.custom?.signature) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "This image already contains a watermark and cannot be watermarked again.",
//       });
//     }

//     // 3️⃣ Compute perceptual hash & check for duplicates
//     // const newHash = await computeImageHash(originalBuffer);
//     // const hashPrefix = newHash.substring(0, 6);

//     // const possibleDuplicates = await Media.find({ hashPrefix });
//     // const isDuplicate = possibleDuplicates.some((doc) => {
//     //   const dist = [...doc.hash].reduce(
//     //     (acc, bit, i) => acc + (bit !== newHash[i] ? 1 : 0),
//     //     0
//     //   );
//     //   return dist < 10; // threshold
//     // });

//     // if (isDuplicate) {
//     //   return res.status(409).json({
//     //     success: false,
//     //     message:
//     //       "A visually similar image already exists — likely already watermarked.",
//     //   });
//     // }

//     // 4️⃣ Generate invisible signature

//     const signature = crypto
//       .createHash("sha256")
//       .update(`${userId}-${public_id}-${Date.now()}`)
//       .digest("hex");

//     // 5️⃣ Apply visible watermark
//     const visibleSVG = `
//       <svg width="400" height="100">
//         <style>
//           .title { fill: white; font-size: 30px; font-weight: bold; opacity: 0.8;}
//         </style>
//         <text x="10" y="50" class="title">© ${userId.slice(0, 6)}</text>
//       </svg>
//     `;
//     const visibleBuffer = Buffer.from(visibleSVG);

//     const visibleImageBuffer = await sharp(originalBuffer)
//       .rotate(45)
//       .composite([
//         { input: visibleBuffer, gravity: "center", blend: "overlay" },
//       ])
//       .png()
//       .toBuffer();

//     // 6️⃣ Temp files for OpenStego
//     const uuid = crypto.randomUUID();
//     const origPath = path.join(tempDir, `${uuid}_orig.png`);
//     const watermarkPath = path.join(tempDir, `${uuid}_watermark.txt`);
//     const stegoPath = path.join(tempDir, `${uuid}_stego.png`);

//     await fs.writeFile(origPath, visibleImageBuffer);
//     await fs.writeFile(
//       watermarkPath,
//       `userId:${userId}\nsignature:${signature}`
//     );

//     const openstegoJar = path.join(
//       process.cwd(),
//       "openstego-0.8.6",
//       "openstego-0.8.6",
//       "lib",
//       "openstego.jar"
//     );
//     const cmd = `java -jar "${openstegoJar}" embed -mf "${watermarkPath}" -cf "${origPath}" -sf "${stegoPath}" -p ""`;
//     await execAsync(cmd);

//     const stegoBuffer = await fs.readFile(stegoPath);
//     const { sha256, phash } = await generateImageHashes(stegoBuffer);
//     if (!sha256 || !phash) {
//       return res.status(500).json({
//         success: failed,
//         message: "hash generation failed",
//       });
//     }

//     // 7️⃣ Upload watermarked image to Cloudinary
//     const uploaded = await new Promise((resolve, reject) => {
//       const stream = cloudinary.uploader.upload_stream(
//         {
//           folder: "watermarked",
//           public_id: `${public_id.split("/").pop()}_wm`,
//           overwrite: true,
//           context: { userId, signature, created_at: new Date().toISOString() },
//         },
//         (err, result) => (err ? reject(err) : resolve(result))
//       );
//       stream.end(stegoBuffer);
//     });

//     // const buffer = await fs.readFile(tempPath);

//     await Media.deleteOne({ public_id });

//     try {
//       await cloudinary.uploader
//         .destroy(public_id)
//         .then((res) => console.log(res));
//     } catch (err) {
//       console.warn("Failed to delete original image:", err.message);
//     }

//     // 8️⃣ Store hash
//     await Media.create({
//       public_id: uploaded.public_id,
//       url: uploaded.url,
//       userId,
//       sha256,
//       phash,
//       type,
//       isWaterMarked: true,
//     });

//     // 9️⃣ Cleanup
//     await fs.rm(origPath, { force: true });
//     await fs.rm(watermarkPath, { force: true });
//     await fs.rm(stegoPath, { force: true });

//     return res.status(200).json({
//       success: true,
//       message: "Visible + Invisible watermark applied successfully",
//       url: uploaded.secure_url,
//       public_id: uploaded.public_id,
//       signature,
//     });
//   } catch (err) {
//     console.error("Watermarking failed:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Watermarking failed",
//       error: err.message,
//     });
//   }
// };

const extractWatermarkData = async (imageBuffer) => {
  const tempDir = path.join(process.cwd(), "temp");
  const uuid = crypto.randomUUID();
  const stegoPath = path.join(tempDir, `${uuid}_stego.png`);
  const extractPath = path.join(tempDir, `${uuid}_extracted.txt`);

  await fs.writeFile(stegoPath, imageBuffer);

  const openstegoJar = path.join(
    process.cwd(),
    "openstego-0.8.6",
    "openstego-0.8.6",
    "lib",
    "openstego.jar"
  );

  const cmd = `java -jar "${openstegoJar}" extract -sf "${stegoPath}" -xf "${extractPath}" -p ""`;
  try {
    await execAsync(cmd);
    const extractedData = await fs.readFile(extractPath, "utf-8");
    await fs.rm(stegoPath, { force: true });
    await fs.rm(extractPath, { force: true });
    return extractedData;
  } catch (err) {
    console.warn("Watermark extraction failed or no watermark found.");
    return null;
  }
};

export const verifyOwnership = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user._id.toString();

    // 1️⃣ Get the target post + its media
    const post = await Post.findById(postId).populate("media");
    if (!post || !post.media)
      return res.status(404).json({
        success: false,
        message: "Post or media not found.",
      });

    const media = post.media;
    const response = await axios.get(media.url, {
      responseType: "arraybuffer",
    });
    const imageBuffer = Buffer.from(response.data, "binary");

    // 2️⃣ Try to extract invisible watermark
    const extractedData = await extractWatermarkData(imageBuffer);

    if (extractedData) {
      // Look for userId in extracted watermark
      const match = extractedData.match(/userId:(.+)/);
      if (match && match[1].trim() === userId) {
        return res.status(200).json({
          success: true,
          verifiedBy: "watermark",
          message: "Ownership verified via invisible watermark.",
          matchFound: true,
          stolenPost: post,
          isStolen: true,
        });
      } else if (match) {
        // Watermark belongs to someone else
        return res.status(403).json({
          success: true,
          verifiedBy: "watermark",
          message: "Image watermark indicates another owner.",
          matchFound: true,
          isStolen: false,
        });
      }
    }

    // 3️⃣ No watermark found — fallback to hash comparison
    const { sha256, phash } = await generateImageHashes(imageBuffer);

    const similarMedia = await Media.find();
    for (const m of similarMedia) {
      const dist = [...phash].reduce(
        (acc, bit, i) => acc + (bit !== m.phash[i] ? 1 : 0),
        0
      );
      if (dist < 10 && m.userId.toString() === userId) {
        return res.status(200).json({
          success: true,
          verifiedBy: "hash",
          message: "Ownership verified via perceptual hash similarity.",
          matchFound: true,
          stolenPost: post,
          originalMedia: m,
        });
      }
    }

    // 4️⃣ If we reach here, no match found
    return res.status(200).json({
      success: false,
      message:
        "No watermark or hash match found. Image may not belong to the reporter.",
      matchFound: false,
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
