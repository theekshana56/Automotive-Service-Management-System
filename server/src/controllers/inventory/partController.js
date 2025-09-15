// server/controllers/partController.js
const { validationResult } = require("express-validator");
const Part = require("../../models/inventory/Part");
const { checkPartForLowStock } = require("../../services/inventory/stockService");
const { logAudit } = require("../../utils/logAudit");

const BARCODE_BASE = process.env.BARCODE_BASE || "https://barcodeapi.org/api/128";

exports.createPart = async (req, res) => {
  try {
    // validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { partCode } = req.body;
    const exists = await Part.findOne({ partCode: partCode?.toUpperCase().trim() });
    if (exists) return res.status(409).json({ message: "partCode already exists." });

    const payload = { ...req.body };
    payload.partCode = partCode.toUpperCase().trim();
    payload.barcodeUrl = `${BARCODE_BASE}/${encodeURIComponent(payload.partCode)}`;

    const part = await Part.create(payload);
    // Audit log for create
    await logAudit({
      userId: req.user?.id,
      entityType: 'Part',
      entityId: part._id,
      action: 'create',
      after: part,
      source: 'UI'
    });
    
    // Check for low stock after creation
    try {
      await checkPartForLowStock(part._id);
    } catch (lowStockErr) {
      console.warn("⚠️ Low-stock check failed after part creation:", lowStockErr.message);
      // Don't fail the creation, just log the warning
    }
    
    res.status(201).json(part);
  } catch (err) {
    console.error("createPart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listParts = async (req, res) => {
  try {
    const {
      q,
      category,
      isActive,
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;

    const filter = {};
    if (typeof isActive !== "undefined") filter.isActive = isActive === "true";
    if (category) filter.category = new RegExp(category, "i");
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { partCode: new RegExp(q, "i") },
        { category: new RegExp(q, "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Part.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Part.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("listParts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPart = async (req, res) => {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) return res.status(404).json({ message: "Part not found" });
    res.json(part);
  } catch (err) {
    console.error("getPart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updatePart = async (req, res) => {
  try {
    // validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const updates = { ...req.body };
    if (updates.partCode) {
      updates.partCode = updates.partCode.toUpperCase().trim();
      updates.barcodeUrl = `${BARCODE_BASE}/${encodeURIComponent(updates.partCode)}`;
    }

    // prevent duplicates on partCode if changed
    if (updates.partCode) {
      const dup = await Part.findOne({
        _id: { $ne: req.params.id },
        partCode: updates.partCode,
      });
      if (dup) return res.status(409).json({ message: "partCode already exists." });
    }

    // Fetch old part for audit
    const oldPart = await Part.findById(req.params.id);
    const part = await Part.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!part) return res.status(404).json({ message: "Part not found" });
    // Audit log for update
    await logAudit({
      userId: req.user?.id,
      entityType: 'Part',
      entityId: part._id,
      action: 'update',
      before: oldPart,
      after: part,
      source: 'UI'
    });
    
    // Check for low stock after update (if stock fields were changed)
    if (updates.stock) {
      try {
        await checkPartForLowStock(part._id);
      } catch (lowStockErr) {
        console.warn("⚠️ Low-stock check failed after part update:", lowStockErr.message);
        // Don't fail the update, just log the warning
      }
    }
    
    res.json(part);
  } catch (err) {
    console.error("updatePart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deactivatePart = async (req, res) => {
  try {
    // Fetch old part for audit
    const oldPart = await Part.findById(req.params.id);
    const part = await Part.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!part) return res.status(404).json({ message: "Part not found" });
    // Audit log for deactivate (soft delete)
    await logAudit({
      userId: req.user?.id,
      entityType: 'Part',
      entityId: part._id,
      action: 'delete',
      before: oldPart,
      after: part,
      source: 'UI'
    });
    res.json({ message: "Part deactivated", part });
  } catch (err) {
    console.error("deactivatePart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔎 Manual low-stock scan
exports.checkStockNow = async (req, res) => {
  try {
    const lowStockParts = await Part.find({
      isActive: true,
      "stock.reorderLevel": { $gt: 0 },
      $expr: { $lte: [{ $subtract: ["$stock.onHand", "$stock.reserved"] }, "$stock.reorderLevel"] }
    });

    if (lowStockParts.length === 0) {
      return res.json({ message: "✅ No low-stock parts detected right now." });
    }

    for (const part of lowStockParts) {
      await checkPartForLowStock(part._id);
    }

    res.json({
      message: `📦 Alerts sent for ${lowStockParts.length} low-stock part(s).`,
      parts: lowStockParts.map((p) => ({
        id: p._id,
        name: p.name,
        code: p.partCode,
        available: Math.max(0, (p.stock?.onHand || 0) - (p.stock?.reserved || 0)),
        reorderLevel: p.stock?.reorderLevel || 0
      }))
    });
  } catch (err) {
    console.error("🔥 Manual stock check failed:", err.message);
    res.status(500).json({ error: "Failed to run manual stock check" });
  }
};
