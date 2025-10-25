import multer from "multer";

const multerUpload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, //5MB
  },
});

const singleProfile = multerUpload.single("profile");

const attachMentUpload = multerUpload.array("files", 4);

export { singleProfile, attachMentUpload };
