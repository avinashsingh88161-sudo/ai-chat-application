import express from "express";
import Thread from "../models/Thread.js";
import { streamGeminiAIAPIResponse } from "../utils/gemini.js";

const router = express.Router();

// Get all threads
router.get("/thread", async (req, res) => {
  const { userId } = req.query;

  try {
    const query = userId ? { $or: [{ userId }, { userId: null }] } : {};
    const threads = await Thread.find(query).sort({ pinned: -1, updatedAt: -1 });
    res.status(200).json(threads);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// Get a specific thread
router.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOne({ threadId });
    if (!thread) {
      return res.status(404).json({ error: "Thread is not found" });
    }
    res.status(200).json(thread.messages);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

// Update a thread (rename title, pin/unpin)
router.patch("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;
  const { title, pinned } = req.body;

  try {
    const updateFields = {};
    if (typeof title === "string") updateFields.title = title.trim();
    if (typeof pinned === "boolean") updateFields.pinned = pinned;
    updateFields.updatedAt = new Date();

    const updatedThread = await Thread.findOneAndUpdate(
      { threadId },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!updatedThread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    res.status(200).json(updatedThread);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to update thread" });
  }
});

// Delete a thread
router.delete("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const deletedThread = await Thread.findOneAndDelete({ threadId });
    if (!deletedThread) {
      return res.status(404).json({ error: "Thread could not be found" });
    }
    res.status(200).json({ success: "Thread deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

router.post("/chat", async (req, res) => {
  const { threadId, message, userId } = req.body;

  if (!threadId || !message) {
    return res
      .status(400)
      .json({ error: "missing required fields: threadId and message" });
  }

  // Set SSE Headers for real-time streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    let thread = await Thread.findOne({ threadId });

    if (!thread) {
      // Create a new thread in DB
      thread = new Thread({
        threadId,
        userId: userId || null,
        title:
          message.length > 40 ? message.substring(0, 37) + "..." : message,
        messages: [{ role: "user", content: message }],
      });
    } else {
      if (userId && !thread.userId) {
        thread.userId = userId;
      }
      thread.messages.push({ role: "user", content: message });
    }

    // Format full conversation history for Gemini API (assistant -> model)
    const contents = thread.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Stream chunks directly to client as they arrive in real-time
    const assistantReply = await streamGeminiAIAPIResponse(
      contents,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    );

    // Save final complete message to database
    thread.messages.push({ role: "assistant", content: assistantReply });
    thread.updatedAt = new Date();
    await thread.save();

    // Signal stream complete
    res.write(
      `data: ${JSON.stringify({
        done: true,
        reply: assistantReply,
        threadId: thread.threadId,
      })}\n\n`
    );
    res.end();
  } catch (err) {
    console.error("Chat route streaming error:", err);
    res.write(
      `data: ${JSON.stringify({
        error: err.message || "Failed to generate reply",
      })}\n\n`
    );
    res.end();
  }
});

export default router;
