// export const generateImageHash = (filePath) => {
//   return new Promise((resolve, reject) => {
//     imageHash(filePath, 16, true, "phash", (err, data) => {
//       if (err) reject(err);
//       else resolve(data);
//     });
//   });
// };

// export const areImagesSimilar = (hash1, hash2, threshold = 5) => {
//   const distance = hamming(hash1, hash2);
//   return distance <= threshold;
// };

// utils/hashUtils.js
import imghash from "imghash";
import crypto from "crypto";

export const generateImageHashes = async (buffer) => {
  // Compute perceptual hash (robust to small edits, cropping, etc.)
  const phash = await imghash.hash(buffer, 16, "hex");

  // Compute SHA-256 for exact duplicate detection
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  console.log("inside generate image hash", phash);

  return { sha256, phash };
};

// Hamming distance to compare perceptual hashes
export const hammingDistance = (hash1, hash2) => {
  if (!hash1 || !hash2) return Infinity;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
};

export const areImagesSimilar = (hash1, hash2, threshold = 0.85) => {
  if (!hash1 || !hash2) return false;
  let matches = 0;
  for (let i = 0; i < Math.min(hash1.length, hash2.length); i++) {
    if (hash1[i] === hash2[i]) matches++;
  }
  const similarity = matches / Math.max(hash1.length, hash2.length);
  return similarity >= threshold;
};
