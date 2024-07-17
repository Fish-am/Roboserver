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
.then(async () => {
  console.log('Connected to MongoDB');
  const admin = mongoose.connection.db.admin();
  const dbInfo = await admin.listDatabases();
  console.log('Available databases:', dbInfo.databases.map(db => db.name));
})
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
    
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
    console.log('Current database:', db.name);
    
    const count = await Model.countDocuments();
    console.log(`Found ${count} documents in the collection`);
    
    const data = await Model.findOne().sort({ timestamp: -1 });
    
    if (!data) {
      console.log('No data found');
      return res.status(404).json({ 
        success: false, 
        error: 'EMG data not found in the specified database and collection',
        debug: { database, collection, documentCount: count, connectionState: mongoose.connection.readyState }
      });
    }
    
    console.log('Data found:', JSON.stringify(data));
    return res.json({ success: true, data: data });
  } catch (error) {
    console.error(`Error in get-emg-data: ${error}`);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      debug: { database, collection, errorDetails: error.stack, connectionState: mongoose.connection.readyState }
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

app.get('/api/get-specific-doc', async (req, res) => {
  const { database, collection, id } = req.query;
  console.log(`Attempting to query specific document in database: ${database}, collection: ${collection}, id: ${id}`);
  
  if (!database || !collection || !id) {
    return res.status(400).json({ success: false, error: 'Database, collection, and id are required' });
  }

  try {
    const db = mongoose.connection.useDb(database);
    const Model = db.model(collection, dynamicSchema);
    
    const data = await Model.findById(id);
    
    if (!data) {
      console.log('No data found for specific id');
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    
    console.log('Specific document found:', JSON.stringify(data));
    return res.json({ success: true, data: data });
  } catch (error) {
    console.error(`Error in get-specific-doc: ${error}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/insert-test-data', async (req, res) => {
  const { database, collection } = req.query;
  try {
    const db = mongoose.connection.useDb(database);
    const Model = db.model(collection, dynamicSchema);
    const testData = {
      emg_signals: [1, 2, 3, 4, 5],
      timestamp: new Date(),
      ed_mvc: 2.5,
      fd_mvc: 3.0,
      session_time: 60
    };
    const result = await Model.create(testData);
    res.json({ success: true, insertedId: result._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
