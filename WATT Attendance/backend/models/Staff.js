const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  staffId: { type: String, required: true, unique: true },
  department: { type: String, default: null },
  rfid: { type: String, required: true, unique: true } // added RFID field
});

module.exports = mongoose.model("Staff", staffSchema);
