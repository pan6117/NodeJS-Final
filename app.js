//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user");
require("./models/passport");
const ChatRoom = require("./models/chatRoom");
const chatRoomsRouter = require("./routes/chatrooms");
const methodOverride = require("method-override");
const socketio = require("socket.io");
const dotenv = require("dotenv");

dotenv.config(); // 加載.env檔案中的配置

const homeStartingContent = "This is a chatroom.";

const app = express();
const server = require("http").Server(app);
const io = socketio(server);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(methodOverride("_method"));

app.use(
  session({
    secret: process.env.SESSION_SECRET, // 使用環境變數中的 SESSION_SECRET
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/chatrooms", chatRoomsRouter);

const url = process.env.DB_URL; // 使用環境變數中的 DB_URL

mongoose
  .connect(url, { useNewUrlParser: true })
  .then(() => {
    console.log("Connected to finalDB.");
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/registration", (req, res) => {
  res.render("registration");
});

app.post("/registration", async (req, res) => {
  try {
    const { name, address, username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      address,
      username,
      password: hashedPassword,
    });
    await user.save();

    res.redirect("/home");
  } catch (error) {
    console.log(error);
    res.redirect("/registration");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  })
);

app.get("/profile", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("profile", { user: req.user });
  } else {
    res.redirect("/login");
  }
});

app.post("/profile", async (req, res) => {
  const { name, address, email, phone } = req.body;
  const userId = req.user._id;

  try {
    await User.findByIdAndUpdate(userId, { name, address, email, phone });
    res.redirect("/profile/success");
  } catch (error) {
    console.log(error);
    res.redirect("/profile");
  }
});

app.get("/profile/success", (req, res) => {
  res.render("profile-success");
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/home", async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find();
    res.render("home", { chatRooms });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch chat rooms" });
  }
});

/********************************************************/
// 建立聊天室
app.post("/chatrooms", async (req, res) => {
  try {
    const { name, description } = req.body;

    const chatRoom = new ChatRoom({
      name,
      description,
    });

    await chatRoom.save();

    res.redirect(`/chatrooms/${chatRoom._id}`);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to create chat room" });
  }
});

// 取得所有聊天室
app.get("/chatrooms", async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find();
    res.render("chatRooms", { chatRooms });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch chat rooms" });
  }
});

// 取得單一聊天室
app.get("/chatrooms/:id", async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.id);
    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }
    res.render("chatRoom", { chatRoom }); // 將 chatRoom.ejs 渲染並傳遞 chatRoom 物件
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch chat room" });
  }
});

// 更新聊天室
app.put("/chatrooms/:id", async (req, res) => {
  try {
    const { name, description } = req.body;

    const chatRoom = await ChatRoom.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );

    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    res.json(chatRoom);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to update chat room" });
  }
});

// 刪除聊天室
app.delete("/chatrooms/:id", async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findByIdAndRemove(req.params.id);
    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }
    res.json({ message: "Chat room deleted successfully" });
    //res.redirect("/chatrooms");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete chat room" });
  }
});

// Socket.io实时聊天室功能
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinChatRoom", (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`User joined chat room: ${chatRoomId}`);
  });

  socket.on("leaveChatRoom", (chatRoomId) => {
    socket.leave(chatRoomId);
    console.log(`User left chat room: ${chatRoomId}`);
  });

  socket.on("chatMessage", (data) => {
    const { chatRoomId, message } = data;
    io.to(chatRoomId).emit("message", { message });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
