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


const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without an origin
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost
    if (origin === "http://localhost:5173") {
      return callback(null, true);
    }

    // Allow Vercel and Render deployments
    if (
      origin === "https://campus-maintainace-system.vercel.app" ||
      origin.endsWith(".vercel.app") ||
      origin.endsWith(".onrender.com")
    ) {
      return callback(null, true);
    }

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

app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  res.json({
    status: "ok",
    database: states[dbState] || "unknown",
    readyState: dbState,
    hasMongoUri: Boolean(process.env.MONGO_URI),
  });
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


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

// Local development only
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;