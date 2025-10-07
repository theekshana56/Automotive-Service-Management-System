import Payment from '../../models/finance/Payment.js';
import Invoice from '../../models/finance/Invoice.js';
import Customer from '../../models/finance/Customer.js';
import LedgerEntry from '../../models/finance/LedgerEntry.js';





// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Payment.find(JSON.parse(queryStr))
      .populate('invoice', 'invoiceNumber totalAmount')
      .populate('customer', 'name email');

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = query.or([
        { reference: searchRegex },
        { 'customer.name': searchRegex },
        { paymentMethod: searchRegex }
      ]);
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-paymentDate');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Payment.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const payments = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: payments.length,
      pagination,
      data: payments
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('invoice')
      .populate('customer');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
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

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req, res, next) => {
  try {
    // Check if invoice exists
    const invoice = await Invoice.findById(req.body.invoice);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(req.body.customer);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if payment amount is valid
    if (req.body.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    const payment = await Payment.create(req.body);

    // Create ledger entry for payment
    if (payment.status === 'completed') {
      await LedgerEntry.create({
        date: payment.paymentDate,
        description: `Payment for invoice ${invoice.invoiceNumber} from ${customer.name}`,
        debit: 0,
        credit: payment.amount,
        account: 'accounts_receivable',
        reference: payment._id,
        referenceType: 'payment'
      });

      await LedgerEntry.create({
        date: payment.paymentDate,
        description: `Cash receipt for invoice ${invoice.invoiceNumber}`,
        debit: payment.amount,
        credit: 0,
        account: 'cash',
        reference: payment._id,
        referenceType: 'payment'
      });
    }

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

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
export const updatePayment = async (req, res, next) => {
  try {
    let payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const oldStatus = payment.status;

    payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update ledger entries if status changed to completed
    if (oldStatus !== 'completed' && payment.status === 'completed') {
      // Remove existing ledger entries
      await LedgerEntry.deleteMany({ reference: payment._id, referenceType: 'payment' });

      const invoice = await Invoice.findById(payment.invoice);
      const customer = await Customer.findById(payment.customer);
      
      // Create new ledger entries
      await LedgerEntry.create({
        date: payment.paymentDate,
        description: `Payment for invoice ${invoice.invoiceNumber} from ${customer.name}`,
        debit: 0,
        credit: payment.amount,
        account: 'accounts_receivable',
        reference: payment._id,
        referenceType: 'payment'
      });

      await LedgerEntry.create({
        date: payment.paymentDate,
        description: `Cash receipt for invoice ${invoice.invoiceNumber}`,
        debit: payment.amount,
        credit: 0,
        account: 'cash',
        reference: payment._id,
        referenceType: 'payment'
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

// @desc    Process refund
// @route   POST /api/payments/:id/refund
// @access  Private
export const processRefund = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    // Create refund payment
    const refundPayment = await Payment.create({
      invoice: payment.invoice,
      customer: payment.customer,
      amount: req.body.amount || payment.amount,
      paymentDate: new Date(),
      paymentMethod: payment.paymentMethod,
      reference: `REFUND-${payment.reference || payment._id}`,
      status: 'refunded',
      notes: req.body.notes || `Refund for payment ${payment._id}`
    });

    // Create ledger entries for refund
    await LedgerEntry.create({
      date: refundPayment.paymentDate,
      description: `Refund for payment ${payment._id}`,
      debit: refundPayment.amount,
      credit: 0,
      account: 'accounts_receivable',
      reference: refundPayment._id,
      referenceType: 'payment'
    });

    await LedgerEntry.create({
      date: refundPayment.paymentDate,
      description: `Cash disbursement for refund ${payment._id}`,
      debit: 0,
      credit: refundPayment.amount,
      account: 'cash',
      reference: refundPayment._id,
      referenceType: 'payment'
    });

    res.status(200).json({
      success: true,
      data: refundPayment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
