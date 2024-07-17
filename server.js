require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");


const app = express();
const port = process.env.PORT || 8000;

// Middleware
const cors = require('cors');
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });

// Dynamic schema
const dynamicSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

// Routes
app.get("/", async (req, res) => {
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
    if (!data) {
      return res.status(404).json({ success: false, error: "Count not found in the specified database and collection" });
    }
    return res.json({ success: true, data: data });
  } catch (error) {
    console.log(error);
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
    if (!data) {
      return res.status(404).json({ success: false, error: "EMG data not found in the specified database and collection" });
    }
    return res.json({ success: true, data: data });
  } catch (error) {
    console.log(error);
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
    if (data.length === 0) {
      return res.status(404).json({ success: false, error: "Raw data not found in the specified database and collection" });
    }
    return res.json({ success: true, data: data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});