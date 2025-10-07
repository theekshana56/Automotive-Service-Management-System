import express from 'express';
import PurchaseOrder from '../../models/inventory/PurchaseOrder.js';
import Part from '../../models/inventory/Part.js';
import Supplier from '../../models/inventory/Supplier.js';
import Capital from '../../models/finance/Capital.js';
import { logAudit } from '../../utils/logAudit.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

// Helper function to check user roles
const checkRole = (user, roles) => {
  if (!user || !user.role) return false;
  return roles.includes(user.role) || user.role === 'admin';
};

// Create new Purchase Order (Draft)
router.post('/', auth, async (req, res) => {
  try {
    const { supplier, items, expectedDeliveryDate, notes, deliveryAddress, paymentTerms } = req.body;
    
    // Validate supplier exists
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(400).json({ message: 'Supplier not found' });
    }
    
    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }
    
    // Validate parts exist
    for (const item of items) {
      const partExists = await Part.findById(item.part);
      if (!partExists) {
        return res.status(400).json({ message: `Part ${item.part} not found` });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be greater than 0' });
      }
      if (item.unitPrice < 0) {
        return res.status(400).json({ message: 'Unit price cannot be negative' });
      }
    }
    
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.totalPrice ? item.totalPrice : item.quantity * item.unitPrice);
    }, 0);

    const tax = req.body.tax || 0;
    const shipping = req.body.shipping || 0;
    const totalAmount = subtotal + tax + shipping;

    const purchaseOrder = new PurchaseOrder({
      supplier,
      items,
      expectedDeliveryDate,
      notes,
      deliveryAddress,
      paymentTerms,
      subtotal,
      tax,
      shipping,
      totalAmount,
      createdBy: req.user?.id || 'system'
    });

    await purchaseOrder.save();

    // Audit log for create
    await logAudit({
      userId: req.user?.id,
      entityType: 'PurchaseOrder',
      entityId: purchaseOrder._id,
      action: 'create',
      after: purchaseOrder,
      source: 'UI'
    });

    res.status(201).json({
      message: 'Purchase Order created successfully',
      purchaseOrder: await purchaseOrder.populate(['supplier', 'items.part'])
    });
    
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ message: 'Error creating purchase order', error: error.message });
  }
});

// Get all Purchase Orders with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    const { 
      status, 
      supplier, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (page - 1) * limit;
    
    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('supplier', 'companyName primaryContact.email primaryContact.phone')
      .populate('items.part', 'name partCode description')
      .populate('createdBy', 'name email')
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await PurchaseOrder.countDocuments(filter);
    
    res.json({
      purchaseOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ message: 'Error fetching purchase orders', error: error.message });
  }
});

// Get PO statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const stats = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const totalPOs = await PurchaseOrder.countDocuments();
    const totalValue = await PurchaseOrder.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    res.json({
      statusBreakdown: stats,
      totalPOs,
      totalValue: totalValue[0]?.total || 0
    });
    
  } catch (error) {
    console.error('Error fetching PO statistics:', error);
    res.status(500).json({ message: 'Error fetching PO statistics', error: error.message });
  }
});

// Get single Purchase Order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'companyName primaryContact.email primaryContact.phone addresses')
      .populate('items.part', 'name partCode description')
      .populate('createdBy', 'name email')
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name email');
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    
    res.json(purchaseOrder);
    
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ message: 'Error fetching purchase order', error: error.message });
  }
});

// Update Purchase Order (only if draft)
router.put('/:id', auth, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    
    if (!purchaseOrder.canEdit()) {
      return res.status(400).json({ 
        message: 'Purchase Order cannot be edited in current status. Only draft POs can be modified.' 
      });
    }
    
    // Store old state for audit
    const oldPO = purchaseOrder.toObject();
    
    // Update allowed fields
    const allowedUpdates = ['items', 'expectedDeliveryDate', 'notes', 'deliveryAddress', 'paymentTerms'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        purchaseOrder[field] = req.body[field];
      }
    });
    
    purchaseOrder.updatedBy = req.user?.id || 'system';
    
    await purchaseOrder.save();
    
    // Audit log for update
    await logAudit({
      userId: req.user?.id,
      entityType: 'PurchaseOrder',
      entityId: purchaseOrder._id,
      action: 'update',
      before: oldPO,
      after: purchaseOrder,
      source: 'UI'
    });
    
    res.json({
      message: 'Purchase Order updated successfully',
      purchaseOrder: await purchaseOrder.populate(['supplier', 'items.part'])
    });
    
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ message: 'Error updating purchase order', error: error.message });
  }
});

// Submit Purchase Order (Draft → Submitted)
router.patch('/:id/submit', auth, async (req, res) => {
  try {
    // Check if user has inventory manager role
    if (!checkRole(req.user, ['inventory_manager', 'manager'])) {
      return res.status(403).json({ 
        message: 'Access denied. Only users with Inventory Manager role can submit purchase orders.' 
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    
    if (!purchaseOrder.canSubmit()) {
      return res.status(400).json({ 
        message: 'Purchase Order cannot be submitted. Ensure it is in draft status and has items.' 
      });
    }
    
    // Store old state for audit
    const oldPO = purchaseOrder.toObject();
    
    // Capture security information
    purchaseOrder.ipAddress = req.ip || req.connection.remoteAddress;
    purchaseOrder.userAgent = req.get('User-Agent');
    purchaseOrder.lastModifiedBy = req.user.id;
    
    await purchaseOrder.submit(req.user.id);
    
    // Audit log for submit
    await logAudit({
      userId: req.user?.id,
      entityType: 'PurchaseOrder',
      entityId: purchaseOrder._id,
      action: 'update',
      before: oldPO,
      after: purchaseOrder,
      source: 'UI'
    });
    
    console.log(`📤 PO ${purchaseOrder.poNumber} submitted by: ${req.user.name} (${req.user.email})`);
    
    res.json({
      message: 'Purchase Order submitted successfully',
      purchaseOrder: await purchaseOrder.populate(['supplier', 'items.part'])
    });
    
  } catch (error) {
    console.error('Error submitting purchase order:', error);
    res.status(500).json({ message: 'Error submitting purchase order', error: error.message });
  }
});

// Approve Purchase Order (Submitted → Approved)
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    // Check if user has manager or finance_manager role
    if (!checkRole(req.user, ['manager', 'finance_manager'])) {
      return res.status(403).json({ 
        message: 'Access denied. Only users with Manager or Finance Manager role can approve purchase orders.' 
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    
    if (!purchaseOrder.canApprove()) {
      return res.status(400).json({ 
        message: 'Purchase Order cannot be approved. Ensure it is in submitted status.' 
      });
    }
    
    // Store old state for audit
    const oldPO = purchaseOrder.toObject();
    
    const body = req.body || {};
    if (body.approvalNotes) {
      purchaseOrder.approvalNotes = body.approvalNotes;
    }
    
    // Capture security information
    purchaseOrder.ipAddress = req.ip || req.connection.remoteAddress;
    purchaseOrder.userAgent = req.get('User-Agent');
    purchaseOrder.lastModifiedBy = req.user.id;
    
    await purchaseOrder.approve(req.user.id);
    
    // Deduct from capital if user is finance manager
    if (req.user.role === 'finance_manager' || req.user.role === 'admin') {
      try {
        const capital = await Capital.getOrCreate();
        await capital.spendCapital(
          purchaseOrder.totalAmount,
          `Purchase Order: ${purchaseOrder.poNumber} - ${purchaseOrder.supplier?.companyName || 'Unknown Supplier'}`,
          purchaseOrder._id,
          'PurchaseOrder',
          req.user.id
        );
        console.log(`💰 Capital deducted: $${purchaseOrder.totalAmount} for PO ${purchaseOrder.poNumber}`);
      } catch (capitalError) {
        console.error('Error deducting from capital:', capitalError);
        // Don't fail the approval if capital deduction fails
        // Just log the error
      }
    }
    
    // Audit log for approve
    await logAudit({
      userId: req.user?.id,
      entityType: 'PurchaseOrder',
      entityId: purchaseOrder._id,
      action: 'update',
      before: oldPO,
      after: purchaseOrder,
      source: 'UI'
    });
    
    console.log(`🔐 PO ${purchaseOrder.poNumber} approved by: ${req.user.name} (${req.user.email})`);
    
    res.json({
      message: 'Purchase Order approved successfully',
      purchaseOrder: await purchaseOrder.populate(['supplier', 'items.part'])
    });
    
  } catch (error) {
    console.error('Error approving purchase order:', error);
    res.status(500).json({ message: 'Error approving purchase order', error: error.message });
  }
});

// Reject Purchase Order (Submitted → Draft)
router.patch('/:id/reject', auth, async (req, res) => {
  try {
    // Check if user has manager or finance_manager role
    if (!checkRole(req.user, ['manager', 'finance_manager'])) {
      return res.status(403).json({ 
        message: 'Access denied. Only users with Manager or Finance Manager role can reject purchase orders.' 
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    
    if (purchaseOrder.status !== 'submitted') {
      return res.status(400).json({ 
        message: 'Purchase Order cannot be rejected. Ensure it is in submitted status.' 
      });
    }
    
    // Store old state for audit
    const oldPO = purchaseOrder.toObject();
    
    const body = req.body || {};
    if (body.rejectionNotes) {
      purchaseOrder.rejectionNotes = body.rejectionNotes;
    }
    
    // Capture security information
    purchaseOrder.ipAddress = req.ip || req.connection.remoteAddress;
    purchaseOrder.userAgent = req.get('User-Agent');
    purchaseOrder.lastModifiedBy = req.user.id;
    
    // Reject PO (set back to draft)
    purchaseOrder.status = 'draft';
    purchaseOrder.rejectedAt = new Date();
    purchaseOrder.rejectedBy = req.user.id;
    purchaseOrder.submittedAt = null;
    purchaseOrder.submittedBy = null;
    
    await purchaseOrder.save();
    
    // Audit log for reject
    await logAudit({
      userId: req.user?.id,
      entityType: 'PurchaseOrder',
      entityId: purchaseOrder._id,
      action: 'update',
      before: oldPO,
      after: purchaseOrder,
      source: 'UI'
    });
    
    console.log(`🔐 PO ${purchaseOrder.poNumber} rejected by: ${req.user.name} (${req.user.email})`);
    
    res.json({
      message: 'Purchase Order rejected successfully',
      purchaseOrder: await purchaseOrder.populate(['supplier', 'items.part'])
    });
    
  } catch (error) {
    console.error('Error rejecting purchase order:', error);
    res.status(500).json({ message: 'Error rejecting purchase order', error: error.message });
  }
});

// Deliver Purchase Order (Approved → Delivered) and update inventory
router.patch('/:id/deliver', auth, async (req, res) => {
  try {
    // Check if user has inventory manager role
    if (!checkRole(req.user, ['inventory_manager', 'manager'])) {
      return res.status(403).json({ 
        message: 'Access denied. Only users with Inventory Manager role can mark purchase orders as delivered.' 
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    
    if (!purchaseOrder.canDeliver()) {
      return res.status(400).json({ 
        message: 'Purchase Order cannot be delivered. Ensure it is in approved status.' 
      });
    }
    
    // Store old state for audit
    const oldPO = purchaseOrder.toObject();
    
    // Update inventory for each part
    for (const item of purchaseOrder.items) {
      const part = await Part.findById(item.part);
      if (part) {
        const oldStock = part.stock?.onHand || 0;
        if (!part.stock) part.stock = {};
        part.stock.onHand = oldStock + item.quantity;
        await part.save();
        
        // Log audit for part update
        await logAudit({
          userId: req.user?.id,
          entityType: 'Part',
          entityId: part._id,
          action: 'update',
          before: { stock: { onHand: oldStock } },
          after: { stock: { onHand: part.stock.onHand } },
          source: 'PO_DELIVERY'
        });
      }
    }
    
    await purchaseOrder.deliver(req.user.id);
    
    // Audit log for deliver
    await logAudit({
      userId: req.user?.id,
      entityType: 'PurchaseOrder',
      entityId: purchaseOrder._id,
      action: 'update',
      before: oldPO,
      after: purchaseOrder,
      source: 'UI'
    });
    
    res.json({
      message: 'Purchase Order delivered successfully and inventory updated',
      purchaseOrder: await purchaseOrder.populate(['supplier', 'items.part'])
    });
    
  } catch (error) {
    console.error('Error delivering purchase order:', error);
    res.status(500).json({ message: 'Error delivering purchase order', error: error.message });
  }
});

// Delete Purchase Order (only if draft)
router.delete('/:id', auth, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    
    if (!purchaseOrder.canEdit()) {
      return res.status(400).json({ 
        message: 'Purchase Order cannot be deleted. Only draft POs can be deleted.' 
      });
    }
    
    // Store old state for audit
    const oldPO = purchaseOrder.toObject();
    
    await PurchaseOrder.findByIdAndDelete(req.params.id);
    
    // Audit log for delete
    await logAudit({
      userId: req.user?.id,
      entityType: 'PurchaseOrder',
      entityId: purchaseOrder._id,
      action: 'delete',
      before: oldPO,
      source: 'UI'
    });
    
    res.json({ message: 'Purchase Order deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ message: 'Error deleting purchase order', error: error.message });
  }
});

// Download single Purchase Order as PDF
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findById(id)
      .populate('supplier', 'companyName primaryContact.email primaryContact.phone addresses')
      .populate('items.part', 'name partCode description')
      .populate('createdBy', 'name email');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    // Get all parts for reference
    const partIds = purchaseOrder.items.map(item => item.part);
    const parts = await Part.find({ _id: { $in: partIds } });

    // Import PDF service dynamically to avoid circular dependencies
    const { generatePurchaseOrderPDF } = await import('../../services/inventory/pdfService.js');
    
    // Generate PDF
    const pdfBuffer = await generatePurchaseOrderPDF(purchaseOrder, purchaseOrder.supplier, parts);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PO-${purchaseOrder.poNumber || purchaseOrder._id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PO PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

// Download all Purchase Orders as PDF summary
router.get('/download/all-pdf', auth, async (req, res) => {
  try {
    const { status, supplier, startDate, endDate } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('supplier', 'companyName primaryContact.email primaryContact.phone addresses')
      .populate('items.part', 'name partCode description')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    if (purchaseOrders.length === 0) {
      return res.status(404).json({ message: 'No purchase orders found for the specified criteria' });
    }

    // Get all suppliers and parts for reference
    const supplierIds = [...new Set(purchaseOrders.map(po => po.supplier))];
    const suppliers = await Supplier.find({ _id: { $in: supplierIds } });

    const partIds = [...new Set(purchaseOrders.flatMap(po => po.items.map(item => item.part)))];
    const parts = await Part.find({ _id: { $in: partIds } });

    // Import PDF service dynamically to avoid circular dependencies
    const { generatePurchaseOrdersSummaryPDF } = await import('../../services/inventory/pdfService.js');
    
    // Generate PDF
    const pdfBuffer = await generatePurchaseOrdersSummaryPDF(purchaseOrders, suppliers, parts);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PurchaseOrders-Summary-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PO summary PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

export default router;