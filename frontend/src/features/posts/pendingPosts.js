import { useSyncExternalStore } from "react";
import toast from "react-hot-toast";
import { apiClient, getErrorMessage } from "../../lib/api-client";
import { queryClient } from "../../lib/query-client";
import { postKeys } from "./api/posts.keys";
import { profileKeys } from "../profiles/api/profiles.keys";
import { communityKeys } from "../communities/api/communities.keys";

/*
 * Posts that are still being sent, Twitter-style: the user goes back to the feed
 * right away while the upload (and then the background watermark) runs here.
 * Lives outside React so it keeps going across page changes.
 *
 * stage: "uploading" -> ("processing" while the server watermarks) -> removed
 *        "failed" keeps the form data so the user can retry
 */
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_MS = 5 * 60 * 1000;

let pending = [];
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener());
const update = (id, changes) => {
  pending = pending.map((p) => (p.id === id ? { ...p, ...changes } : p));
  emit();
};
const remove = (id) => {
  const item = pending.find((p) => p.id === id);
  if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
  pending = pending.filter((p) => p.id !== id);
  emit();
};

const refreshFeeds = () => {
  queryClient.invalidateQueries({ queryKey: postKeys.all });
  queryClient.invalidateQueries({ queryKey: profileKeys.all });
  queryClient.invalidateQueries({ queryKey: communityKeys.all });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Waits for the background watermark job, then reports how it went
const waitUntilLive = async (id, postId) => {
  const started = Date.now();
  while (Date.now() - started < MAX_POLL_MS) {
    await sleep(POLL_INTERVAL_MS);
    if (!pending.some((p) => p.id === id)) return; // discarded meanwhile
    try {
      const { data } = await apiClient.get(`/posts/${postId}`);
      if (data.post.status === "processing") continue;
      remove(id);
      refreshFeeds();
      if (data.post.media?.isWaterMarked) toast.success("Your post is live and watermarked");
      else toast("Your post is live, but the watermark couldn't be added. Check your notifications.", { icon: "⚠️" });
      return;
    } catch {
      // Network blip: keep polling until the time limit
    }
  }
  remove(id);
  refreshFeeds();
  toast("Still adding your watermark. The post will appear on your profile when it's ready.", { icon: "⏳" });
};

const send = async (id) => {
  const item = pending.find((p) => p.id === id);
  update(id, { stage: "uploading", progress: 0, error: null });
  try {
    const { data } = await apiClient.post("/posts/createPost", item.formData, {
      onUploadProgress: (e) => e.total && update(id, { progress: e.loaded / e.total }),
    });
    if (data.status === "processing") {
      update(id, { stage: "processing", progress: 1 });
      waitUntilLive(id, data.postId);
    } else {
      remove(id);
      refreshFeeds();
      toast.success("Posted");
    }
  } catch (err) {
    update(id, { stage: "failed", error: getErrorMessage(err, "Couldn't send your post") });
  }
};

/**
 * Starts sending a post. `formData` is what /posts/createPost expects;
 * `previewUrl` (an object URL) and `description` are only for the pending card.
 */
export const submitPost = (formData, { description = "", previewUrl = null, watermark = false } = {}) => {
  const id = crypto.randomUUID();
  pending = [{ id, formData, description, previewUrl, watermark, stage: "uploading", progress: 0 }, ...pending];
  emit();
  send(id);
};

export const retryPost = (id) => send(id);
export const discardPost = (id) => remove(id);

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => pending;

export const usePendingPosts = () => useSyncExternalStore(subscribe, getSnapshot);

// Warn before closing the tab while an upload is still in flight
window.addEventListener("beforeunload", (e) => {
  if (pending.some((p) => p.stage === "uploading")) e.preventDefault();
});
