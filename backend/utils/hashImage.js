import fs from "fs";
import crypto from "crypto";

export const hashImage = (filePath) => {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
};
