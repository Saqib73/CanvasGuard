// One-off backfill for Media saved before crop hashes / band index / userId existed.
// Usage: npm run backfill:hashes            (writes)
//        npm run backfill:hashes -- --dry-run
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import mongoose from "mongoose";
import { Media } from "../model/Media.js";
import { Post } from "../model/Post.js";
import { generateImageHashes } from "../utils/hashUtils.js";

const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = 4;

const needsBackfill = {
  type: "image",
  $or: [
    { phashBands: { $exists: false } },
    { phashBands: { $size: 0 } },
    { userId: { $exists: false } },
  ],
};

const backfillOne = async (media) => {
  const update = {};

  if (!media.phashBands?.length) {
    const { data } = await axios.get(media.url, {
      responseType: "arraybuffer",
      timeout: 30000,
    });
    const { sha256, ...perceptual } = await generateImageHashes(Buffer.from(data));
    Object.assign(update, perceptual);
    // Keep the original sha256: it was taken from the uploaded bytes, not Cloudinary's copy
    if (!media.sha256) update.sha256 = sha256;
  }

  if (!media.userId) {
    const post = await Post.findOne({ media: media._id }).select("author").lean();
    if (post?.author) update.userId = post.author;
  }

  if (!DRY_RUN && Object.keys(update).length) {
    await Media.updateOne({ _id: media._id }, update);
  }
  return Object.keys(update);
};

const main = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  if (!DRY_RUN) await Media.createIndexes();

  const total = await Media.countDocuments(needsBackfill);
  console.log(`${total} media to backfill${DRY_RUN ? " (dry run)" : ""}`);

  const cursor = Media.find(needsBackfill).lean().cursor();
  let done = 0;
  let failed = 0;
  let batch = [];

  const flush = async () => {
    const results = await Promise.allSettled(batch.map(backfillOne));
    results.forEach((r, i) => {
      done++;
      if (r.status === "fulfilled") {
        console.log(`[${done}/${total}] ${batch[i].public_id}: ${r.value.join(", ") || "nothing to set"}`);
      } else {
        failed++;
        console.error(`[${done}/${total}] ${batch[i].public_id}: FAILED ${r.reason?.message}`);
      }
    });
    batch = [];
  };

  for await (const media of cursor) {
    batch.push(media);
    if (batch.length === CONCURRENCY) await flush();
  }
  if (batch.length) await flush();

  console.log(
    `Done. ${done - failed} ${DRY_RUN ? "would be updated" : "updated"}, ${failed} failed.`
  );
  if (failed) {
    console.log("Failed items are usually Media whose Cloudinary file was deleted (404); they can't be hashed.");
  }
  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
