require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const createModel = require("./models/hand_data");

const app = express();
const port = process.env.PORT || 8000;

// Middleware
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

// Routes
app.get("/", async (req, res) => {
  res.send("Hello from server");
});

app.get("/api/get-data", async (req, res) => {
  const { dbName, collectionName } = req.query;

  if (!dbName || !collectionName) {
    return res.status(400).json({ success: false, error: "Database name and collection name are required" });
  }

  try {
    const Model = createModel(dbName, collectionName);
    const data = await Model.find().sort({ timestamp: -1 }).limit(100);
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
