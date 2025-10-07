import Bill from '../../models/finance/Bill.js';
import Vendor from '../../models/finance/Vendor.js';
import LedgerEntry from '../../models/finance/LedgerEntry.js';




// @desc    Get all bills
// @route   GET /api/bills
// @access  Private
export const getBills = async (req, res, next) => {
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
    query = Bill.find(JSON.parse(queryStr)).populate('vendor', 'name contactPerson email');

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = query.or([
        { billNumber: searchRegex },
        { 'vendor.name': searchRegex }
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
      query = query.sort('-date');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Bill.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const bills = await query;

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
      count: bills.length,
      pagination,
      data: bills
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single bill
// @route   GET /api/bills/:id
// @access  Private
export const getBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('vendor');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bill
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create bill
// @route   POST /api/bills
// @access  Private
export const createBill = async (req, res, next) => {
  try {
    // Check if vendor exists
    const vendor = await Vendor.findById(req.body.vendor);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const bill = await Bill.create(req.body);

    // Create ledger entry for accounts payable
    if (bill.status === 'received' || bill.status === 'approved') {
      await LedgerEntry.create({
        date: bill.date,
        description: `Bill ${bill.billNumber} from ${vendor.name}`,
        debit: 0,
        credit: bill.totalAmount,
        account: 'accounts_payable',
        reference: bill._id,
        referenceType: 'bill'
      });

      await LedgerEntry.create({
        date: bill.date,
        description: `Expense from bill ${bill.billNumber}`,
        debit: bill.totalAmount - bill.taxAmount,
        credit: 0,
        account: 'expenses',
        reference: bill._id,
        referenceType: 'bill'
      });

      if (bill.taxAmount > 0) {
        await LedgerEntry.create({
          date: bill.date,
          description: `Tax from bill ${bill.billNumber}`,
          debit: bill.taxAmount,
          credit: 0,
          account: 'tax',
          reference: bill._id,
          referenceType: 'bill'
        });
      }
    }

    res.status(201).json({
      success: true,
      data: bill
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update bill
// @route   PUT /api/bills/:id
// @access  Private
export const updateBill = async (req, res, next) => {
  try {
    let bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    bill = await Bill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update ledger entries if status changed to received/approved
    if ((req.body.status === 'received' || req.body.status === 'approved') && 
        (bill.status === 'received' || bill.status === 'approved')) {
      // Remove existing ledger entries
      await LedgerEntry.deleteMany({ reference: bill._id, referenceType: 'bill' });

      const vendor = await Vendor.findById(bill.vendor);
      
      // Create new ledger entries
      await LedgerEntry.create({
        date: bill.date,
        description: `Bill ${bill.billNumber} from ${vendor.name}`,
        debit: 0,
        credit: bill.totalAmount,
        account: 'accounts_payable',
        reference: bill._id,
        referenceType: 'bill'
      });

      await LedgerEntry.create({
        date: bill.date,
        description: `Expense from bill ${bill.billNumber}`,
        debit: bill.totalAmount - bill.taxAmount,
        credit: 0,
        account: 'expenses',
        reference: bill._id,
        referenceType: 'bill'
      });

      if (bill.taxAmount > 0) {
        await LedgerEntry.create({
          date: bill.date,
          description: `Tax from bill ${bill.billNumber}`,
          debit: bill.taxAmount,
          credit: 0,
          account: 'tax',
          reference: bill._id,
          referenceType: 'bill'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: bill
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete bill
// @route   DELETE /api/bills/:id
// @access  Private
export const deleteBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Remove ledger entries
    await LedgerEntry.deleteMany({ reference: bill._id, referenceType: 'bill' });

    await bill.remove();

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

// @desc    Get bill statistics
// @route   GET /api/bills/stats/summary
// @access  Private
export const getBillStats = async (req, res, next) => {
  try {
    const stats = await Bill.aggregate([
      {
        $match: {
          status: { $in: ['received', 'approved', 'paid', 'overdue'] }
        }
      },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$totalAmount' },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0]
            }
          },
          totalOutstanding: {
            $sum: {
              $cond: [{ $in: ['$status', ['received', 'approved', 'overdue']] }, '$totalAmount', 0]
            }
          },
          totalOverdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['received', 'approved', 'overdue']] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                '$totalAmount',
                0
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = await Bill.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {
          totalBilled: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          totalOverdue: 0,
          count: 0
        },
        byStatus: statusCounts
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
