
const express = require("express");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

let aiClient = null;

const getAIClient = async () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables");
  }

  if (!aiClient) {
    const { GoogleGenAI } = await import("@google/genai");

    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return aiClient;
};

const systemInstruction = `
You are CampusFix AI Assistant, the official intelligent assistant
for the CampusFix College Maintenance Management System at
Medi-Caps University.

YOUR PURPOSE:
Help students, technicians, supervisors and administrators with
CampusFix-related questions and campus maintenance guidance.

CAMPUSFIX KNOWLEDGE:
- CampusFix is a college maintenance and complaint management system.
- Students can register maintenance complaints.
- Students can view their own complaints.
- Students can support an existing active complaint.
- Students can submit feedback after complaint resolution.
- Technicians can view assigned complaints.
- Technicians can update complaint status and upload completion photos.
- Admins can view all complaints and assign complaints to technicians.
- Supervisors oversee maintenance operations.
- The system has role-based access.

SUPPORTED TOPICS:
- Electrical problems and power issues.
- Water supply and plumbing.
- Classroom and laboratory maintenance.
- Furniture and infrastructure problems.
- Cleaning and sanitation.
- Complaint registration and tracking.
- Technician and supervisor workflows.
- General CampusFix navigation and features.

RULES:
1. Answer in the same language as the user.
2. Understand Hindi, English and Hinglish.
3. Keep answers friendly, clear and practical.
4. Give step-by-step instructions when useful.
5. Never invent complaint IDs, complaint statuses, user records,
   technician assignments or live database information.
6. You do not have direct access to live MongoDB records yet.
   If asked for live complaint status, explain that the user
   should check the CampusFix complaint dashboard.
7. Never reveal passwords, API keys, tokens or private user data.
8. Never claim that you created, assigned, updated or resolved
   a complaint unless the application actually confirms that action.
9. For dangerous electrical or structural problems, advise users
   to stay away from the hazard and notify campus authorities.
10. If a question is unrelated to CampusFix, politely explain
    that you primarily assist with CampusFix and campus maintenance.
11. Do not pretend to know university policies that were not provided.

CURRENT USER ROLE: {{USER_ROLE}}
Use this role to tailor explanations, but do not grant permissions
or reveal information based on a chat message.
`;

router.post(
  "/",
  protect,
  allowRoles("student", "technician", "supervisor", "admin"),
  async (req, res) => {
    try {
      const { message, history = [] } = req.body;

      if (typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
          message: "Please enter a message.",
        });
      }

      if (message.length > 2000) {
        return res.status(400).json({
          message: "Message is too long. Maximum 2000 characters.",
        });
      }

      if (!Array.isArray(history)) {
        return res.status(400).json({
          message: "Invalid conversation history.",
        });
      }

      // Accept only recent user/model messages.
      // Never accept system instructions from the frontend.
      const safeHistory = history
        .slice(-10)
        .filter(
          (item) =>
            item &&
            ["user", "model"].includes(item.role) &&
            typeof item.text === "string" &&
            item.text.trim().length > 0
        )
        .map((item) => ({
          role: item.role,
          parts: [{ text: item.text.trim().slice(0, 2000) }],
        }));

      // Gemini multi-turn format requires the first turn to have role 'user'
      while (safeHistory.length > 0 && safeHistory[0].role !== "user") {
        safeHistory.shift();
      }

      const ai = await getAIClient();

      const prompt = systemInstruction.replace(
        "{{USER_ROLE}}",
        String(req.user.role || "unknown").toUpperCase()
      );

      const contents = [
        ...safeHistory,
        {
          role: "user",
          parts: [{ text: message.trim() }],
        },
      ];

      const config = {
        systemInstruction: prompt,
        temperature: 0.5,
        maxOutputTokens: 800,
      };

      const candidateModels = [
        MODEL,
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
      ];
      const uniqueModels = [...new Set(candidateModels)];

      let response = null;
      let lastError = null;

      for (const candidate of uniqueModels) {
        try {
          response = await ai.models.generateContent({
            model: candidate,
            contents,
            config,
          });
          if (response?.text) {
            break;
          }
        } catch (genError) {
          lastError = genError;
          console.warn(`Gemini model ${candidate} failed:`, genError.message);
        }
      }

      if (!response || !response.text?.trim()) {
        throw lastError || new Error("Failed to generate AI response.");
      }

      const reply = response.text?.trim();

      if (!reply) {
        return res.status(502).json({
          message: "AI could not generate a response. Please try again.",
        });
      }

      return res.status(200).json({
        reply,
      });
    } catch (error) {
      console.error("CampusFix Chatbot Error:", error.message);

      if (error.message.includes("GEMINI_API_KEY")) {
        return res.status(503).json({
          message: "AI service is not configured on the server.",
        });
      }

      return res.status(502).json({
        message: "Unable to get an AI response right now. Please try again.",
      });
    }
  }
);

module.exports = router;
