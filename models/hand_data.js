const mongoose = require("mongoose");
const handDataSchema = new mongoose.Schema(
  {},
  { timestamps: true },
  { strict: false }
);
// Create the model
const HandData = mongoose.model("HandData", handDataSchema, "hand_data", {
  dbName: "robotics_hand",
});

module.exports = HandData;