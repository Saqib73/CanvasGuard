const UPLOAD_SEGMENT = "/upload/";

export const DEFAULT_WIDTHS = [320, 480, 640, 960, 1280, 1600];

export const isCloudinaryUrl = (url) =>
  typeof url === "string" &&
  url.includes("res.cloudinary.com") &&
  url.includes(UPLOAD_SEGMENT);

/**
 * Inserts f_auto,q_auto (and optional w_/c_) transformations into a Cloudinary
 * delivery URL. Non-Cloudinary URLs are returned unchanged.
 */
export const getOptimizedUrl = (url, { width, quality = "auto", format = "auto", crop = "limit" } = {}) => {
  if (!isCloudinaryUrl(url)) return url;

  // Older uploads were stored as http://. Browsers block insecure srcset candidates
  // on an https page instead of upgrading them, so always ask Cloudinary over https.
  const secureUrl = url.replace(/^http:\/\//, "https://");
  const transformations = [`f_${format}`, `q_${quality}`];
  if (width) transformations.push(`w_${width}`, `c_${crop}`);

  return secureUrl.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${transformations.join(",")}/`);
};

/**
 * Builds a srcset string, skipping widths larger than the original image
 * (Cloudinary would just upscale them with c_limit anyway).
 */
export const getSrcSet = (url, originalWidth, widths = DEFAULT_WIDTHS) => {
  if (!isCloudinaryUrl(url)) return undefined;

  let candidates = originalWidth ? widths.filter((w) => w <= originalWidth) : widths;
  if (originalWidth && !candidates.includes(originalWidth) && originalWidth < widths[widths.length - 1]) {
    candidates = [...candidates, originalWidth];
  }
  if (candidates.length === 0) candidates = [originalWidth];

  return candidates.map((w) => `${getOptimizedUrl(url, { width: w })} ${w}w`).join(", ");
};
