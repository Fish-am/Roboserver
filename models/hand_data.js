const mongoose = require("mongoose");

const createModel = (dbName, collectionName) => {
  const schema = new mongoose.Schema({}, { timestamps: true, strict: false });
  return mongoose.model(collectionName, schema, collectionName, { dbName });
};

module.exports = createModel;
