const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./db");

const studentRoutes = require("./routes/studentRoutes");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const technicianRoutes = require("./routes/technicianRoutes");
const adminRoutes = require("./routes/adminRoutes");
const supervisorRoutes = require("./routes/supervisorRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const { checkDeadlines } = require("./services/reminderScheduler");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Middleware to ensure DB is connected before processing requests
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Database connection error in request:", error);
    res.status(500).json({ message: "Database connection error" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CampusFix API is running!" });
});

// Vercel Cron Endpoint for scheduled deadline reminders
app.get("/api/cron/reminders", async (req, res) => {
  try {
    await checkDeadlines();
    res.json({ success: true, message: "Deadline check executed successfully." });
  } catch (error) {
    console.error("Cron execution error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/supervisor", supervisorRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chatbot", chatbotRoutes);

module.exports = app;
