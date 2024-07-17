require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Dynamic schema
const dynamicSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

// Routes
app.get('/', (req, res) => {
  res.send('Hello from server');
});

app.get('/api/get-emg-data', async (req, res) => {
  const { database, collection } = req.query;
  console.log(`Attempting to query database: ${database}, collection: ${collection}`);
  
  if (!database || !collection) {
    return res.status(400).json({ success: false, error: 'Database and collection names are required' });
  }

  try {
    const db = mongoose.connection.useDb(database);
    const Model = db.model(collection, dynamicSchema);
    
    // Count documents
    const count = await Model.countDocuments();
    console.log(`Found ${count} documents in the collection`);
    
    // Find the most recent document
    const data = await Model.findOne().sort({ timestamp: -1 });
    
    if (!data) {
      console.log('No data found');
      return res.status(404).json({ 
        success: false, 
        error: 'EMG data not found in the specified database and collection',
        debug: { database, collection, documentCount: count }
      });
    }
    
    // Log a subset of the data for debugging
    console.log('Data found:', JSON.stringify({
      _id: data._id,
      timestamp: data.timestamp,
      emg_signals_length: data.emg_signals ? data.emg_signals.length : 'N/A'
    }));
    
    return res.json({ 
      success: true, 
      data: {
        _id: data._id,
        timestamp: data.timestamp,
        emg_signals: data.emg_signals,
        ed_mvc: data.ed_mvc,
        fd_mvc: data.fd_mvc,
        session_time: data.session_time,
        // Include other fields as needed
      }
    });
  } catch (error) {
    console.error(`Error in get-emg-data: ${error}`);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      debug: { database, collection, errorDetails: error.stack }
    });
  }
});

app.get('/api/test-data', async (req, res) => {
  const { database, collection } = req.query;
  console.log(`Test data query for database: ${database}, collection: ${collection}`);

  if (!database || !collection) {
    return res.status(400).json({ success: false, error: 'Database and collection names are required' });
  }

  try {
    const db = mongoose.connection.useDb(database);
    const Model = db.model(collection, dynamicSchema);
    const data = await Model.find().limit(5).sort({ timestamp: -1 });
    return res.json({ 
      success: true, 
      count: data.length,
      data: data.map(doc => ({
        _id: doc._id,
        timestamp: doc.timestamp,
        emg_signals_length: doc.emg_signals ? doc.emg_signals.length : 'N/A',
        ed_mvc: doc.ed_mvc,
        fd_mvc: doc.fd_mvc,
        session_time: doc.session_time
      }))
    });
  } catch (error) {
    console.error(`Error in test-data: ${error}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/get-count', async (req, res) => {
  const { database, collection } = req.query;
  console.log(`Get count query for database: ${database}, collection: ${collection}`);

  if (!database || !collection) {
    return res.status(400).json({ success: false, error: 'Database and collection names are required' });
  }

  try {
    const db = mongoose.connection.useDb(database);
    const Model = db.model(collection, dynamicSchema);
    const count = await Model.countDocuments();
    return res.json({ success: true, data: { count } });
  } catch (error) {
    console.error(`Error in get-count: ${error}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
