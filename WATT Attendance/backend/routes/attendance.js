const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");
const { Parser } = require("json2csv");

const Student = require("../models/Student");
const Staff = require("../models/Staff");
const Attendance = require("../models/Attendance");

// ✅ Helper: normalize date (set to midnight)
function dateOnly(d) {
  return new Date(dayjs(d).startOf("day").toISOString());
}

/**
 * 1) RFID device posts here to mark attendance
 * body: { rfid: "RFID123", timestamp: "2025-09-18T08:05:00" }
 */
router.post("/mark", async (req, res) => {
  try {
    const { rfid, timestamp } = req.body;
    if (!rfid || !timestamp)
      return res.status(400).json({ error: "rfid and timestamp required" });

    // find student first
    let person = await Student.findOne({ rfid });
    let role = "student";

    // if not student -> try staff
    if (!person) {
      person = await Staff.findOne({ rfid });
      role = "staff";
    }
    if (!person) return res.status(404).json({ error: "RFID not registered" });

    const date = dateOnly(timestamp);
    const personId = role === "student" ? person.studentId : person.staffId;

    let attendance = await Attendance.findOne({ personId, role, date });

    // --- If no record -> create check-in
    if (!attendance) {
      const checkInTime = new Date(timestamp);

      // Rule: after 08:15 = Late
      const startTime = dayjs(
        dayjs(checkInTime).format("YYYY-MM-DD") + "T08:15:00"
      );
      const status = dayjs(checkInTime).isAfter(startTime)
        ? "Late"
        : "Present";

      attendance = new Attendance({
        personId,
        role,
        name: person.name,
        className: person.className || null,
        date,
        status,
        checkIn: checkInTime,
        rfid,
      });

      await attendance.save();
      return res.json({ msg: "Check-in recorded", attendance });
    }

    // --- If record exists but no checkOut yet -> add checkout
    if (attendance && !attendance.checkOut) {
      attendance.checkOut = new Date(timestamp);
      await attendance.save();
      return res.json({ msg: "Check-out recorded", attendance });
    }

    // --- Already has both checkIn & checkOut
    return res.json({
      msg: "Already checked-in and out for today",
      attendance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2) Fetch attendance list
 * GET /api/attendance?role=student&className=10A&from=2025-09-01&to=2025-09-30
 */
router.get("/", async (req, res) => {
  try {
    const { role, className, from, to, status } = req.query;
    const q = {};
    if (role) q.role = role;
    if (className) q.className = className;
    if (status) q.status = status;

    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = dateOnly(from);
      if (to) q.date.$lte = dateOnly(to);
    }

    const results = await Attendance.find(q).sort({ date: -1 });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3) Summary counts
 * GET /api/attendance/summary?role=student&from=...&to=...
 */
router.get("/summary", async (req, res) => {
  try {
    const { role, from, to } = req.query;
    const q = {};
    if (role) q.role = role;
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = dateOnly(from);
      if (to) q.date.$lte = dateOnly(to);
    }

    const [present, late, absent, total] = await Promise.all([
      Attendance.countDocuments({ ...q, status: "Present" }),
      Attendance.countDocuments({ ...q, status: "Late" }),
      Attendance.countDocuments({ ...q, status: "Absent" }),
      Attendance.countDocuments(q),
    ]);

    const percentage =
      total === 0 ? 0 : Math.round((present / total) * 1000) / 10;

    res.json({ present, late, absent, total, percentage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4) Export CSV
 * GET /api/attendance/export?role=student&from=...&to=...
 */
router.get("/export", async (req, res) => {
  try {
    const { role, from, to } = req.query;
    const q = {};
    if (role) q.role = role;
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = dateOnly(from);
      if (to) q.date.$lte = dateOnly(to);
    }

    const data = await Attendance.find(q).sort({ date: -1 }).lean();
    if (!data.length)
      return res.status(404).json({ msg: "No records to export" });

    const fields = [
      "name",
      "personId",
      "role",
      "className",
      "date",
      "status",
      "checkIn",
      "checkOut",
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("attendance_export.csv");
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Most important line
module.exports = router;
