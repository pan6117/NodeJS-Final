const express = require("express");
const router = express.Router();
const ChatRoom = require("../models/chatRoom");

// 新增聊天室表單
router.get("/new", (req, res) => {
  res.render("newChatRoom");
});

// 建立聊天室
router.post("/", async (req, res) => {
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

// 取得單一聊天室
router.get("/:id", async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.id);
    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }
    res.render("chatRoom", { chatRoom });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch chat room" });
  }
});

// 更新聊天室表單
router.get("/:id/edit", async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.id);
    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }
    res.render("editChatRoom", { chatRoom });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch chat room" });
  }
});

// 更新聊天室
router.put("/:id", async (req, res) => {
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

    res.redirect(`/chatrooms/${chatRoom._id}`);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to update chat room" });
  }
});

// 刪除聊天室
router.delete("/:id", async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findByIdAndRemove(req.params.id);
    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }
    res.json({ message: "Chat room deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete chat room" });
  }
});

module.exports = router;
