import sharp from "sharp";

/**
 * Generates a tiny base64 WebP blur placeholder (LQIP)
 * Typical payload is ~200-300 bytes.
 */
export const generateBlurPlaceholder = async (buffer) => {
  if (!buffer) return null;
  try {
    const blurBuffer = await sharp(buffer)
      .resize(20, 20, { fit: "inside" })
      .webp({ quality: 20 })
      .toBuffer();
    return `data:image/webp;base64,${blurBuffer.toString("base64")}`;
  } catch (err) {
    console.error("Failed to generate blur placeholder:", err.message);
    return null;
  }
};

/**
 * Generates an optimized Cloudinary delivery URL with f_auto, q_auto, and optional resizing.
 */
export const getOptimizedCloudinaryUrl = (url, options = {}) => {
  if (!url || !url.includes("cloudinary.com") || url.includes("/f_auto,q_auto/")) {
    return url;
  }

  const { width, quality = "auto", format = "auto", crop = "limit" } = options;
  const transformations = [];

  if (format) transformations.push(`f_${format}`);
  if (quality) transformations.push(`q_${quality}`);
  if (width) {
    transformations.push(`w_${width}`);
    if (crop) transformations.push(`c_${crop}`);
  }

  const transformString = transformations.join(",");
  return url.replace("/upload/", `/upload/${transformString}/`);
};
