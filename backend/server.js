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
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // In production same-domain requests have no origin header — always allow
    if (!origin) return callback(null, true);
    // In production, allow all origins (frontend served by same Express)
    if (process.env.NODE_ENV === "production") return callback(null, true);
    // In development, allow configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
});

// Wrap CORS to catch errors
const corsWrapper = (req, res, next) => {
  corsMiddleware(req, res, (err) => {
    if (err) {
      console.error("CORS Error:", err.message);
      return res.status(403).json({ success: false, message: "CORS error" });
    }
    next();
  });
};

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", corsWrapper, require("./routes/authRoutes"));
app.use("/api/projects", corsWrapper, require("./routes/projectRoutes"));
app.use("/api/tasks", corsWrapper, require("./routes/taskRoutes"));
app.use("/api/dashboard", corsWrapper, require("./routes/dashboardRoutes"));

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
