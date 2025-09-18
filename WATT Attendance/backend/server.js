// backend/server.js (debug build)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const util = require("util");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connect (keep as you had)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err.message));

// small helper to detect router-like exports
function isRouter(m) {
  // Express Router is a function and also has a .stack array
  return typeof m === "function" || (m && Array.isArray(m.stack));
}

function checkAndUse(path, mountPoint) {
  try {
    const mod = require(path);
    console.log(`Loaded ${path} -> typeof: ${typeof mod}`);
    console.log(util.inspect(mod, { depth: 0, breakLength: 80 }));
    if (!isRouter(mod)) {
      throw new Error(`${path} does NOT export an Express router (bad export)`);
    }
    app.use(mountPoint, mod);
    console.log(`✔ mounted ${path} on ${mountPoint}`);
  } catch (err) {
    console.error(`✖ Error with ${path}:`, err.message);
    // rethrow so nodemon shows crash (we want to find the bad one)
    throw err;
  }
}

// Check each route file
console.log("🔁 Checking route modules...");
checkAndUse("./routes/auth", "/api/auth");
checkAndUse("./routes/students", "/api/students");
checkAndUse("./routes/staff", "/api/staff");
checkAndUse("./routes/attendance", "/api/attendance");

app.get("/", (req, res) => res.send("Backend is running... (debug)"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
