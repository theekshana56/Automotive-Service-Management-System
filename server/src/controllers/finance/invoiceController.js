import Invoice from '../../models/finance/Invoice.js';
import Customer from '../../models/finance/Customer.js';
import LedgerEntry from '../../models/finance/LedgerEntry.js';




// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('customer', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req, res) => {
  try {
    const customer = await Customer.findById(req.body.customer);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const invoice = await Invoice.create(req.body);
    await customer.updateBalance();

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const customer = await Customer.findById(invoice.customer);
    if (customer) {
      await customer.updateBalance();
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Remove ledger entries
    await LedgerEntry.deleteMany({ reference: invoice._id, referenceType: 'invoice' });

    // Delete invoice
    await Invoice.findByIdAndDelete(req.params.id);

    // Update customer balance
    const customer = await Customer.findById(invoice.customer);
    if (customer) {
      await customer.updateBalance();
    }

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats/summary
// @access  Private
export const getInvoiceStats = async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: '$totalAmount' },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalInvoiced: 0,
        totalPaid: 0,
        count: 0
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
