  const express = require("express");
  const cors = require("cors");
  const mongoose = require("mongoose");
  require("dotenv").config();
  const studentRoutes = require("./routes/studentRoutes");
  const authRoutes = require("./routes/authRoutes");
  const complaintRoutes = require("./routes/complaintRoutes");
  const technicianRoutes = require("./routes/technicianRoutes");
  const adminRoutes = require("./routes/adminRoutes");
  const supervisorRoutes = require("./routes/supervisorRoutes");
  const notificationRoutes = require("./routes/notificationRoutes");
  const chatbotRoutes = require("./routes/chatbotRoutes");

  const { startReminderScheduler } = require("./services/reminderScheduler");
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
  const app = express();

  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://campus-maintainace-system.vercel.app",
    "https://ch9sf5lg-5173.inc1.devtunnels.ms",
  ];

  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests without an origin (Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured frontend origins
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com")
      ) {
        return callback(null, true);
      }

      console.error("Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };


  app.use(cors(corsOptions));
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("College Maintenance Server is running!");
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/technicians", technicianRoutes);
  app.use("/api/students", studentRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/supervisor", supervisorRoutes);
  app.use(
    "/api/notifications",
    notificationRoutes
  );
  app.use("/api/chatbot", chatbotRoutes);


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    // Start reminder scheduler only when server runs directly.
    if (require.main === module) {
      startReminderScheduler();
    }
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;