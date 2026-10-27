import crypto from "crypto";
import fs from "fs/promises";
import fsSync from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const PAYLOAD_VERSION = "canvasguard:v1";

export const OPENSTEGO_JAR = path.resolve(
  process.env.OPENSTEGO_JAR || path.join(process.cwd(), "vendor", "openstego.jar")
);

if (!fsSync.existsSync(OPENSTEGO_JAR)) {
  console.warn(
    `⚠️ OpenStego jar not found at ${OPENSTEGO_JAR}. Watermarking will fail until OPENSTEGO_JAR points to it.`
  );
}

// Dedicated secret so rotating JWT_SECRET doesn't invalidate every watermark
const getSecret = () => {
  const secret = process.env.WATERMARK_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("WATERMARK_SECRET (or JWT_SECRET) must be set");
  return secret;
};

// Password for OpenStego's embedded-data encryption, derived from the secret
const getStegoPassword = () =>
  crypto.createHmac("sha256", getSecret()).update("openstego-password").digest("hex");

export const signWatermark = (userId, mediaId) =>
  crypto
    .createHmac("sha256", getSecret())
    .update(`${PAYLOAD_VERSION}:${userId}:${mediaId}`)
    .digest("hex");

export const buildPayload = (userId, mediaId) =>
  [
    PAYLOAD_VERSION,
    `userId:${userId}`,
    `mediaId:${mediaId}`,
    `signature:${signWatermark(userId, mediaId)}`,
  ].join("\n");

/**
 * Parses an extracted payload and checks its HMAC.
 * Returns { userId, mediaId } only for genuine CanvasGuard watermarks, otherwise null.
 */
export const parsePayload = (text) => {
  if (!text?.startsWith(PAYLOAD_VERSION)) return null;

  const fields = Object.fromEntries(
    text
      .split(/\r?\n/)
      .slice(1)
      .map((line) => {
        const i = line.indexOf(":");
        return [line.slice(0, i), line.slice(i + 1).trim()];
      })
  );
  const { userId, mediaId, signature } = fields;
  if (!userId || !mediaId || !signature) return null;

  const expected = Buffer.from(signWatermark(userId, mediaId), "hex");
  const actual = Buffer.from(signature, "hex");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  return { userId, mediaId, signature };
};

// Runs fn with a fresh temp directory that is always removed afterwards
const withTempDir = async (fn) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "canvasguard-"));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
};

// OpenStego exits 0 even on failure, so success is judged by the output file existing
export const embedPayload = (pngBuffer, payload) =>
  withTempDir(async (dir) => {
    const coverPath = path.join(dir, "cover.png");
    const messagePath = path.join(dir, "message.txt");
    const stegoPath = path.join(dir, "stego.png");

    await Promise.all([
      fs.writeFile(coverPath, pngBuffer),
      fs.writeFile(messagePath, payload),
    ]);

    const { stdout, stderr } = await execFileAsync("java", [
      "-jar", OPENSTEGO_JAR, "embed",
      "-mf", messagePath,
      "-cf", coverPath,
      "-sf", stegoPath,
      "-p", getStegoPassword(),
    ]);

    if (!fsSync.existsSync(stegoPath)) {
      throw new Error(`OpenStego embed failed: ${(stderr || stdout).trim()}`);
    }
    return fs.readFile(stegoPath);
  });

// Returns the embedded text, or null if the image has no (readable) watermark
export const extractPayload = (imageBuffer) =>
  withTempDir(async (dir) => {
    const stegoPath = path.join(dir, "stego.png");
    await fs.writeFile(stegoPath, imageBuffer);

    try {
      await execFileAsync("java", [
        "-jar", OPENSTEGO_JAR, "extract",
        "-sf", stegoPath,
        "-xd", dir,
        "-xf", "payload.txt",
        "-p", getStegoPassword(),
      ]);
      return await fs.readFile(path.join(dir, "payload.txt"), "utf-8");
    } catch {
      return null;
    }
  });

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

/**
 * Signs the bottom-right corner with "© @userName", sized to the image and
 * readable on both light and dark artwork.
 */
export const applyVisibleWatermark = async (buffer, userName) => {
  // Bake EXIF orientation in first so the overlay matches what viewers see
  const { data, info } = await sharp(buffer)
    .rotate()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Small signature in the bottom-right corner, like artists sign their work.
  // The invisible payload and perceptual hashes do the real protection.
  const fontSize = Math.max(12, Math.round(Math.min(width, height) / 40));
  const margin = Math.round(fontSize * 1.2);
  const label = escapeXml(`© @${userName}`);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <text x="${width - margin}" y="${height - margin}" text-anchor="end"
        font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600"
        fill="#ffffff" fill-opacity="0.75" stroke="#000000" stroke-opacity="0.35"
        stroke-width="${Math.max(1, fontSize / 18)}" paint-order="stroke">${label}</text>
    </svg>`;

  // PNG keeps the pixels lossless so the LSB payload survives until delivery
  return sharp(data, { raw: { width, height, channels } })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
};
