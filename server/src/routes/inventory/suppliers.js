import express from 'express';
import { body, validationResult } from 'express-validator';
import Supplier from '../../models/inventory/Supplier.js';
import { logAudit } from '../../utils/logAudit.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

// Validation rules (expanded per spec)
const createSupplierRules = [
  // 1. Basic Company Information
  body('companyName').notEmpty().withMessage('companyName is required'),
  body('businessRegistrationNo').notEmpty().withMessage('businessRegistrationNo is required'),
  body('displayName').optional().isString(),
  body('website').optional().isString(),

  // 2. Primary Contact Information
  body('primaryContact.fullName').notEmpty().withMessage('primaryContact.fullName is required'),
  body('primaryContact.email').isEmail().withMessage('primaryContact.email must be valid'),
  body('primaryContact.phone').notEmpty().withMessage('primaryContact.phone is required'),
  body('primaryContact.position').optional().isString(),
  body('primaryContact.mobile').optional().isString(),

  // 3. Address Information
  body('addresses').isArray({ min: 1 }).withMessage('At least one address is required'),
  body('addresses.*.type').isIn(['HEAD_OFFICE', 'WAREHOUSE', 'BILLING']).withMessage('addresses.type invalid'),
  body('addresses.*.line1').notEmpty().withMessage('addresses.line1 is required'),
  body('addresses.*.city').notEmpty().withMessage('addresses.city is required'),
  body('addresses.*.country').notEmpty().withMessage('addresses.country is required'),

  // 4. Financial & Terms Information
  body('paymentTerms').notEmpty().withMessage('paymentTerms is required'),
  body('currency').notEmpty().withMessage('currency is required'),
  body('bankDetails').optional().isObject(),

  // 5. Product & Operational Information (suppliedCategories no longer required)
  body('suppliedCategories').optional().isArray(),
  body('leadTimeDays').optional().isInt({ min: 0 }).withMessage('leadTimeDays must be >= 0'),
];

const updateSupplierRules = [
  body('companyName').optional().notEmpty(),
  body('displayName').optional().isString(),
  body('businessRegistrationNo').optional().notEmpty(),
  body('website').optional().isString(),

  body('primaryContact.fullName').optional().notEmpty(),
  body('primaryContact.email').optional().isEmail(),
  body('primaryContact.phone').optional().notEmpty(),
  body('primaryContact.position').optional().isString(),
  body('primaryContact.mobile').optional().isString(),

  body('addresses').optional().isArray({ min: 1 }),
  body('addresses.*.type').optional().isIn(['HEAD_OFFICE', 'WAREHOUSE', 'BILLING']),
  body('addresses.*.line1').optional().notEmpty(),
  body('addresses.*.city').optional().notEmpty(),
  body('addresses.*.country').optional().notEmpty(),

  body('paymentTerms').optional().notEmpty(),
  body('currency').optional().notEmpty(),
  body('bankDetails').optional().isObject(),

  body('suppliedCategories').optional().isArray({ min: 1 }),
  body('leadTimeDays').optional().isInt({ min: 0 }),
];

// Public endpoint for PO form (no auth required)
router.get("/public", async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).select('companyName primaryContact.email _id');
    console.log('🔍 Server: Found suppliers:', suppliers.length, suppliers);
    
    // Map companyName to name for frontend compatibility
    const formattedSuppliers = suppliers.map(supplier => ({
      _id: supplier._id,
      name: supplier.companyName, // Map companyName to name for frontend
      companyName: supplier.companyName, // Keep original for backward compatibility
      email: supplier.primaryContact?.email
    }));
    
    // Return suppliers in the format expected by Purchase Order form
    res.json({ 
      suppliers: formattedSuppliers,
      items: formattedSuppliers // For backward compatibility
    });
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

    // prevent duplicate company + BRN
    const { companyName, businessRegistrationNo } = req.body;
    const exists = await Supplier.findOne({ companyName: companyName.trim(), businessRegistrationNo: businessRegistrationNo.trim() });
    if (exists) return res.status(409).json({ message: "Supplier with same company and BRN already exists." });

    const supplier = await Supplier.create({ ...req.body });
    
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
    const { 
      q, 
      search, 
      isActive, 
      page = 1, 
      limit = 10, 
      sort = "-createdAt", 
      showAll,
      status 
    } = req.query;

    const filter = {};
    
    // Handle active/inactive filter
    if (showAll === 'true' || typeof isActive === 'undefined') {
      // Show both active and inactive suppliers
      // Don't set isActive filter
    } else {
      filter.isActive = isActive === "true";
    }

    // Handle search filter (support both 'q' and 'search' parameters)
    const searchQuery = q || search;
    if (searchQuery) {
      filter.$or = [
        { companyName: { $regex: searchQuery, $options: 'i' } },
        { displayName: { $regex: searchQuery, $options: 'i' } },
        { 'primaryContact.fullName': { $regex: searchQuery, $options: 'i' } },
        { 'primaryContact.email': { $regex: searchQuery, $options: 'i' } },
        { 'primaryContact.phone': { $regex: searchQuery, $options: 'i' } },
        { 'primaryContact.mobile': { $regex: searchQuery, $options: 'i' } },
        { 'primaryContact.position': { $regex: searchQuery, $options: 'i' } },
        { businessRegistrationNo: { $regex: searchQuery, $options: 'i' } },
        { website: { $regex: searchQuery, $options: 'i' } },
        { paymentTerms: { $regex: searchQuery, $options: 'i' } },
        { currency: { $regex: searchQuery, $options: 'i' } },
        { notes: { $regex: searchQuery, $options: 'i' } },
        { 'addresses.city': { $regex: searchQuery, $options: 'i' } },
        { 'addresses.country': { $regex: searchQuery, $options: 'i' } },
        { 'bankDetails.bankName': { $regex: searchQuery, $options: 'i' } },
        { 'bankDetails.accountName': { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Handle status filter
    if (status) {
      switch (status) {
        case 'active':
          filter.isActive = true;
          break;
        case 'inactive':
          filter.isActive = false;
          break;
        default:
          // No filter applied
          break;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Supplier.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Supplier.countDocuments(filter),
    ]);

    // Map companyName to name for frontend compatibility
    const formattedItems = items.map(supplier => ({
      ...supplier.toObject(),
      name: supplier.companyName // Add name field for frontend compatibility
    }));

    res.json({
      suppliers: formattedItems, // Changed from 'items' to 'suppliers' to match frontend expectation
      items: formattedItems, // Keep both for backward compatibility
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
    // prevent duplicate company + BRN if changed
    if (updates.companyName || updates.businessRegistrationNo) {
      const dup = await Supplier.findOne({
        _id: { $ne: req.params.id },
        companyName: (updates.companyName || '').trim() || undefined,
        businessRegistrationNo: (updates.businessRegistrationNo || '').trim() || undefined,
      }).lean();
      if (dup) return res.status(409).json({ message: "Supplier with same company and BRN already exists." });
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