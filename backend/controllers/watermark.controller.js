// import { v2 as cloudinary } from "cloudinary";
// import axios from "axios";
// import sharp from "sharp";
// import crypto from "crypto";
// import fs from "fs/promises";
// import path from "path";
// import { exec } from "child_process";
// import { v4 as uuidv4 } from "uuid";

// // ES module __dirname workaround
// import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Temp folder from .env or fallback to default
// const TEMP_DIR = path.join(__dirname, "../temp");

// // OpenStego jar path from .env or hardcoded
// const OPENSTEGO_JAR =
//   process.env.OPENSTEGO_JAR ||
//   path.join(__dirname, "../openstego-0.8.6/openstego-0.8.6/lib/openstego.jar");

// export const applyWatermark = async (req, res, next) => {
//   try {
//     const { url, public_id } = req.body;
//     const userId = req.user._id.toString();

//     if (!url || !public_id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing url or public_id" });
//     }

//     const uid = uuidv4();
//     const watermarkPath = path.join(TEMP_DIR, `${uid}_watermark.txt`);
//     const originalPath = path.join(TEMP_DIR, `${uid}_orig.png`);
//     const stegoPath = path.join(TEMP_DIR, `${uid}_stego.png`);

//     // 1. Download original image
//     const response = await axios.get(url, { responseType: "arraybuffer" });
//     const originalBuffer = Buffer.from(response.data, "binary");

//     // 2. Generate invisible signature
//     const signature = crypto
//       .createHash("sha256")
//       .update(`${userId}-${public_id}-${Date.now()}`)
//       .digest("hex");

//     // 3. Write watermark text file
//     await fs.writeFile(
//       watermarkPath,
//       `UserId: ${userId}\nSignature: ${signature}`
//     );

//     // 4. Convert original image to PNG
//     await sharp(originalBuffer).png().toFile(originalPath);

//     // 5. Embed watermark using OpenStego
//     const cmd = `java -jar "${OPENSTEGO_JAR}" embed -mf "${watermarkPath}" -cf "${originalPath}" -sf "${stegoPath}"`;

//     await new Promise((resolve, reject) => {
//       exec(cmd, (err, stdout, stderr) => {
//         if (err) {
//           console.error("OpenStego error:", stderr || err);
//           return reject(err);
//         }
//         console.log("OpenStego output:", stdout);
//         resolve();
//       });
//     });

//     // 6. Upload stego image to Cloudinary
//     const stegoBuffer = await fs.readFile(stegoPath);

//     const uploaded = await new Promise((resolve, reject) => {
//       const stream = cloudinary.uploader.upload_stream(
//         {
//           folder: "watermarked",
//           public_id: `${public_id.split("/").pop()}_wm`,
//           overwrite: true,
//         },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         }
//       );
//       stream.end(stegoBuffer);
//     });

//     // 7. OPTIONAL: cleanup temp files after upload
//     // await fs.unlink(watermarkPath);
//     // await fs.unlink(originalPath);
//     // await fs.unlink(stegoPath);

//     return res.status(200).json({
//       success: true,
//       message: "Watermark applied successfully (visible + invisible)",
//       url: uploaded.secure_url,
//       public_id: uploaded.public_id,
//       signature,
//     });
//   } catch (error) {
//     console.error("Watermarking failed:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Watermarking failed",
//       error: error.message,
//     });
//   }
// };

import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import sharp from "sharp";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const applyWatermark = async (req, res, next) => {
  const tempDir = path.join(process.cwd(), "temp");
  try {
    const { url, public_id } = req.body;
    const userId = req.user._id.toString();

    if (!url || !public_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing url or public_id" });
    }

    // 1. Download original image
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const originalBuffer = Buffer.from(response.data, "binary");

    // 2. Generate unique invisible signature
    const signature = crypto
      .createHash("sha256")
      .update(`${userId}-${public_id}-${Date.now()}`)
      .digest("hex");

    // 3. Apply visible watermark with Sharp
    const visibleSVG = `
      <svg width="400" height="100">
        <style>
          .title { fill: white; font-size: 28px; font-weight: bold; opacity: 0.8;}
        </style>
        <text x="10" y="50" class="title">© ${userId.slice(0, 6)}</text>
      </svg>
    `;
    const visibleBuffer = Buffer.from(visibleSVG);

    const visibleImageBuffer = await sharp(originalBuffer)
      .composite([
        { input: visibleBuffer, gravity: "southeast", blend: "overlay" },
      ])
      .png() // convert to PNG for OpenStego
      .toBuffer();

    // 4. Save temp files for OpenStego
    const uuid = crypto.randomUUID();
    const origPath = path.join(tempDir, `${uuid}_orig.png`);
    const watermarkPath = path.join(tempDir, `${uuid}_watermark.txt`);
    const stegoPath = path.join(tempDir, `${uuid}_stego.png`);

    await fs.writeFile(origPath, visibleImageBuffer);
    await fs.writeFile(
      watermarkPath,
      `userId:${userId}\nsignature:${signature}`
    );

    // 5. Run OpenStego to embed invisible watermark
    const openstegoJar = path.join(
      process.cwd(),
      "openstego-0.8.6",
      "openstego-0.8.6",
      "lib",
      "openstego.jar"
    );
    const cmd = `java -jar "${openstegoJar}" embed -mf "${watermarkPath}" -cf "${origPath}" -sf "${stegoPath}" -p ""`;
    await execAsync(cmd);

    const stegoBuffer = await fs.readFile(stegoPath); // wait for the file to be read

    // 6. Upload final image to Cloudinary
    const uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "watermarked",
          public_id: `${public_id.split("/").pop()}_wm`,
          overwrite: true,
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(stegoBuffer);
    });

    // 7. Cleanup temp files
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
