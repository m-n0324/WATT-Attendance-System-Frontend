const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  role: { type: String, enum: ["student", "staff"], required: true }, // student or staff
  personId: { type: String, required: true }, // studentId or staffId
  name: { type: String, required: true },
  className: { type: String, default: null }, // only for students
  date: { type: Date, required: true },
  status: { type: String, enum: ["Present", "Absent", "Late"], required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  rfid: { type: String, required: true }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
