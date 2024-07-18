require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose
    .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log("Error connecting to MongoDB:", err);
    });

// Function to get the model for a specific collection
function getModel(dbName, collectionName) {
    const connection = mongoose.connection.useDb(dbName);
    return connection.model(collectionName, new mongoose.Schema({}, { strict: false }), collectionName);
}

// Routes
app.get("/", async (req, res) => {
    res.send("Hello from server");
});

app.get("/api/get-count", async (req, res) => {
    const { dbName, collectionName } = req.query;
    try {
        const Model = getModel(dbName, collectionName);
        const data = await Model.findOne({ count: { $exists: true } });
        return res.json({ success: true, data: data });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, error: error.message });
    }
});

app.get("/api/get-emg-data", async (req, res) => {
    const { dbName, collectionName } = req.query;
    try {
        const Model = getModel(dbName, collectionName);
        const data = await Model.findOne().sort({ timestamp: -1 });
        return res.json({ success: true, data: data });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, error: error.message });
    }
});

app.get("/api/get-raw-data", async (req, res) => {
    const { dbName, collectionName } = req.query;
    try {
        const Model = getModel(dbName, collectionName);
        const data = await Model.find({ count: { $exists: false } }).sort({ timestamp: -1 });
        return res.json({ success: true, data: data });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, error: error.message });
    }
});

app.get("/api/check-db-collection", async (req, res) => {
    const { dbName, collectionName } = req.query;
    try {
        const client = await mongoose.connection.getClient();
        const db = client.db(dbName);
        const collections = await db.listCollections({ name: collectionName }).toArray();
        
        if (collections.length > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to check database and collection' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
