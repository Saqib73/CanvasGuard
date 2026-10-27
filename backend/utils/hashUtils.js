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
import sharp from "sharp";

/*
 * Perceptual hashes describe the whole frame, so a cropped copy hashes very differently
 * from its original. To catch the crops people actually make (zoom-in, or a centered
 * 1:1 / 4:5 / 4:3 crop for social media), every image also stores hashes of those
 * center crops, and two images match if ANY pair of their hashes is close.
 * Off-center crops are not covered; that needs keypoint matching (e.g. OpenCV ORB).
 */
const HASH_VARIANTS = [
  {},
  { scale: 0.85 },
  { scale: 0.7 },
  { ratio: 1 },
  { ratio: 4 / 5 },
  { ratio: 4 / 3 },
];

// Hashing works on a small image anyway; downscaling first keeps imghash fast
const HASH_INPUT_SIZE = 256;

const centerCropBox = (width, height, { scale = 1, ratio = null }) => {
  let w = width * scale;
  let h = height * scale;
  if (ratio) {
    if (w / h > ratio) w = h * ratio;
    else h = w / ratio;
  }
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  return {
    left: Math.round((width - w) / 2),
    top: Math.round((height - h) / 2),
    width: w,
    height: h,
  };
};

/*
 * Each 256-bit hash is split into 16 bands of 16 bits, stored as "<band>:<hex>" in an
 * indexed array. Two hashes within 15 bits of each other must share at least one band
 * (pigeonhole), so `phashBands: { $in: [...] }` finds every close candidate without
 * scanning the collection. Matches up to the 24-bit threshold are still found in practice,
 * since near-duplicates usually differ by under 10 bits.
 */
const BAND_HEX_LENGTH = 4;

export const toPhashBands = (hashes) => {
  const bands = new Set();
  for (const hash of hashes) {
    for (let i = 0; i * BAND_HEX_LENGTH < hash.length; i++) {
      bands.add(`${i}:${hash.slice(i * BAND_HEX_LENGTH, (i + 1) * BAND_HEX_LENGTH)}`);
    }
  }
  return [...bands];
};

export const generatePerceptualHashes = async (buffer) => {
  // Bake EXIF orientation in so rotated phone photos hash like their displayed version
  const { data, info } = await sharp(buffer)
    .rotate()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const raw = { raw: { width: info.width, height: info.height, channels: info.channels } };

  const seen = new Set();
  const hashes = [];
  for (const variant of HASH_VARIANTS) {
    const box = centerCropBox(info.width, info.height, variant);
    const key = `${box.left},${box.top},${box.width},${box.height}`;
    if (seen.has(key)) continue; // e.g. a square image's 1:1 crop is the full image
    seen.add(key);

    const input = await sharp(data, raw)
      .extract(box)
      .resize(HASH_INPUT_SIZE, HASH_INPUT_SIZE, { fit: "fill" })
      .png()
      .toBuffer();
    hashes.push(await imghash.hash(input, 16, "hex"));
  }
  return hashes;
};

export const generateImageHashes = async (buffer) => {
  // Perceptual hashes (robust to recompression, resizing and centered crops)
  const phashVariants = await generatePerceptualHashes(buffer);

  // SHA-256 for exact duplicate detection
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

  return {
    sha256,
    phash: phashVariants[0],
    phashVariants,
    phashBands: toPhashBands(phashVariants),
  };
};

// Smallest distance between any hash of one image and any hash of the other
export const minVariantDistance = (hashesA, hashesB) => {
  let min = Infinity;
  for (const a of hashesA) {
    for (const b of hashesB) min = Math.min(min, hammingDistance(a, b));
  }
  return min;
};

// Bits set in each hex nibble (0-f)
const NIBBLE_BITS = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

// Bit-level Hamming distance between two hex perceptual hashes
export const hammingDistance = (hash1, hash2) => {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    dist += NIBBLE_BITS[parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16)];
  }
  return dist;
};

// threshold = fraction of bits that must match (16x16 phash = 256 bits)
export const areImagesSimilar = (hash1, hash2, threshold = 0.9) => {
  const dist = hammingDistance(hash1, hash2);
  if (dist === Infinity) return false;
  return 1 - dist / (hash1.length * 4) >= threshold;
};
