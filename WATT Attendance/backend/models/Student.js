const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  className: { type: String, required: true },  // renamed from 'class' to 'className'
  rfid: { type: String, required: true, unique: true } // added RFID field
});

module.exports = mongoose.model("Student", studentSchema);
