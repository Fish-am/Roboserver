require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });

// Dynamic schema for flexible document structure
const dynamicSchema = new mongoose.Schema({}, { strict: false });

// Routes
app.get("/", (req, res) => {
  res.send("Hello from server");
});

app.get("/api/get-count", async (req, res) => {
  const { database, collection } = req.query;
  if (!database || !collection) {
    return res.status(400).json({ success: false, error: "Database and collection names are required" });
  }

  try {
    const db = mongoose.connection.useDb(database);
    const Model = db.model(collection, dynamicSchema);
    const data = await Model.findOne({ count: { $exists: true } });
    console.log("Count data:", data);
    return res.json({ success: true, data: data });
  } catch (error) {
    console.error("Error in get-count:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/get-emg-data", async (req, res) => {
  const { database, collection } = req.query;
  if (!database || !collection) {
    return res.status(400).json({ success: false, error: "Database and collection names are required" });
  }

  try {
    const db = mongoose.connection.useDb(database);
    const Model = db.model(collection, dynamicSchema);
    const data = await Model.findOne().sort({ timestamp: -1 });
    console.log("EMG data found:", data ? "Yes" : "No");
    if (!data) {
      return res.status(404).json({ success: false, error: "No EMG data found" });
    }
    return res.json({ success: true, data: data });
  } catch (error) {
    console.error("Error in get-emg-data:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/get-raw-data", async (req, res) => {
  const { database, collection } = req.query;
  if (!database || !collection) {
    return res.status(400).json({ success: false, error: "Database and collection names are required" });
  }

  try {
    const db = mongoose.connection.useDb(database);
    const Model = db.model(collection, dynamicSchema);
    const data = await Model.find({ count: { $exists: false } }).sort({ timestamp: -1 });
    console.log("Raw data count:", data.length);
    return res.json({ success: true, data: data });
  } catch (error) {
    console.error("Error in get-raw-data:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
