import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { connectToMongoDB } from "./db/connectToMongoDB.js";
import auth from "./routes/auth.route.js";
import user from "./routes/user.route.js";
import comment from "./routes/comment.route.js";
import post from "./routes/post.route.js";
import commission from "./routes/commission.js";
import community from "./routes/community.route.js";
import cookies from "cookie-parser";
import cloudinary from "cloudinary";
import cors from "cors";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import { socketAuthenticator } from "./middleware/socketAuthenticator.middleware.js";
import { Server } from "socket.io";

const PORT = process.env.PORT;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5000",
      "https://canvasguard-1.onrender.com",
    ],
    credentials: true,
  },
});

const userSocketIds = new Map();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.set("io", io);

app.use(express.json());
app.use(cookies());

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use("/api/v1/auth", auth);
app.use("/api/v1/user", user);
app.use("/api/v1/comment", comment);
app.use("/api/v1/posts", post);
app.use("/api/v1/commissions", commission);
app.use("/api/v1/community", community);

io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, async (err) => {
    await socketAuthenticator(err, socket, next);
  });
});

io.on("connection", (socket) => {
  const user = socket.user;
  // console.log(`${user.name}user connected with -->`, socket.id);
  userSocketIds.set(user._id.toString(), socket.id);

  socket.on("notification", (data) => {
    console.log("New notification:", data);
    // Optionally show a toast or update state
  });

  socket.on("disconnect", () => {
    userSocketIds.delete(user._id.toString());
  });
});

server.listen(PORT, () => {
  connectToMongoDB();
  console.log(`app is listening on- ${PORT}`);
});

export { userSocketIds };
