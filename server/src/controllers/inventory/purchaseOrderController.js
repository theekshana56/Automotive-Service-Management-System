import PurchaseOrder from '../../models/inventory/PurchaseOrder.js';
import Part from '../../models/inventory/Part.js';
import Supplier from '../../models/inventory/Supplier.js';
import { generatePurchaseOrderPDF, generatePurchaseOrdersSummaryPDF } from '../../services/inventory/pdfService.js';

// Create a new Purchase Order (Draft)
const createPurchaseOrder = async (req, res) => {
  try {
    console.log('DEBUG: Incoming PO req.method:', req.method);
    console.log('DEBUG: Incoming PO req.headers:', req.headers);
    console.log('DEBUG: Incoming PO req.body:', req.body); // Already present
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
        // If totalPrice is provided, use it, else calculate
        return sum + (item.totalPrice ? item.totalPrice : item.quantity * item.unitPrice);
      }, 0);

      // Optionally get tax and shipping from req.body, or default to 0
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

      res.status(201).json({
        message: 'Purchase Order created successfully',
        purchaseOrder: await purchaseOrder.populate(['supplier', 'items.part'])
      });
    
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ message: 'Error creating purchase order', error: error.message });
  }
};

// Get all Purchase Orders with filtering and pagination
const getPurchaseOrders = async (req, res) => {
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
};

// Get single Purchase Order by ID
const getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'companyName primaryContact.email primaryContact.phone addresses')
      .populate('items.part', 'name partCode description currentStock minStock')
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
};

// Update Purchase Order (only if draft)
const updatePurchaseOrder = async (req, res) => {
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
    
    // Update allowed fields
    const allowedUpdates = ['items', 'expectedDeliveryDate', 'notes', 'deliveryAddress', 'paymentTerms'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        purchaseOrder[field] = req.body[field];
      }
    });
    
    purchaseOrder.updatedBy = req.user?.id || 'system';
    
    await purchaseOrder.save();
    
    res.json({
      message: 'Purchase Order updated successfully',
      purchaseOrder: await purchaseOrder.populate(['supplier', 'items.part'])
    });
    
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ message: 'Error updating purchase order', error: error.message });
  }
};

// Submit Purchase Order (Draft → Submitted) - Only Inventory Managers can submit
const submitPurchaseOrder = async (req, res) => {
  try {
    // Check if user has inventory manager role
    if (!req.user || !req.user.isInventoryManager()) {
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
    
    // Capture security information
    purchaseOrder.ipAddress = req.ip || req.connection.remoteAddress;
    purchaseOrder.userAgent = req.get('User-Agent');
    purchaseOrder.lastModifiedBy = req.user.id;
    
    await purchaseOrder.submit(req.user.id);
    
    // Log the submission action for audit purposes
    console.log(`📤 PO ${purchaseOrder.poNumber} submitted by Inventory Manager: ${req.user.name} (${req.user.email}) at ${new Date().toISOString()}`);
    
    // TODO: Send email to supplier here
    // await sendPOToSupplier(purchaseOrder);
    
    res.json({
      message: 'Purchase Order submitted successfully by inventory manager',
      purchaseOrder: await purchaseOrder.populate(['supplier', 'items.part'])
    });
    
  } catch (error) {
    console.error('Error submitting purchase order:', error);
    res.status(500).json({ message: 'Error submitting purchase order', error: error.message });
  }
};

// Approve Purchase Order (Submitted → Approved) - Only Managers can approve
const approvePurchaseOrder = async (req, res) => {
  try {
    console.log('Approve PO request:', {
      user: req.user,
      params: req.params,
      body: req.body
    });
    // Check if user has manager role
    if (!req.user || !req.user.isManager()) {
      console.error('User is not a manager:', req.user);
      return res.status(403).json({ 
        message: 'Access denied. Only users with Manager role can approve purchase orders.' 
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
  console.error('Purchase Order not found:', req.params.id);
  return res.status(404).json({ message: 'Purchase Order not found' });
    }
    
    if (!purchaseOrder.canApprove()) {
      console.error('PO cannot be approved. Status:', purchaseOrder.status);
      return res.status(400).json({ 
        message: 'Purchase Order cannot be approved. Ensure it is in submitted status.' 
      });
    }
    
    // Safely access approvalNotes from req.body
    const body = req.body || {};
    if (body.approvalNotes) {
      purchaseOrder.approvalNotes = body.approvalNotes;
    }
    
    // Capture security information
    purchaseOrder.ipAddress = req.ip || req.connection.remoteAddress;
    purchaseOrder.userAgent = req.get('User-Agent');
    purchaseOrder.lastModifiedBy = req.user.id;
    
    // Approve with manager's user ID
    await purchaseOrder.approve(req.user.id);
    
    // Log the approval action for audit purposes
    console.log(`🔐 PO ${purchaseOrder.poNumber} approved by Manager: ${req.user.name} (${req.user.email}) at ${new Date().toISOString()}`);
    
    res.json({
      message: 'Purchase Order approved successfully by manager',
      purchaseOrder: await purchaseOrder.populate(['supplier', 'items.part'])
    });
    
  } catch (error) {
  console.error('Error approving purchase order:', error);
  res.status(500).json({ message: 'Error approving purchase order', error: error.message, stack: error.stack });
  }
};

// Deliver Purchase Order (Approved → Delivered) and update inventory - Only Inventory Managers can deliver
const deliverPurchaseOrder = async (req, res) => {
  try {
    // Check if user has inventory manager role
    if (!req.user || !req.user.isInventoryManager()) {
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
    
    // Update inventory for each part
    for (const item of purchaseOrder.items) {
      const part = await Part.findById(item.part);
      if (part) {
        part.currentStock += item.quantity;
        part.lastUpdated = new Date();
        await part.save();
        
        // TODO: Log audit for part update when audit system is ready
      }
    }
    
    await purchaseOrder.deliver(req.user.id);
    
    // TODO: Log audit for PO delivery when audit system is ready
    
    res.json({
      message: 'Purchase Order delivered successfully and inventory updated by inventory manager',
      purchaseOrder: await purchaseOrder.populate(['supplier', 'items.part'])
    });
    
  } catch (error) {
    console.error('Error delivering purchase order:', error);
    res.status(500).json({ message: 'Error delivering purchase order', error: error.message });
  }
};

// Delete Purchase Order (only if draft)
const deletePurchaseOrder = async (req, res) => {
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
    
    await PurchaseOrder.findByIdAndDelete(req.params.id);
    
    // TODO: Log audit when audit system is ready
    
    res.json({ message: 'Purchase Order deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ message: 'Error deleting purchase order', error: error.message });
  }
};

// Get PO statistics
const getPOStatistics = async (req, res) => {
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
};

// Get PO Security Audit Information - Only Managers and Admins can access
const getPOSecurityAudit = async (req, res) => {
  try {
    // Check if user has manager or admin role
    if (!req.user || !req.user.isManager()) {
      return res.status(403).json({ 
        message: 'Access denied. Only users with Manager or Admin role can view security audit information.' 
      });
    }

    const { id } = req.params;
    const purchaseOrder = await PurchaseOrder.findById(id)
      .populate('createdBy', 'name email role')
      .populate('submittedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('updatedBy', 'name email role')
      .populate('lastModifiedBy', 'name email role')
      .select('+ipAddress +userAgent +approvalNotes +modificationHistory');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    // Create security audit summary
    const securityAudit = {
      poNumber: purchaseOrder.poNumber,
      status: purchaseOrder.status,
      securityInfo: {
        ipAddress: purchaseOrder.ipAddress,
        userAgent: purchaseOrder.userAgent,
        approvalNotes: purchaseOrder.approvalNotes
      },
      userActions: {
        createdBy: purchaseOrder.createdBy,
        submittedBy: purchaseOrder.submittedBy,
        approvedBy: purchaseOrder.approvedBy,
        lastModifiedBy: purchaseOrder.lastModifiedBy
      },
      timestamps: {
        createdAt: purchaseOrder.createdAt,
        submittedAt: purchaseOrder.submittedAt,
        approvedAt: purchaseOrder.approvedAt,
        deliveredAt: purchaseOrder.deliveredAt,
        updatedAt: purchaseOrder.updatedAt
      },
      modificationHistory: purchaseOrder.modificationHistory || []
    };

    res.json({
      message: 'Security audit information retrieved successfully',
      securityAudit
    });

  } catch (error) {
    console.error('Error retrieving PO security audit:', error);
    res.status(500).json({ message: 'Error retrieving security audit', error: error.message });
  }
};

// Download single Purchase Order as PDF
const downloadPurchaseOrderPDF = async (req, res) => {
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
};

// Download all Purchase Orders as PDF summary
const downloadAllPurchaseOrdersPDF = async (req, res) => {
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
};

export {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  submitPurchaseOrder,
  approvePurchaseOrder,
  deliverPurchaseOrder,
  deletePurchaseOrder,
  getPOStatistics,
  getPOSecurityAudit,
  downloadPurchaseOrderPDF,
  downloadAllPurchaseOrdersPDF
};
