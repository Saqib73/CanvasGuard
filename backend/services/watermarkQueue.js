import { Notification } from "../model/Notification.js";
import { Post } from "../model/Post.js";
import { watermarkMedia } from "./watermark.service.js";

/*
 * In-process queue for watermarking new posts in the background.
 *
 * The job state lives on the post itself (status: "processing"), so no extra
 * infrastructure is needed: if the server restarts mid-job, resumeWatermarkJobs()
 * finds the unfinished posts on boot and queues them again. Jobs run one at a time
 * because each one starts a Java (OpenStego) process.
 */
const queue = [];
const queued = new Set();
let running = false;

const notify = (userId, message, type = "info") =>
  Notification.create({ user: userId, message, type }).catch((err) =>
    console.warn("Failed to create watermark notification:", err.message)
  );

const processPost = async (postId) => {
  const post = await Post.findById(postId)
    .populate("media")
    .populate("author", "userName");
  if (!post || post.status !== "processing") return;

  try {
    if (post.media && !post.media.isWaterMarked) {
      await watermarkMedia(post.media, {
        userId: post.author._id.toString(),
        userName: post.author.userName,
      });
    }
    await Post.updateOne({ _id: post._id }, { status: "published" });
  } catch (err) {
    // Agreed behaviour: publish anyway (the image is still protected by its hashes)
    // and let the artist know the watermark is missing
    console.error(`Watermarking post ${postId} failed:`, err);
    await Post.updateOne({ _id: post._id }, { status: "published" });
    await notify(
      post.author._id,
      "Your post is live, but we couldn't add the watermark. It's still protected by theft detection.",
      "warning"
    );
  }
};

const runNext = async () => {
  if (running) return;
  running = true;
  while (queue.length) {
    const postId = queue.shift();
    try {
      await processPost(postId);
    } catch (err) {
      // e.g. the database was briefly unreachable: leave it "processing" for the next boot
      console.error(`Watermark job for post ${postId} crashed:`, err);
    } finally {
      queued.delete(postId);
    }
  }
  running = false;
};

export const enqueueWatermark = (postId) => {
  const id = postId.toString();
  if (queued.has(id)) return;
  queued.add(id);
  queue.push(id);
  runNext();
};

// Re-queues posts left "processing" by a restart
export const resumeWatermarkJobs = async () => {
  const pending = await Post.find({ status: "processing" }).select("_id").lean();
  pending.forEach((p) => enqueueWatermark(p._id));
  if (pending.length) console.log(`Resuming ${pending.length} watermark job(s)`);
};
