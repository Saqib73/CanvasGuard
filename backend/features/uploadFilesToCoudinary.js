import { v2 as cloudinary } from "cloudinary";
import { getBase64 } from "../lib/helper.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { v4 as uuid } from "uuid";
import { generateBlurPlaceholder } from "../utils/imageUtils.js";

const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromise = files.map(async (file) => {
    // Generate blur placeholder concurrently if buffer is available
    const blurPromise =
      file.buffer && (!file.mimetype || file.mimetype.startsWith("image/"))
        ? generateBlurPlaceholder(file.buffer)
        : Promise.resolve(null);

    const cloudinaryPromise = new Promise((res, rej) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (err, result) => {
          if (err) return rej(err);
          res(result);
        }
      );
    });

    const [blurDataUrl, result] = await Promise.all([
      blurPromise,
      cloudinaryPromise,
    ]);

    return {
      public_id: result.public_id,
      url: result.secure_url || result.url,
      width: result.width || null,
      height: result.height || null,
      format: result.format || null,
      blurDataUrl,
    };
  });

  try {
    const results = await Promise.all(uploadPromise);
    return results;
  } catch (error) {
    console.error(error);
    throw new ErrorHandler("Error uploading files to cloudinary");
  }
};

export { uploadFilesToCloudinary };
