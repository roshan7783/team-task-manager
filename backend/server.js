require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// ─── Connect to Database ──────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Team Task Manager API is running 🚀" });
});

// ─── Serve Frontend ───────────────────────────────────────────────────────────
// Serve React frontend if the dist folder exists (works on Render/Railway)
const frontendDist = path.join(__dirname, "../frontend/dist");

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // All non-API routes serve index.html so React Router works
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
  console.log("✅ Serving frontend from", frontendDist);
} else {
  // No dist folder — dev mode, return 404 for unknown routes
  app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
  });
}

// ─── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});
