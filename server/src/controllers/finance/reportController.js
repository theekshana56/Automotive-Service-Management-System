import Invoice from '../../models/finance/Invoice.js';
import Payment from '../../models/finance/Payment.js';
import Bill from '../../models/finance/Bill.js';
import Customer from '../../models/finance/Customer.js';
import Vendor from '../../models/finance/Vendor.js';
import LedgerEntry from '../../models/finance/LedgerEntry.js';







// Get income statement
export const getIncomeStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get total revenue from invoices
    const revenue = await Invoice.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: { $in: ['paid', 'sent'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    // Get total expenses from bills
    const expenses = await Bill.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: { $in: ['paid', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenue[0]?.total || 0;
    const totalExpenses = expenses[0]?.total || 0;
    const netIncome = totalRevenue - totalExpenses;
    
    res.json({
      success: true,
      data: {
        period: { start: start, end: end },
        revenue: totalRevenue,
        expenses: totalExpenses,
        netIncome: netIncome
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get cash flow statement
export const getCashFlowStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get cash inflows from payments
    const inflows = await Payment.aggregate([
      { $match: { paymentDate: { $gte: start, $lte: end }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get cash outflows from bill payments
    const outflows = await Bill.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const totalInflows = inflows[0]?.total || 0;
    const totalOutflows = outflows[0]?.total || 0;
    const netCashFlow = totalInflows - totalOutflows;
    
    res.json({
      success: true,
      data: {
        period: { start: start, end: end },
        cashInflows: totalInflows,
        cashOutflows: totalOutflows,
        netCashFlow: netCashFlow
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get balance sheet
export const getBalanceSheet = async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    
    // Get total accounts receivable
    const accountsReceivable = await Invoice.aggregate([
      { $match: { dueDate: { $lte: asOf }, status: { $in: ['sent', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    // Get total accounts payable
    const accountsPayable = await Bill.aggregate([
      { $match: { dueDate: { $lte: asOf }, status: { $in: ['received', 'approved', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const totalAR = accountsReceivable[0]?.total || 0;
    const totalAP = accountsPayable[0]?.total || 0;
    
    res.json({
      success: true,
      data: {
        asOf: asOf,
        assets: {
          accountsReceivable: totalAR
        },
        liabilities: {
          accountsPayable: totalAP
        },
        equity: totalAR - totalAP
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get accounts receivable aging
export const getAccountsReceivableAging = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const aging = await Invoice.aggregate([
      { $match: { status: { $in: ['sent', 'overdue'] } } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $gte: ['$dueDate', today] },
              then: 'current',
              else: {
                $cond: {
                  if: { $gte: ['$dueDate', thirtyDaysAgo] },
                  then: '1-30',
                  else: {
                    $cond: {
                      if: { $gte: ['$dueDate', sixtyDaysAgo] },
                      then: '31-60',
                      else: {
                        $cond: {
                          if: { $gte: ['$dueDate', ninetyDaysAgo] },
                          then: '61-90',
                          else: 'over90'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        aging: aging,
        total: aging.reduce((sum, item) => sum + item.total, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get accounts payable aging
export const getAccountsPayableAging = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const aging = await Bill.aggregate([
      { $match: { status: { $in: ['received', 'approved', 'overdue'] } } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $gte: ['$dueDate', today] },
              then: 'current',
              else: {
                $cond: {
                  if: { $gte: ['$dueDate', thirtyDaysAgo] },
                  then: '1-30',
                  else: {
                    $cond: {
                      if: { $gte: ['$dueDate', sixtyDaysAgo] },
                      then: '31-60',
                      else: {
                        $cond: {
                          if: { $gte: ['$dueDate', ninetyDaysAgo] },
                          then: '61-90',
                          else: 'over90'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        aging: aging,
        total: aging.reduce((sum, item) => sum + item.total, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export report as PDF
export const exportReportAsPDF = async (req, res) => {
  try {
    const { reportType } = req.params;
    // This would integrate with the PDF export service
    res.json({ success: true, message: `PDF export for ${reportType} not yet implemented` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export report as CSV
export const exportReportAsCSV = async (req, res) => {
  try {
    const { reportType } = req.params;
    // This would integrate with the CSV export service
    res.json({ success: true, message: `CSV export for ${reportType} not yet implemented` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
