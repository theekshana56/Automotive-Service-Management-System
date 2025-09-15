import express from 'express';
import { body, validationResult } from 'express-validator';
import Supplier from '../../models/inventory/Supplier.js';
import { logAudit } from '../../utils/logAudit.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

// Validation rules
const createSupplierRules = [
  body("name").notEmpty().withMessage("name is required"),
  body("email").isEmail().withMessage("valid email is required"),
];

const updateSupplierRules = [
  body("name").optional().notEmpty(),
  body("email").optional().isEmail().withMessage("valid email is required"),
];

// Public endpoint for PO form (no auth required)
router.get("/public", async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).select('name email _id');
    console.log('🔍 Server: Found suppliers:', suppliers.length, suppliers);
    res.json({ items: suppliers });
  } catch (err) {
    console.error('Error fetching suppliers for PO form:', err);
    res.status(500).json({ message: 'Failed to fetch suppliers' });
  }
});

// Create supplier
router.post("/", auth, createSupplierRules, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;
    const exists = await Supplier.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: "Supplier email already exists." });

    const supplier = await Supplier.create({ ...req.body, email: email.toLowerCase().trim() });
    
    // Audit log for create
    await logAudit({
      userId: req.user?.id,
      entityType: 'Supplier',
      entityId: supplier._id,
      action: 'create',
      after: supplier,
      source: 'UI'
    });
    
    res.status(201).json(supplier);
  } catch (err) {
    console.error("createSupplier error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// List suppliers
router.get("/", auth, async (req, res) => {
  try {
    const { q, isActive, page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const filter = {};
    if (typeof isActive !== "undefined") filter.isActive = isActive === "true";
    if (q) {
      filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Supplier.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Supplier.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("listSuppliers error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single supplier
router.get("/:id", auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    console.error("getSupplier error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update supplier
router.put("/:id", auth, updateSupplierRules, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const updates = { ...req.body };
    if (updates.email) updates.email = updates.email.toLowerCase().trim();

    if (updates.email) {
      const dup = await Supplier.findOne({
        _id: { $ne: req.params.id },
        email: updates.email,
      });
      if (dup) return res.status(409).json({ message: "Supplier email already exists." });
    }

    // Fetch old supplier for audit
    const oldSupplier = await Supplier.findById(req.params.id);
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    
    // Audit log for update
    await logAudit({
      userId: req.user?.id,
      entityType: 'Supplier',
      entityId: supplier._id,
      action: 'update',
      before: oldSupplier,
      after: supplier,
      source: 'UI'
    });
    
    res.json(supplier);
  } catch (err) {
    console.error("updateSupplier error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Deactivate supplier
router.delete("/:id", auth, async (req, res) => {
  try {
    // Fetch old supplier for audit
    const oldSupplier = await Supplier.findById(req.params.id);
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    
    // Audit log for deactivate (soft delete)
    await logAudit({
      userId: req.user?.id,
      entityType: 'Supplier',
      entityId: supplier._id,
      action: 'delete',
      before: oldSupplier,
      after: supplier,
      source: 'UI'
    });
    
    res.json({ message: "Supplier deactivated", supplier });
  } catch (err) {
    console.error("deactivateSupplier error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Hard delete supplier (irreversible)
router.delete('/:id/hard', auth, async (req, res) => {
  try {
    const oldSupplier = await Supplier.findById(req.params.id);
    if (!oldSupplier) return res.status(404).json({ message: 'Supplier not found' });
    await Supplier.findByIdAndDelete(req.params.id);

    await logAudit({
      userId: req.user?.id,
      entityType: 'Supplier',
      entityId: oldSupplier._id,
      action: 'hard_delete',
      before: oldSupplier,
      source: 'UI'
    });

    res.json({ message: 'Supplier permanently deleted' });
  } catch (err) {
    console.error('hardDeleteSupplier error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reactivate supplier
router.patch('/:id/activate', auth, async (req, res) => {
  try {
    const oldSupplier = await Supplier.findById(req.params.id);
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    await logAudit({
      userId: req.user?.id,
      entityType: 'Supplier',
      entityId: supplier._id,
      action: 'restore',
      before: oldSupplier,
      after: supplier,
      source: 'UI'
    });

    res.json({ message: 'Supplier activated', supplier });
  } catch (err) {
    console.error('activateSupplier error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;