const mongoose = require("mongoose");

/**
 * Connect to MongoDB Atlas using the URI from environment variables.
 * Exits the process if connection fails — no point running without a DB.
 */
const connectDB = async () => {
  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    console.log("MONGO_URI:", process.env.MONGO_URI ? "✓ Set" : "✗ Not set");
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
