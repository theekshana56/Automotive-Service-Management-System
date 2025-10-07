import InventoryPayment from '../../models/finance/InventoryPayment.js';
import PurchaseOrder from '../../models/inventory/PurchaseOrder.js';
import Supplier from '../../models/inventory/Supplier.js';
import LedgerEntry from '../../models/finance/LedgerEntry.js';





// @desc    Get all inventory payments
// @route   GET /api/finance/inventory-payments
// @access  Private (Finance Manager, Admin)
export const getInventoryPayments = async (req, res) => {
  try {
    const { status, supplierId, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (status) {
      query.paymentStatus = status;
    }
    
    if (supplierId) {
      query.supplierId = supplierId;
    }
    
    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const payments = await InventoryPayment.find(query)
      .populate('supplierId', 'companyName primaryContact.email')
      .populate('purchaseOrderId', 'orderNumber status')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name')
      .sort('-paymentDate')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await InventoryPayment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single inventory payment
// @route   GET /api/finance/inventory-payments/:id
// @access  Private (Finance Manager, Admin)
export const getInventoryPayment = async (req, res) => {
  try {
    const payment = await InventoryPayment.findById(req.params.id)
      .populate('supplierId', 'companyName primaryContact bankDetails')
      .populate('purchaseOrderId', 'orderNumber items status')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name')
      .populate('paymentHistory.paidBy', 'name');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Inventory payment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create inventory payment from purchase order
// @route   POST /api/finance/inventory-payments
// @access  Private (Finance Manager, Admin)
export const createInventoryPayment = async (req, res) => {
  try {
    const { purchaseOrderId, paymentDate, dueDate, taxRate, shippingCost, discountAmount } = req.body;
    
    // Get purchase order details
    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId)
      .populate('supplierId', 'companyName primaryContact bankDetails')
      .populate('items.partId', 'name partNumber');
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    if (purchaseOrder.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved purchase orders can be paid'
      });
    }
    
    // Check if payment already exists for this purchase order
    const existingPayment = await InventoryPayment.findOne({ purchaseOrderId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this purchase order'
      });
    }
    
    // Prepare payment items
    const items = purchaseOrder.items.map(item => ({
      partId: item.partId._id,
      partName: item.partId.name,
      partNumber: item.partId.partNumber,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice
    }));
    
    const paymentData = {
      supplierId: purchaseOrder.supplierId._id,
      supplierName: purchaseOrder.supplierId.companyName,
      purchaseOrderId,
      purchaseOrderNumber: purchaseOrder.orderNumber,
      paymentDate: new Date(paymentDate),
      dueDate: new Date(dueDate),
      items,
      taxRate: taxRate || 0,
      shippingCost: shippingCost || 0,
      discountAmount: discountAmount || 0,
      bankDetails: purchaseOrder.supplierId.bankDetails || {}
    };
    
    const payment = await InventoryPayment.create(paymentData);
    
    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Make payment for inventory
// @route   PUT /api/finance/inventory-payments/:id/pay
// @access  Private (Finance Manager, Admin)
export const makeInventoryPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, reference, notes } = req.body;
    
    const payment = await InventoryPayment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Inventory payment not found'
      });
    }
    
    if (payment.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment is already completed'
      });
    }
    
    if (amount > payment.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds remaining amount'
      });
    }
    
    // Add payment to history
    payment.paymentHistory.push({
      paymentDate: new Date(),
      amount,
      paymentMethod,
      reference,
      notes,
      paidBy: req.user.id
    });
    
    // Update paid amount
    payment.paidAmount += amount;
    payment.paymentMethod = paymentMethod;
    payment.paymentReference = reference;
    
    // Update status if fully paid
    if (payment.remainingAmount <= 0) {
      payment.paymentStatus = 'paid';
      payment.paidBy = req.user.id;
      payment.paidAt = new Date();
    } else {
      payment.paymentStatus = 'partial';
    }
    
    await payment.save();
    
    // Create ledger entry
    await LedgerEntry.create({
      description: `Inventory payment to ${payment.supplierName} - PO: ${payment.purchaseOrderNumber}`,
      debit: amount,
      account: 'expenses',
      reference: payment._id,
      referenceType: 'inventory_payment'
    });
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update inventory payment
// @route   PUT /api/finance/inventory-payments/:id
// @access  Private (Finance Manager, Admin)
export const updateInventoryPayment = async (req, res) => {
  try {
    const payment = await InventoryPayment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Inventory payment not found'
      });
    }
    
    if (payment.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update paid payment record'
      });
    }
    
    const updatedPayment = await InventoryPayment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedPayment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get inventory payment summary
// @route   GET /api/finance/inventory-payments/summary
// @access  Private (Finance Manager, Admin)
export const getInventoryPaymentSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    const summary = await InventoryPayment.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          remainingAmount: { $sum: '$remainingAmount' }
        }
      }
    ]);
    
    const totalSummary = await InventoryPayment.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalRemaining: { $sum: '$remainingAmount' }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        byStatus: summary,
        totals: totalSummary[0] || {
          totalPayments: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0
        }
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete inventory payment
// @route   DELETE /api/finance/inventory-payments/:id
// @access  Private (Finance Manager, Admin)
export const deleteInventoryPayment = async (req, res) => {
  try {
    const payment = await InventoryPayment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Inventory payment not found'
      });
    }
    
    if (payment.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid payment record'
      });
    }
    
    await InventoryPayment.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Inventory payment deleted successfully'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
