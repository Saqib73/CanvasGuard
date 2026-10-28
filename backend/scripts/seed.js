// Wipes the DEV database and fills it with realistic data: users, artist profiles,
// communities, image and text posts, likes, comments, follows, commissions,
// notifications, and a few "stolen" reposts for demoing theft detection.
//
// Usage: npm run seed
//        npm run seed -- --fresh-images   (ignore the upload cache, re-upload everything)
//
// Images go through the same pipeline as real uploads (Cloudinary, hashes, blur
// placeholder, watermark), and are cached in scripts/.seed-cache.json so re-running
// only rebuilds the database. Ids are derived from fixed keys, so cached watermarks
// (which embed the owner and media id) stay valid across runs.
import dotenv from "dotenv";
dotenv.config({ quiet: true });

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import axios from "axios";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { faker } from "@faker-js/faker";

import { User } from "../model/User.js";
import { ArtistProfile } from "../model/ArtistProfile.js";
import { Community } from "../model/Community.js";
import { Media } from "../model/Media.js";
import { Post } from "../model/Post.js";
import { Comment } from "../model/Comment.js";
import { CommissionDetail } from "../model/CommissionDetail.js";
import { Notification } from "../model/Notification.js";
import { UserOTPVerification } from "../model/UserOTPVerification.js";
import { generateImageHashes } from "../utils/hashUtils.js";
import { generateBlurPlaceholder } from "../utils/imageUtils.js";
import {
  OPENSTEGO_JAR,
  applyVisibleWatermark,
  buildPayload,
  embedPayload,
  signWatermark,
} from "../utils/watermarkUtils.js";

const MODELS = [User, ArtistProfile, Community, Media, Post, Comment, CommissionDetail, Notification, UserOTPVerification];

const PASSWORD = "123456";
const ARTIST_COUNT = 13;
const CUSTOMER_COUNT = 11;
const IMAGE_POST_COUNT = 70;
const TEXT_POST_COUNT = 18;
const COMMISSION_COUNT = 22;
const CONCURRENCY = 6;

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const daysAgo = (d) => new Date(NOW - d * DAY);

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(SCRIPT_DIR, ".seed-cache.json");
const SEED_FOLDER = `${process.env.CLOUDINARY_FOLDER || "dev"}/seed`;
const FRESH_IMAGES = process.argv.includes("--fresh-images");

faker.seed(42);

// ---------------------------------------------------------------------------
// Safety: never seed anything that could be production
// ---------------------------------------------------------------------------
const assertDevDatabase = () => {
  const url = process.env.MONGO_URL || "";
  // Database name from the URL path, e.g. mongodb://127.0.0.1:27017/canvasguard-dev
  const dbName = url.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/)?.[1] || "";
  const isLocal = /^mongodb:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url);
  if (!isLocal && !/dev/i.test(dbName)) {
    console.error(
      "Refusing to seed: MONGO_URL is not a local MongoDB and its database name doesn't contain 'dev'.\n" +
        "The seed WIPES the target database, so it only runs against a dev database."
    );
    process.exit(1);
  }
  return { isLocal, dbName: dbName || "test (default)" };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// Stable ObjectIds from a key, so the same seed entity always gets the same id
const oid = (key) =>
  new mongoose.Types.ObjectId(crypto.createHash("sha1").update(key).digest("hex").slice(0, 24));

const pick = (arr) => faker.helpers.arrayElement(arr);
const some = (arr, min, max) =>
  faker.helpers.arrayElements(arr, { min: Math.min(min, arr.length), max: Math.min(max, arr.length) });
const int = (min, max) => faker.number.int({ min, max });
const chance = (p) => faker.number.float({ min: 0, max: 1 }) < p;
const between = (start, end) => faker.date.between({ from: start, to: end });

const mapPool = async (items, limit, fn) => {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

const fetchBuffer = async (url, tries = 3) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const { data } = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 90_000,
        headers: { "User-Agent": "CanvasGuard-dev-seed" },
      });
      return Buffer.from(data);
    } catch (err) {
      if (err.response?.status === 404 || attempt >= tries) throw err;
    }
  }
};

const uploadBuffer = (buffer, publicId) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: SEED_FOLDER, public_id: publicId, overwrite: true, resource_type: "image" },
        (err, result) => (err ? reject(err) : resolve(result))
      )
      .end(buffer);
  });

// ---------------------------------------------------------------------------
// Upload cache
// ---------------------------------------------------------------------------
const cache = !FRESH_IMAGES && fs.existsSync(CACHE_PATH)
  ? JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"))
  : {};
const saveCache = () => fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 1));

let uploaded = 0;
let reused = 0;

// Uploads + hashes an image once; later runs reuse the stored result
const processImage = async (key, getBuffer, { hash = true } = {}) => {
  if (cache[key]) {
    reused++;
    return cache[key];
  }
  const buffer = await getBuffer();
  const [result, hashes, blurDataUrl] = await Promise.all([
    uploadBuffer(buffer, key.replace(/[^a-zA-Z0-9_-]/g, "_")),
    hash ? generateImageHashes(buffer) : null,
    generateBlurPlaceholder(buffer),
  ]);
  cache[key] = {
    public_id: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    blurDataUrl,
    ...(hashes || {}),
  };
  uploaded++;
  saveCache();
  process.stdout.write(".");
  return cache[key];
};

const canWatermark = () => {
  if (!fs.existsSync(OPENSTEGO_JAR)) return false;
  try {
    execFileSync("java", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

// Changing WATERMARK_SECRET invalidates cached watermarked images
const secretFingerprint = () =>
  crypto
    .createHash("sha256")
    .update(process.env.WATERMARK_SECRET || process.env.JWT_SECRET || "")
    .digest("hex")
    .slice(0, 8);

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
const ART_STYLES = [
  "Digital painting", "Anime", "Character design", "Concept art", "Watercolor",
  "Realism", "Pixel art", "Line art", "3D", "Oil painting", "Illustration",
  "Fantasy", "Portraits", "Landscapes", "Comics",
];
const DELIVERY_TIMES = ["3–5 days", "1 week", "1–2 weeks", "2–3 weeks", "About a month"];

const ARTIST_BIOS = [
  "Painting moody landscapes and quiet places. Commissions open most months.",
  "Character designer who loves bold colors and expressive faces.",
  "Watercolor and ink. Slow art, small details.",
  "Concept artist by day, fan art by night.",
  "Digital painter exploring light, fog and atmosphere.",
  "Pixel art, tiny worlds and cozy game scenes.",
  "Portraits that feel like someone you know.",
  "Fantasy illustrator. Dragons, ruins and long journeys.",
  "Comic artist working on my first graphic novel.",
  "I draw cats, plants and everything in between.",
  "Oil painter, mostly still lifes and city streets.",
  "3D artist making stylized environments.",
  "Line art lover. Clean lines, strong shapes.",
];
const CUSTOMER_BIOS = [
  "Art collector in progress.",
  "Here for the art, staying for the community.",
  "Tabletop RPG nerd looking for character art.",
  "I commission art of my OCs way too often.",
  "Just here to admire.",
  "Writer looking for book cover artists.",
];

const CAPTIONS = [
  "Finally finished this one after two weeks of tweaking the lighting.",
  "Quick study from this morning. Trying to loosen up my brushwork.",
  "Experimenting with a warmer palette, what do you think?",
  "This started as a 10 minute sketch and got out of hand.",
  "Color study, focusing on values first this time.",
  "A small piece for a friend's birthday.",
  "Still not sure if it's done, but I'm calling it.",
  "Practicing atmosphere and depth. Feedback welcome!",
  "My entry for this week's theme.",
  "Revisited an old piece. Two years of progress in one post.",
  "Late night painting session results.",
  "Trying out a new brush set, really happy with the textures.",
  "Commission for a lovely client, shared with permission.",
  "Studying composition from life. Simple shapes, big impact.",
  "Some cozy vibes for a rainy day.",
];
const HASHTAGS = [
  "#digitalart", "#illustration", "#painting", "#artstudy", "#sketch", "#colorstudy",
  "#conceptart", "#landscape", "#wip", "#artistsoninstagram", "#traditionalart", "#creative",
];
const STOLEN_CAPTIONS = [
  "My latest piece, took me forever!",
  "New art drop. All mine, please don't repost.",
  "Been working on this one all week.",
];
const TEXT_POSTS = [
  "How do you all deal with art block? I haven't finished a piece in weeks.",
  "Hot take: references are not cheating. Every artist uses them.",
  "What's one brush or tool you can't live without?",
  "Finally opened commissions! Check my profile if you're interested.",
  "Does anyone else spend more time picking colors than actually painting?",
  "Reminder to drink water and stretch your drawing hand.",
  "What's the best piece of art advice you've ever gotten?",
  "Thinking of switching from Procreate to Krita for desktop work. Thoughts?",
  "Someone reposted my art without credit again. Glad this place can catch that.",
  "Weekly challenge idea: draw your favorite place from memory.",
  "How do you price commissions when you're just starting out?",
  "Traditional or digital, which do you enjoy more?",
  "Anyone up for an art trade this month?",
  "Just hit one year of drawing every day!",
  "What music do you listen to while drawing?",
  "Tips for drawing hands that don't look like potatoes?",
  "Show me your sketchbook, I need inspiration.",
  "Learning perspective is humbling.",
];
const COMMENTS = [
  "This is gorgeous!", "The lighting here is incredible.", "Love the colors.",
  "How long did this take you?", "The composition is so good.", "Wow, the details!",
  "This made my day.", "What brushes did you use?", "Absolutely stunning work.",
  "The mood in this is perfect.", "I keep coming back to this one.", "So much atmosphere.",
  "Teach me your ways.", "This deserves way more likes.", "Beautiful as always!",
  "The textures are amazing.", "Saving this for inspiration.",
];
const COMMISSION_DESCRIPTIONS = [
  "A portrait of my two cats sitting on a windowsill, cozy evening light.",
  "Character art of my D&D ranger, full body, forest background.",
  "A book cover for a fantasy novel: a lighthouse on a cliff during a storm.",
  "Couple portrait for an anniversary gift, in your usual style.",
  "My original character in a city at night, neon colors.",
  "A landscape of the mountains where we got engaged.",
  "Pet portrait of my golden retriever, simple background.",
  "Album cover art, surreal and dreamy, lots of blues.",
];

const COMMUNITIES = [
  { key: "digital", name: "Digital Painters", description: "Brushes, workflows and works in progress from digital painters.", rules: "Credit references. Be kind with critique." },
  { key: "anime", name: "Anime & Manga Art", description: "Fan art, original characters and manga-style illustration.", rules: "Tag spoilers. No AI-generated art." },
  { key: "watercolor", name: "Watercolor Corner", description: "Wet-on-wet, washes, and everything watercolor.", rules: "Traditional media only." },
  { key: "concept", name: "Concept Art Lab", description: "Environments, characters and props for games and film.", rules: "Share process when you can." },
  { key: "pixel", name: "Pixel Pushers", description: "Pixel art, sprites and tiny animations.", rules: "Post at integer scale, please." },
  { key: "sketchbook", name: "Sketchbook Daily", description: "Daily sketches, studies and practice. Progress over perfection.", rules: "Any skill level welcome." },
];

const IMAGE_SIZES = [[1200, 900], [900, 1200], [1000, 1000], [1200, 800], [960, 1200]];

// ---------------------------------------------------------------------------
// Plan everything with faker first (deterministic), then do the slow I/O
// ---------------------------------------------------------------------------
const usedUserNames = new Set();
const usedEmails = new Set();

const makeUserName = (first, last) => {
  for (;;) {
    const base = faker.internet
      .username({ firstName: first, lastName: last })
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, "")
      .slice(0, 18);
    const name = base.length >= 3 ? base : `${base}art${int(10, 99)}`;
    if (!usedUserNames.has(name)) {
      usedUserNames.add(name);
      return name;
    }
  }
};

const makeEmail = (first, last) => {
  for (;;) {
    const email = faker.internet.email({ firstName: first, lastName: last, provider: "example.com" }).toLowerCase();
    if (!usedEmails.has(email)) {
      usedEmails.add(email);
      return email;
    }
  }
};

const planUsers = () => {
  const users = [{
    key: "user:demo",
    name: "Raaina Whalla",
    userName: "raaina",
    email: "demo@canvasguard.dev",
    isArtist: true,
    bio: "Digital painter and the person behind CanvasGuard. This is the demo account, poke around!",
    avatar: null,
    createdAt: daysAgo(120),
  }];
  usedUserNames.add("raaina");
  usedEmails.add("demo@canvasguard.dev");

  for (let i = 0; i < ARTIST_COUNT + CUSTOMER_COUNT; i++) {
    const isArtist = i < ARTIST_COUNT;
    const sex = faker.person.sexType();
    const first = faker.person.firstName(sex);
    const last = faker.person.lastName();
    users.push({
      key: `user:${i}`,
      name: `${first} ${last}`,
      userName: makeUserName(first, last),
      email: makeEmail(first, last),
      isArtist,
      bio: isArtist ? ARTIST_BIOS[i % ARTIST_BIOS.length] : pick(CUSTOMER_BIOS),
      // ~30% keep the initials placeholder, like real users who skip the photo
      avatar: chance(0.7)
        ? `https://randomuser.me/api/portraits/${sex === "female" ? "women" : "men"}/${int(1, 95)}.jpg`
        : null,
      createdAt: between(daysAgo(110), daysAgo(60)),
    });
  }
  return users.map((u) => ({ ...u, _id: oid(u.key) }));
};

const main = async () => {
  const target = assertDevDatabase();
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const watermarking = canWatermark();
  if (!watermarking) console.warn("Java or the OpenStego jar is missing: seeding without watermarked posts.");

  // ---- Users, artists, communities ----
  const users = planUsers();
  const demo = users[0];
  const artists = users.filter((u) => u.isArtist);
  const others = users.slice(1);

  const profiles = artists.map((u) => ({
    _id: oid(`profile:${u.key}`),
    user: u._id,
    artStyles: some(ART_STYLES, 2, 4),
    baseFee: int(6, 100) * 50,
    deliveryTime: pick(DELIVERY_TIMES),
    bio: u.bio.slice(0, 200),
    openForCommission: u === demo || chance(0.75),
    rating: faker.number.float({ min: 3.6, max: 5, fractionDigits: 1 }),
    slotsAvailable: int(0, 5),
    createdAt: u.createdAt,
  }));
  const profileByUser = new Map(profiles.map((p) => [p.user.toString(), p]));

  const communities = COMMUNITIES.map((c) => {
    const createdBy = c.key === "sketchbook" ? demo : pick(artists);
    const members = new Set([createdBy, ...some(others, 4, 14)]);
    if (c.key === "digital" || c.key === "concept") members.add(demo);
    return {
      ...c,
      _id: oid(`community:${c.key}`),
      createdBy,
      members: [...members],
      createdAt: between(new Date(createdBy.createdAt), daysAgo(50)),
    };
  });
  const communitiesOf = (user) => communities.filter((c) => c.members.includes(user));

  // ---- Image posts ----
  const imageIds = faker.helpers.shuffle(Array.from({ length: 300 }, (_, i) => i * 3 + 10));
  const authorsForImages = [
    ...Array(6).fill(demo),
    ...Array.from({ length: IMAGE_POST_COUNT - 6 }, () => pick(artists.slice(1))),
  ];
  const imagePosts = authorsForImages.map((author, i) => {
    const [w, h] = pick(IMAGE_SIZES);
    const myCommunities = communitiesOf(author);
    return {
      key: `post:image:${i}`,
      author,
      source: { w, h },
      candidates: imageIds.slice(i * 4, i * 4 + 4), // fallbacks if a picsum id doesn't exist
      watermark: watermarking && (author === demo ? i < 3 : chance(0.2)),
      description: `${pick(CAPTIONS)} ${some(HASHTAGS, 1, 3).join(" ")}`,
      community: myCommunities.length && chance(0.3) ? pick(myCommunities) : null,
      createdAt: between(new Date(Math.max(author.createdAt, NOW - 45 * DAY)), daysAgo(1)),
    };
  });

  // "Stolen" reposts: cropped, recompressed copies uploaded later by someone else.
  // Two of them copy the demo account's art so the theft report can be shown off.
  const stolenPlan = [
    imagePosts[0], imagePosts[3],
    ...some(imagePosts.slice(6), 3, 3),
  ].map((original, i) => ({
    key: `post:stolen:${i}`,
    original,
    author: pick(others.filter((u) => u !== original.author)),
    crop: pick([{ ratio: 4 / 5, scale: 0.85 }, { ratio: 1, scale: 0.8 }, { ratio: 4 / 3, scale: 0.9 }]),
    description: `${pick(STOLEN_CAPTIONS)} ${some(HASHTAGS, 1, 2).join(" ")}`,
    delayDays: int(2, 10),
  }));

  // ---- Text posts ----
  const textPosts = TEXT_POSTS.slice(0, TEXT_POST_COUNT).map((text, i) => {
    const author = pick(users);
    const myCommunities = communitiesOf(author);
    return {
      key: `post:text:${i}`,
      author,
      description: text,
      community: myCommunities.length && chance(0.35) ? pick(myCommunities) : null,
      createdAt: between(new Date(Math.max(author.createdAt, NOW - 40 * DAY)), daysAgo(0.2)),
    };
  });

  // ---- Follows ----
  const following = new Map(users.map((u) => [u, new Set()]));
  for (const u of users) {
    for (const t of some(users.filter((x) => x !== u), 3, 10)) following.get(u).add(t);
  }
  for (const u of some(others, 12, 12)) following.get(u).add(demo);
  for (const t of some(others, 8, 8)) following.get(demo).add(t);

  // ---- Commissions ----
  const openArtists = artists.filter((a) => profileByUser.get(a._id.toString()).openForCommission);
  const commissionPlan = Array.from({ length: COMMISSION_COUNT }, (_, i) => {
    const artist = i < 5 ? demo : i < 7 ? pick(openArtists.filter((a) => a !== demo)) : pick(openArtists);
    const customer = i >= 5 && i < 7 ? demo : pick(users.filter((u) => u !== artist && u !== demo));
    const status = i < 5 ? ["pending", "pending", "accepted", "accepted", "declined"][i] : pick(["pending", "pending", "accepted", "declined"]);
    const profile = profileByUser.get(artist._id.toString());
    return {
      _id: oid(`commission:${i}`),
      customer,
      artist,
      status,
      artStyle: pick(profile.artStyles),
      price: profile.baseFee + int(0, 20) * 50,
      description: pick(COMMISSION_DESCRIPTIONS),
      withReference: chance(0.5),
      deadline: new Date(NOW + int(10, 60) * DAY),
      shipping: {
        country: faker.location.country(),
        state: faker.location.state(),
        city: faker.location.city(),
        postal: faker.location.zipCode(),
      },
      createdAt: between(daysAgo(30), daysAgo(0.5)),
    };
  });

  // ---- Slow part: download, watermark, upload, hash ----
  console.log(`Seeding ${target.isLocal ? "local" : "remote"} database "${target.dbName}"`);
  console.log(`Images: Cloudinary folder "${SEED_FOLDER}"${Object.keys(cache).length ? ", reusing cache" : ""}`);

  const sourceBuffers = new Map();
  const sourceFor = async (post) => {
    if (!sourceBuffers.has(post.key)) {
      sourceBuffers.set(post.key, (async () => {
        for (const id of post.candidates) {
          try {
            return await fetchBuffer(`https://picsum.photos/id/${id}/${post.source.w}/${post.source.h}.jpg`);
          } catch (err) {
            if (err.response?.status !== 404) throw err;
          }
        }
        throw new Error(`No picsum image found for ${post.key}`);
      })());
    }
    return sourceBuffers.get(post.key);
  };

  const fingerprint = secretFingerprint();
  await mapPool(imagePosts, CONCURRENCY, async (post) => {
    post.mediaId = oid(`media:${post.key}`);
    if (!post.watermark) {
      post.image = await processImage(post.key, () => sourceFor(post));
      return;
    }
    // Same steps as POST /posts/watermark: visible signature, then the signed payload
    post.image = await processImage(`${post.key}:wm:${fingerprint}`, async () => {
      const visible = await applyVisibleWatermark(await sourceFor(post), post.author.userName);
      return embedPayload(visible, buildPayload(post.author._id.toString(), post.mediaId.toString()));
    });
    post.signature = signWatermark(post.author._id.toString(), post.mediaId.toString());
  });

  await mapPool(stolenPlan, CONCURRENCY, async (stolen) => {
    stolen.mediaId = oid(`media:${stolen.key}`);
    stolen.image = await processImage(`${stolen.key}:${stolen.original.image.public_id}`, async () => {
      // Start from what was actually posted, so watermarked originals are copied with their mark
      const posted = await fetchBuffer(stolen.original.image.url);
      const { width, height } = await sharp(posted).metadata();
      let w = width * stolen.crop.scale;
      let h = height * stolen.crop.scale;
      if (w / h > stolen.crop.ratio) w = h * stolen.crop.ratio;
      else h = w / stolen.crop.ratio;
      return sharp(posted)
        .extract({
          left: Math.round((width - w) / 2),
          top: Math.round((height - h) / 2),
          width: Math.round(w),
          height: Math.round(h),
        })
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 65 })
        .toBuffer();
    });
  });

  const avatarUsers = users.filter((u) => u.avatar);
  await mapPool(avatarUsers, CONCURRENCY, async (u) => {
    u.profilePic = await processImage(`avatar:${u.key}:${path.basename(path.dirname(u.avatar))}-${path.basename(u.avatar, ".jpg")}`, () => fetchBuffer(u.avatar), { hash: false });
  });
  console.log(`\nImages: ${uploaded} uploaded, ${reused} reused from cache`);

  // ---- Build documents ----
  const media = [];
  const posts = [];
  const addImagePost = (p, { isWaterMarked, signature, createdAt }) => {
    const { public_id, url, width, height, format, blurDataUrl, sha256, phash, phashVariants, phashBands } = p.image;
    media.push({
      _id: p.mediaId, userId: p.author._id, type: "image", isWaterMarked, signature,
      public_id, url, width, height, format, blurDataUrl, sha256, phash, phashVariants, phashBands,
      createdAt, updatedAt: createdAt,
    });
    posts.push({
      _id: oid(p.key), author: p.author, description: p.description, media: p.mediaId,
      isArt: true, community: p.community, createdAt,
    });
  };
  for (const p of imagePosts) {
    addImagePost(p, { isWaterMarked: Boolean(p.watermark), signature: p.signature, createdAt: p.createdAt });
  }
  for (const s of stolenPlan) {
    const createdAt = new Date(Math.min(s.original.createdAt.getTime() + s.delayDays * DAY, NOW - DAY / 4));
    addImagePost(s, { isWaterMarked: false, createdAt });
  }
  for (const t of textPosts) {
    posts.push({ _id: oid(t.key), author: t.author, description: t.description, isArt: false, community: t.community, createdAt: t.createdAt });
  }

  // Likes and comments (re-seed faker so they don't shift when images change)
  faker.seed(7);
  const comments = [];
  const notifications = [];
  for (const post of posts) {
    const likers = some(users.filter((u) => u !== post.author), 0, post.author === demo ? 18 : 12);
    post.likes = likers;
    for (const [i, author] of some(users, 0, 5).entries()) {
      const createdAt = between(post.createdAt, new Date(Math.min(post.createdAt.getTime() + 5 * DAY, NOW)));
      comments.push({ _id: oid(`comment:${post._id}:${i}`), postId: post._id, author, text: pick(COMMENTS), createdAt });
      if (post.author === demo && author !== demo) {
        notifications.push({ user: demo, type: "comment", message: `@${author.userName} commented on your post`, createdAt });
      }
    }
    if (post.author === demo) {
      for (const liker of likers.slice(0, 3)) {
        notifications.push({ user: demo, type: "like", message: `@${liker.userName} liked your post`, createdAt: between(post.createdAt, new Date(NOW)) });
      }
    }
  }
  notifications.push({ user: demo, type: "info", message: "Welcome to CanvasGuard! Watermark your art before posting to protect it.", createdAt: daysAgo(119) });

  const commissions = commissionPlan.map((c) => {
    const ref = c.withReference ? pick(imagePosts).image : null;
    return {
      _id: c._id,
      customerId: c.customer._id,
      artistId: c.artist._id,
      deadline: c.deadline,
      artStyle: c.artStyle,
      refrences: ref ? { public_id: ref.public_id, url: ref.url } : undefined,
      price: c.price,
      description: c.description,
      shippingDetails: c.shipping,
      status: c.status,
      isConfirmed: c.status === "accepted",
      createdAt: c.createdAt,
    };
  });

  // Users, with every denormalized array kept in sync with the other side
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const userDocs = users.map((u) => {
    const ref = (x) => x._id;
    const myPosts = posts.filter((p) => p.author === u);
    return {
      _id: u._id,
      name: u.name,
      userName: u.userName,
      email: u.email,
      password: passwordHash,
      bio: u.bio.slice(0, 200),
      isArtist: u.isArtist,
      verified: true,
      artistProfile: u.isArtist ? profileByUser.get(u._id.toString())._id : undefined,
      profilePic: u.profilePic
        ? { public_id: u.profilePic.public_id, url: u.profilePic.url, width: u.profilePic.width, height: u.profilePic.height, blurDataUrl: u.profilePic.blurDataUrl }
        : undefined,
      posts: myPosts.map(ref),
      comments: comments.filter((c) => c.author === u).map(ref),
      likedPosts: posts.filter((p) => p.likes.includes(u)).map(ref),
      communities: communities.filter((c) => c.members.includes(u)).map(ref),
      following: [...following.get(u)].map(ref),
      followers: users.filter((x) => following.get(x).has(u)).map(ref),
      createdAt: u.createdAt,
    };
  });

  for (const p of profiles) {
    p.portfolio = posts.filter((x) => x.author._id.equals(p.user) && x.media).slice(0, 8).map((x) => x._id);
  }

  const toIds = (doc, fields) => {
    const out = { ...doc };
    for (const f of fields) {
      const v = out[f];
      if (Array.isArray(v)) out[f] = v.map((x) => x?._id ?? x);
      else if (v?._id) out[f] = v._id;
    }
    return out;
  };

  // ---- Write ----
  await mongoose.connect(process.env.MONGO_URL);
  await mongoose.connection.db.dropDatabase();
  await Promise.all(MODELS.map((m) => m.createIndexes()));

  // Validate through the schemas (defaults included), then insert raw so the
  // backdated createdAt values aren't replaced by "now"
  const insert = async (Model, docs) => {
    const prepared = docs.map((d) => {
      const doc = new Model({ updatedAt: d.createdAt, ...d });
      const error = doc.validateSync();
      if (error) throw new Error(`${Model.modelName}: ${error.message}`);
      return doc.toObject({ depopulate: true });
    });
    if (prepared.length) await Model.collection.insertMany(prepared);
    return prepared.length;
  };

  const counts = {
    users: await insert(User, userDocs),
    artistProfiles: await insert(ArtistProfile, profiles),
    communities: await insert(Community, communities.map((c, i) => {
      // Cover: a post from the community itself, else any image
      const cover = (imagePosts.find((p) => p.community === c) ?? imagePosts[i]).image;
      return {
        _id: c._id, name: c.name, description: c.description, rules: c.rules,
        createdBy: c.createdBy._id, members: c.members.map((m) => m._id), createdAt: c.createdAt,
        coverArt: { public_id: cover.public_id, url: cover.url, width: cover.width, height: cover.height, blurDataUrl: cover.blurDataUrl },
      };
    })),
    media: await insert(Media, media.map((m) => toIds(m, ["userId"]))),
    posts: await insert(Post, posts.map((p) => toIds({ ...p, comments: comments.filter((c) => c.postId.equals(p._id)) }, ["author", "community", "likes", "comments"]))),
    comments: await insert(Comment, comments.map((c) => toIds(c, ["author"]))),
    commissions: await insert(CommissionDetail, commissions),
    notifications: await insert(Notification, notifications.map((n) => toIds(n, ["user"]))),
  };

  await mongoose.disconnect();

  console.log("\nSeeded:", counts);
  console.log(`\nEvery account's password is "${PASSWORD}". Demo login: raaina / ${PASSWORD}`);
  console.log("Artists:", artists.slice(1, 4).map((u) => u.userName).join(", "), "...");
  console.log("Customers:", others.filter((u) => !u.isArtist).slice(0, 3).map((u) => u.userName).join(", "), "...");
  console.log(
    "Theft demo: log in as raaina and report these posts by",
    stolenPlan.filter((s) => s.original.author === demo).map((s) => `@${s.author.userName}`).join(" and ")
  );
};

main().catch(async (err) => {
  console.error("\nSeed failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
