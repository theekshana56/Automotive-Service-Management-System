import Capital from '../../models/finance/Capital.js';

// @desc    Get capital information
// @route   GET /api/finance/capital
// @access  Private (Finance Manager, Admin)
export const getCapital = async (req, res) => {
  try {
    const capital = await Capital.getOrCreate();
    
    res.status(200).json({
      success: true,
      data: capital
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Initialize capital
// @route   POST /api/finance/capital/initialize
// @access  Private (Finance Manager, Admin)
export const initializeCapital = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid capital amount is required'
      });
    }
    
    const capital = await Capital.getOrCreate();
    
    // Check if capital is already initialized
    if (capital.initialAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Capital has already been initialized'
      });
    }
    
    await capital.initializeCapital(amount, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Capital initialized successfully',
      data: capital
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update capital amount
// @route   PUT /api/finance/capital
// @access  Private (Finance Manager, Admin)
export const updateCapital = async (req, res) => {
  try {
    const { amount, description = 'Capital adjustment' } = req.body;
    
    if (amount === undefined || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid capital amount is required'
      });
    }
    
    const capital = await Capital.getOrCreate();
    const difference = amount - capital.currentAmount;
    
    capital.currentAmount = amount;
    capital.updatedBy = req.user.id;
    
    await capital.addTransaction({
      type: 'adjustment',
      amount: difference,
      description,
      createdBy: req.user.id
    });
    
    res.status(200).json({
      success: true,
      message: 'Capital updated successfully',
      data: capital
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get capital transactions
// @route   GET /api/finance/capital/transactions
// @access  Private (Finance Manager, Admin)
export const getCapitalTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    
    const capital = await Capital.getOrCreate();
    
    let transactions = capital.transactions;
    
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = transactions.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(transactions.length / limit),
          total: transactions.length
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
