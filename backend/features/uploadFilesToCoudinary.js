import { v2 as cloudinary } from "cloudinary";
import { getBase64 } from "../lib/helper.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { v4 as uuid } from "uuid";

const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromise = files.map((file) => {
    return new Promise((res, rej) => {
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
  });

  try {
    const results = await Promise.all(uploadPromise);

    const formattedResult = results.map((result) => ({
      public_id: result.public_id,
      url: result.url,
    }));

    return formattedResult;
  } catch (error) {
    console.error(error);
    throw new ErrorHandler("Error uplaoding files to cloudinary");
  }
};

export { uploadFilesToCloudinary };
