import Customer from '../../models/finance/Customer.js';
import Invoice from '../../models/finance/Invoice.js';
import Payment from '../../models/finance/Payment.js';




// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res, next) => {
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
    query = Customer.find(JSON.parse(queryStr));

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = query.or([
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
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
      query = query.sort('name');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Customer.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const customers = await query;

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
      count: customers.length,
      pagination,
      data: customers
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
export const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if customer has invoices
    const invoiceCount = await Invoice.countDocuments({ customer: req.params.id });

    if (invoiceCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing invoices'
      });
    }

    await customer.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get customer balance details
// @route   GET /api/customers/:id/balance
// @access  Private
export const getCustomerBalance = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get outstanding invoices
    const outstandingInvoices = await Invoice.find({
      customer: req.params.id,
      status: { $in: ['sent', 'overdue'] }
    }).select('invoiceNumber date dueDate totalAmount status');

    // Get recent payments
    const recentPayments = await Payment.find({
      customer: req.params.id,
      status: 'completed'
    })
      .sort('-paymentDate')
      .limit(10)
      .select('paymentDate amount paymentMethod reference')
      .populate('invoice', 'invoiceNumber');

    // Calculate total outstanding
    const totalOutstanding = outstandingInvoices.reduce(
      (sum, invoice) => sum + invoice.totalAmount,
      0
    );

    // Get overdue amount
    const overdueInvoices = outstandingInvoices.filter(
      invoice => invoice.status === 'overdue' || invoice.dueDate < new Date()
    );
    const totalOverdue = overdueInvoices.reduce(
      (sum, invoice) => sum + invoice.totalAmount,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          creditLimit: customer.creditLimit,
          balance: customer.balance
        },
        outstandingInvoices,
        recentPayments,
        summary: {
          totalOutstanding,
          totalOverdue,
          invoiceCount: outstandingInvoices.length,
          overdueCount: overdueInvoices.length
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

// @desc    Get customer transaction history
// @route   GET /api/customers/:id/transactions
// @access  Private
export const getCustomerTransactions = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get invoices
    const invoices = await Invoice.find({ customer: req.params.id })
      .sort('-date')
      .select('invoiceNumber date dueDate totalAmount status');

    // Get payments
    const payments = await Payment.find({ customer: req.params.id })
      .sort('-paymentDate')
      .select('paymentDate amount paymentMethod reference status')
      .populate('invoice', 'invoiceNumber');

    // Combine and sort transactions by date
    const transactions = [
      ...invoices.map(invoice => ({
        type: 'invoice',
        date: invoice.date,
        description: `Invoice ${invoice.invoiceNumber}`,
        amount: invoice.totalAmount,
        status: invoice.status,
        reference: invoice.invoiceNumber
      })),
      ...payments.map(payment => ({
        type: 'payment',
        date: payment.paymentDate,
        description: `Payment ${payment.reference || ''}`.trim(),
        amount: -payment.amount,
        status: payment.status,
        reference: payment.reference
      }))
    ].sort((a, b) => b.date - a.date);

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
