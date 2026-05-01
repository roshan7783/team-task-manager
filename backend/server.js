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

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ─── CORS (only for API routes) ───────────────────────────────────────────────
// In production, frontend and backend are on the same domain so we allow all.
// In development, allow the Vite dev server origin.
// Apply CORS only to /api routes to avoid interfering with static file serving.

const corsMiddleware = cors({
  origin: true, // Allow all origins in production (frontend served by same Express)
  credentials: true,
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", corsMiddleware, require("./routes/authRoutes"));
app.use("/api/projects", corsMiddleware, require("./routes/projectRoutes"));
app.use("/api/tasks", corsMiddleware, require("./routes/taskRoutes"));
app.use("/api/dashboard", corsMiddleware, require("./routes/dashboardRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({ 
    success: true, 
    message: "Team Task Manager API is running 🚀",
    database: dbConnected ? "✅ Connected" : "❌ Disconnected",
    environment: process.env.NODE_ENV,
    mongoUri: process.env.MONGO_URI ? "✓ Set" : "✗ Not set"
  });
});

// ─── Serve Frontend ───────────────────────────────────────────────────────────
// Serve React frontend if the dist folder exists (works on Render/Railway)
const frontendDist = path.join(__dirname, "../frontend/dist");

console.log("Checking for frontend dist at:", frontendDist);
console.log("Dist exists:", fs.existsSync(frontendDist));

if (fs.existsSync(frontendDist)) {
  console.log("✅ Serving frontend from", frontendDist);
  app.use(express.static(frontendDist, { 
    maxAge: "1d",
    etag: false 
  }));
  // All non-API routes serve index.html so React Router works
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  console.log("⚠️  Frontend dist not found at", frontendDist);
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

// ─── Catch Unhandled Errors ───────────────────────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});
