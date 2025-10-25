import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { connectToMongoDB } from "./db/connectToMongoDB.js";
import auth from "./routes/auth.route.js";
import user from "./routes/user.route.js";
import comment from "./routes/comment.route.js";
import post from "./routes/post.route.js";
import cookies from "cookie-parser";
import cloudinary from "cloudinary";

const PORT = process.env.PORT;
const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.json());
app.use(cookies());

app.use("/api/v1/auth", auth);
app.use("/api/v1/user", user);
app.use("/api/v1/comment", comment);
app.use("/api/v1/posts", post);

app.listen(PORT, () => {
  connectToMongoDB();
  console.log(`app is listening on- ${PORT}`);
});
