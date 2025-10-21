import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { connectToMongoDB } from "./db/connectToMongoDB.js";
import auth from "./routes/auth.route.js";
import user from "./routes/user.route.js";
import comment from "./routes/comment.route.js";
import post from "./routes/post.route.js";

const PORT = process.env.PORT;
const app = express();

app.use(express.json());

app.use("/api/v1/auth", auth);
app.use("/api/v1/user", user);
app.use("/api/v1/comment", comment);
app.use("/api/v1/posts", post);

app.listen(PORT, () => {
  connectToMongoDB();
  console.log(`app is listening on- ${PORT}`);
});
