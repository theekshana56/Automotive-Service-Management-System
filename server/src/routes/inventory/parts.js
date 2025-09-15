import express from 'express';
import { body, validationResult } from 'express-validator';
import Part from '../../models/inventory/Part.js';
import { checkPartForLowStock } from '../../services/inventory/stockService.js';
import { logAudit } from '../../utils/logAudit.js';
import auth from '../../middleware/auth.js';

const router = express.Router();
const BARCODE_BASE = process.env.BARCODE_BASE || "https://barcodeapi.org/api/128";

// Validation rules
const createPartRules = [
  body("name").notEmpty().withMessage("name is required"),
  body("partCode").notEmpty().withMessage("partCode is required"),
  body("category").notEmpty().withMessage("category is required"),
  body("stock.onHand").optional().isInt({ min: 0 }),
  body("stock.minLevel").optional().isInt({ min: 0 }),
  body("stock.maxLevel").optional().isInt({ min: 0 }),
  body("stock.reorderLevel").optional().isInt({ min: 0 }),
];

const updatePartRules = [
  body("name").optional().notEmpty(),
  body("partCode").optional().notEmpty(),
  body("category").optional().notEmpty(),
  body("stock.onHand").optional().isInt({ min: 0 }),
  body("stock.minLevel").optional().isInt({ min: 0 }),
  body("stock.maxLevel").optional().isInt({ min: 0 }),
  body("stock.reorderLevel").optional().isInt({ min: 0 }),
];

// Public endpoint for PO form (no auth required)
router.get("/public", async (req, res, next) => {
  try {
    const parts = await Part.find({ isActive: true }).select('name partCode _id');
    res.json({ parts });
  } catch (err) {
    console.error('Error fetching parts for PO form:', err);
    res.status(500).json({ message: 'Failed to fetch parts' });
  }
});

// Create part
router.post("/", auth, createPartRules, async (req, res) => {
  try {
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
    }
    
    res.status(201).json(part);
  } catch (err) {
    console.error("createPart error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Low-stock endpoint
router.get("/low-stock", auth, async (req, res, next) => {
  try {
    console.log("🔍 Low-stock endpoint called");
    
    const parts = await Part.find({ isActive: true });
    console.log(`📦 Found ${parts.length} active parts`);
    
    const low = [];
    for (const part of parts) {
      try {
        const stock = part.stock || {};
        const onHand = stock.onHand || 0;
        const reorderLevel = stock.reorderLevel || 0;
        
        if (onHand <= reorderLevel) {
          low.push({
            _id: part._id,
            name: part.name,
            partCode: part.partCode,
            stock: part.stock,
            category: part.category,
            updatedAt: part.updatedAt
          });
        }
      } catch (partErr) {
        console.error(`❌ Error processing part ${part._id}:`, partErr.message);
      }
    }
    
    console.log(`⚠️ Found ${low.length} low-stock parts`);
    res.json({ total: low.length, items: low });
  } catch (e) {
    console.error("❌ Low-stock endpoint error:", e);
    next(e);
  }
});

// Manual low-stock scan trigger
router.post("/check-stock", auth, async (req, res) => {
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
});

// Main parts listing
router.get("/", auth, async (req, res, next) => {
  try {
    const { lowStock, q, page = 1, limit = 20, isActive } = req.query;
    const filter = {};
    if (typeof isActive === 'undefined') {
      filter.isActive = true;
    } else {
      filter.isActive = String(isActive) === 'true';
    }

    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { partCode: new RegExp(q, "i") },
        { category: new RegExp(q, "i") },
      ];
    }

    let parts = await Part.find(filter).sort({ name: 1 });

    // if ?lowStock=1, filter those
    if (String(lowStock) === "1") {
      parts = parts.filter((p) => {
        const stock = p.stock || {};
        const onHand = stock.onHand || 0;
        const reorderLevel = stock.reorderLevel || 0;
        return onHand <= reorderLevel;
      });
    }

    const start = (Number(page) - 1) * Number(limit);
    const paged = parts.slice(start, start + Number(limit));

    // low stock count for header UI
    const lowStockCount = parts.filter(p => (p.stock?.onHand || 0) <= (p.stock?.reorderLevel || 0)).length;

    res.json({ 
      total: parts.length, 
      items: paged,
      page: Number(page),
      pages: Math.ceil(parts.length / Number(limit)),
      lowStockCount
    });
  } catch (e) {
    next(e);
  }
});

// Get single part
router.get("/:id", auth, async (req, res) => {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) return res.status(404).json({ message: "Part not found" });
    res.json(part);
  } catch (err) {
    console.error("getPart error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update part
router.put("/:id", auth, updatePartRules, async (req, res) => {
  try {
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
      }
    }
    
    res.json(part);
  } catch (err) {
    console.error("updatePart error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Deactivate part (soft delete)
router.delete("/:id", auth, async (req, res) => {
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
});

// Hard delete part (irreversible)
router.delete('/:id/hard', auth, async (req, res) => {
  try {
    const oldPart = await Part.findById(req.params.id);
    if (!oldPart) return res.status(404).json({ message: 'Part not found' });
    await Part.findByIdAndDelete(req.params.id);

    await logAudit({
      userId: req.user?.id,
      entityType: 'Part',
      entityId: oldPart._id,
      action: 'hard_delete',
      before: oldPart,
      source: 'UI'
    });

    res.json({ message: 'Part permanently deleted' });
  } catch (err) {
    console.error('hardDeletePart error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reactivate part (soft restore)
router.patch('/:id/activate', auth, async (req, res) => {
  try {
    const oldPart = await Part.findById(req.params.id);
    const part = await Part.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!part) return res.status(404).json({ message: 'Part not found' });

    await logAudit({
      userId: req.user?.id,
      entityType: 'Part',
      entityId: part._id,
      action: 'restore',
      before: oldPart,
      after: part,
      source: 'UI'
    });

    res.json({ message: 'Part activated', part });
  } catch (err) {
    console.error('activatePart error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;