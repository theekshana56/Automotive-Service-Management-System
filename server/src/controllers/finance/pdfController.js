import {
  generateStaffSalaryReportPDF,
  generateCustomerPaymentReportPDF,
  generateServiceCostReportPDF,
  generatePurchaseOrderCostReportPDF,
  generateCombinedFinanceReportPDF,
  generateProfitLossReportPDF,
  generateFinalAmountReportPDF
} from '../../services/finance/pdfService.js';
import StaffSalary from '../../models/finance/StaffSalary.js';
import ServiceCost from '../../models/finance/ServiceCost.js';
import PurchaseOrder from '../../models/inventory/PurchaseOrder.js';
import CustomerPayment from '../../models/finance/CustomerPayment.js';
import Staff from '../../models/staffMng/Staff.js';

// Generate Staff Salary Report PDF
export const generateStaffSalaryPDF = async (req, res) => {
  try {
    const { startDate, endDate, staffId } = req.query;
    
    // Build query
    let query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (staffId) {
      query.staffId = staffId;
    }

    // Get salaries with populated staff information
    const salaries = await StaffSalary.find(query)
      .populate('staffId', 'name email role')
      .sort({ createdAt: -1 });

    // Get summary data
    const summary = await StaffSalary.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSalaries: { $sum: 1 },
          totalNetSalary: { $sum: '$calculations.netSalary' },
          totalEPF: { $sum: '$calculations.epfContribution' },
          totalETF: { $sum: '$calculations.etfContribution' }
        }
      }
    ]);

    const summaryData = summary[0] || {
      totalSalaries: 0,
      totalNetSalary: 0,
      totalEPF: 0,
      totalETF: 0
    };

    // Generate PDF
    const pdfBuffer = await generateStaffSalaryReportPDF(salaries, summaryData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="staff-salary-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating staff salary PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate staff salary report PDF',
      error: error.message 
    });
  }
};

// Generate Customer Payment Report PDF
export const generateCustomerPaymentPDF = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Build query
    let query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }

    // Get service costs with populated customer information
    const serviceCosts = await ServiceCost.find(query)
      .populate('customerId', 'name email phone')
      .populate('advisorId', 'name email')
      .sort({ createdAt: -1 });

    // Get summary data
    const summary = await ServiceCost.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalServiceCost: { $sum: '$finalCost.totalAmount' },
          totalProfitAmount: { $sum: '$customerPaymentCalculation.profitAmount' },
          totalAdvisorFixedCost: { $sum: '$customerPaymentCalculation.advisorFixedCost' },
          totalStaffFixedCost: { $sum: '$customerPaymentCalculation.staffFixedCost' },
          totalCustomerPayment: { $sum: '$customerPaymentCalculation.finalCustomerPayment' }
        }
      }
    ]);

    const summaryData = summary[0] || {
      totalServiceCost: 0,
      totalProfitAmount: 0,
      totalAdvisorFixedCost: 0,
      totalStaffFixedCost: 0,
      totalCustomerPayment: 0
    };

    // Generate PDF
    const pdfBuffer = await generateCustomerPaymentReportPDF(serviceCosts, summaryData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="customer-payment-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating customer payment PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate customer payment report PDF',
      error: error.message 
    });
  }
};

// Generate Service Cost Report PDF
export const generateServiceCostPDF = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Build query
    let query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }

    // Get service costs with populated customer and advisor information
    const serviceCosts = await ServiceCost.find(query)
      .populate('customerId', 'name email phone')
      .populate('advisorId', 'name email')
      .sort({ createdAt: -1 });

    // Get summary data
    const summary = await ServiceCost.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalServiceCost: { $sum: '$finalCost.totalAmount' },
          totalRecords: { $sum: 1 }
        }
      }
    ]);

    const summaryData = summary[0] || {
      totalServiceCost: 0,
      totalRecords: 0
    };

    // Generate PDF
    const pdfBuffer = await generateServiceCostReportPDF(serviceCosts, summaryData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="service-cost-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating service cost PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate service cost report PDF',
      error: error.message 
    });
  }
};

// Generate Purchase Order Cost Report PDF
export const generatePurchaseOrderCostPDF = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Build query
    let query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }

    // Get purchase orders with populated data
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('supplier', 'name')
      .populate('items.part', 'name partNumber')
      .sort({ createdAt: -1 });

    // Get summary data
    const summary = await PurchaseOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalRecords: { $sum: 1 }
        }
      }
    ]);

    const summaryData = summary[0] || {
      totalAmount: 0,
      totalRecords: 0
    };

    // Generate PDF
    const pdfBuffer = await generatePurchaseOrderCostReportPDF(purchaseOrders, summaryData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="purchase-order-cost-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating purchase order cost PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate purchase order cost report PDF',
      error: error.message 
    });
  }
};

// Generate Combined Finance Report PDF
export const generateCombinedFinancePDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build query
    let query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get salaries data
    const salaries = await StaffSalary.find(query)
      .populate('staffId', 'name email role')
      .sort({ createdAt: -1 });

    // Get service costs data
    const serviceCosts = await ServiceCost.find(query)
      .populate('customerId', 'name email phone')
      .populate('advisorId', 'name email')
      .sort({ createdAt: -1 });

    // Get salary summary
    const salarySummary = await StaffSalary.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSalaries: { $sum: 1 },
          totalNetSalary: { $sum: '$calculations.netSalary' },
          totalEPF: { $sum: '$calculations.epfContribution' },
          totalETF: { $sum: '$calculations.etfContribution' }
        }
      }
    ]);

    // Get payment summary
    const paymentSummary = await ServiceCost.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalServiceCost: { $sum: '$finalCost.totalAmount' },
          totalProfitAmount: { $sum: '$customerPaymentCalculation.profitAmount' },
          totalAdvisorFixedCost: { $sum: '$customerPaymentCalculation.advisorFixedCost' },
          totalStaffFixedCost: { $sum: '$customerPaymentCalculation.staffFixedCost' },
          totalCustomerPayment: { $sum: '$customerPaymentCalculation.finalCustomerPayment' }
        }
      }
    ]);

    const salarySummaryData = salarySummary[0] || {
      totalSalaries: 0,
      totalNetSalary: 0,
      totalEPF: 0,
      totalETF: 0
    };

    const paymentSummaryData = paymentSummary[0] || {
      totalServiceCost: 0,
      totalProfitAmount: 0,
      totalAdvisorFixedCost: 0,
      totalStaffFixedCost: 0,
      totalCustomerPayment: 0
    };

    // Generate PDF
    const pdfBuffer = await generateCombinedFinanceReportPDF(
      salaries, 
      serviceCosts, 
      salarySummaryData, 
      paymentSummaryData
    );

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="combined-finance-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating combined finance PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate combined finance report PDF',
      error: error.message 
    });
  }
};

// Generate Profit/Loss Report PDF
export const generateProfitLossPDF = async (req, res) => {
  try {
    // If the client passes computed values, use them directly to guarantee parity with dashboard
    const {
      customerPayments: qpCustomerPayments,
      serviceCosts: qpServiceCosts,
      inventoryPayments: qpInventoryPayments,
      staffSalaries: qpStaffSalaries,
      netProfitLoss: qpNet
    } = req.query || {};

    if (
      qpCustomerPayments !== undefined ||
      qpServiceCosts !== undefined ||
      qpInventoryPayments !== undefined ||
      qpStaffSalaries !== undefined ||
      qpNet !== undefined
    ) {
      const customerPayments = Number(qpCustomerPayments || 0);
      const serviceCosts = Number(qpServiceCosts || 0);
      const inventoryPayments = Number(qpInventoryPayments || 0);
      const staffSalaries = Number(qpStaffSalaries || 0);
      const netProfitLoss = Number(
        qpNet !== undefined ? qpNet : (customerPayments - (serviceCosts + inventoryPayments + staffSalaries))
      );

      const pdfBuffer = await generateProfitLossReportPDF({
        customerPayments,
        serviceCosts,
        inventoryPayments,
        staffSalaries,
        netProfitLoss
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="profit-loss-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    }

    // Otherwise compute on the server (best-effort mirror)
    const { startDate, endDate } = req.query; // accepted but not used to match dashboard

    // Customer payments: all completed payments, prefer finalAmount field
    let customerPaymentsAgg = await CustomerPayment.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $addFields: { amountToSum: { $ifNull: [ '$paymentCalculation.finalAmount', '$paymentDetails.amount' ] } } },
      { $group: { _id: null, totalCustomerPayment: { $sum: '$amountToSum' } } }
    ]);

    // Service costs: sum all service costs
    const serviceCostsAgg = await ServiceCost.aggregate([
      { $group: { _id: null, totalServiceCost: { $sum: '$finalCost.totalAmount' } } }
    ]);

    // Inventory payments: all approved purchase orders
    const inventoryAgg = await PurchaseOrder.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Staff salaries: compute from HR staff details (base + OT - EPF 8% - ETF 3%)
    const staffDocsForCalc = await Staff.find({}, 'salary extraWork');
    const staffSalariesComputed = staffDocsForCalc.reduce((sum, s) => {
      const base = Number(s.salary?.basic || 0);
      const otRate = Number(s.salary?.ot || 0);
      const totalExtraHours = (s.extraWork || []).reduce((h, rec) => h + (rec.hours || 0), 0);
      const extraPay = totalExtraHours * otRate;
      const totalPay = base + extraPay;
      const epf = Math.round(base * 0.08);
      const etf = Math.round(base * 0.03);
      const finalPay = totalPay - (epf + etf);
      return sum + (finalPay > 0 ? finalPay : 0);
    }, 0);

    // Fallbacks
    if (!customerPaymentsAgg || customerPaymentsAgg.length === 0) {
      // Derive customer payments from service costs if not recorded yet
      const scAgg = await ServiceCost.aggregate([
        { $addFields: {
            computedCustomerPayment: {
              $cond: [
                { $gt: [ { $ifNull: [ '$customerPaymentCalculation.finalCustomerPayment', 0 ] }, 0 ] },
                '$customerPaymentCalculation.finalCustomerPayment',
                { $multiply: [ { $add: [ '$finalCost.totalAmount', { $multiply: [ '$finalCost.totalAmount', 0.8 ] }, 100, 60 ] }, 1.12 ] }
              ]
            }
          }
        },
        { $group: { _id: null, totalCustomerPayment: { $sum: '$computedCustomerPayment' } } }
      ]);
      customerPaymentsAgg = scAgg;
    }

    const customerPayments = customerPaymentsAgg[0]?.totalCustomerPayment || 0;
    const serviceCosts = serviceCostsAgg[0]?.totalServiceCost || 0;
    const inventoryPayments = inventoryAgg[0]?.total || 0;
    const staffSalaries = staffSalariesComputed || 0;
    const netProfitLoss = customerPayments - (serviceCosts + inventoryPayments + staffSalaries);

    const pdfBuffer = await generateProfitLossReportPDF({
      customerPayments,
      serviceCosts,
      inventoryPayments,
      staffSalaries,
      netProfitLoss
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="profit-loss-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating profit/loss PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to generate profit/loss PDF', error: error.message });
  }
};

// Generate Final Amount PDF
export const generateFinalAmountPDF = async (req, res) => {
  try {
    const {
      initialCapital = 0,
      customerPayments = 0,
      staffSalaries = 0,
      inventoryPayments = 0,
      serviceCost = 0,
      finalAmount = 0
    } = req.query || {};

    const pdfBuffer = await generateFinalAmountReportPDF({
      initialCapital: Number(initialCapital || 0),
      customerPayments: Number(customerPayments || 0),
      staffSalaries: Number(staffSalaries || 0),
      inventoryPayments: Number(inventoryPayments || 0),
      serviceCost: Number(serviceCost || 0),
      finalAmount: Number(finalAmount || 0)
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="final-amount-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating final amount PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to generate final amount PDF', error: error.message });
  }
};
