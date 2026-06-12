import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

/**
 * POST /api/ai/chat
 * Send a message to the AI assistant and get a response
 */
router.post("/chat", authRequired, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(500).json({ error: "AI service is not configured" });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Format conversation history for the API
    const formattedHistory = conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Create chat session with history
    const chat = model.startChat({ history: formattedHistory });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text();

    res.json({
      success: true,
      message: text,
      role: "assistant",
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ error: "Failed to process AI request" });
  }
});

/**
 * GET /api/ai/health
 * Check if AI service is configured and available
 */
router.get("/health", async (req, res) => {
  try {
    const isConfigured = !!process.env.GOOGLE_GEMINI_API_KEY;
    res.json({
      success: true,
      configured: isConfigured,
      service: "Google Gemini",
      model: "gemini-2.0-flash",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Service check failed" });
  }
});

export { router as aiRouter };
