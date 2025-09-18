// routes/staff.js
const express = require("express");
const router = express.Router();
const Staff = require("../models/Staff");

// Create staff
router.post("/", async (req, res) => {
  try {
    const { name, staffId, rfid } = req.body;
    const s = new Staff({ name, staffId, rfid });
    await s.save();
    res.json({ msg: "Staff created", staff: s });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List staff
router.get("/", async (req, res) => {
  try {
    const list = await Staff.find().sort({ name: 1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
