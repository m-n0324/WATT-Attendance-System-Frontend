const express = require("express");
const router = express.Router();
const Student = require("../models/Student");

// Create student
router.post("/", async (req, res) => {
  try {
    const { name, studentId, className, rfid } = req.body;
    const s = new Student({ name, studentId, className, rfid });
    await s.save();
    res.json({ msg: "Student created", student: s });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List students
router.get("/", async (req, res) => {
  const list = await Student.find().sort({ name: 1 });
  res.json(list);
});

module.exports = router;
