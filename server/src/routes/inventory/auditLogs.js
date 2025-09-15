const express = require("express");
const router = express.Router();
const AuditLog = require("../models/AuditLog");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});

module.exports = router;
