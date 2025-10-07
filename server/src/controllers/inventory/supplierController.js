import Supplier from '../../models/inventory/Supplier';
// server/controllers/supplierController.js
const { validationResult } = require("express-validator");


export const createSupplier = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;
    const exists = await Supplier.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: "Supplier email already exists." });

    const supplier = await Supplier.create({ ...req.body, email: email.toLowerCase().trim() });
    res.status(201).json(supplier);
  } catch (err) {
    console.error("createSupplier error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const listSuppliers = async (req, res) => {
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
};

export const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    console.error("getSupplier error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSupplier = async (req, res) => {
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

    const supplier = await Supplier.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    console.error("updateSupplier error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deactivateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json({ message: "Supplier deactivated", supplier });
  } catch (err) {
    console.error("deactivateSupplier error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
