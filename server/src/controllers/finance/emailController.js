import Invoice from '../../models/finance/Invoice.js';
import CustomerPayment from '../../models/finance/CustomerPayment.js';
import StaffSalary from '../../models/finance/StaffSalary.js';
import ServiceCost from '../../models/finance/ServiceCost.js';
import User from '../../models/User.js';
import emailService from '../../services/finance/emailService.js';






// @desc    Send invoice email to customer
// @route   POST /api/finance/email/send-invoice/:invoiceId
// @access  Private (Finance Manager, Admin)
export const sendInvoiceEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
      .populate('customer', 'name email phone');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Get service cost details
    const serviceCost = await ServiceCost.findOne({ invoiceId: invoice._id });
    if (!serviceCost) {
      return res.status(404).json({
        success: false,
        message: 'Service cost not found for this invoice'
      });
    }
    
    const result = await emailService.sendInvoiceEmail(invoice, invoice.customer, serviceCost);
    
    if (result.success) {
      // Update invoice to mark email as sent
      invoice.emailSent = true;
      invoice.emailSentAt = new Date();
      await invoice.save();
      
      res.status(200).json({
        success: true,
        message: 'Invoice email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send invoice email',
        error: result.error
      });
    }
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Send payment receipt email to customer
// @route   POST /api/finance/email/send-receipt/:paymentId
// @access  Private (Finance Manager, Admin)
export const sendReceiptEmail = async (req, res) => {
  try {
    const payment = await CustomerPayment.findById(req.params.paymentId)
      .populate('customerId', 'name email phone')
      .populate('invoiceId', 'invoiceNumber totalAmount items')
      .populate('serviceCostId', 'serviceType vehiclePlate');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Customer payment not found'
      });
    }
    
    const result = await emailService.sendReceiptEmail(payment, payment.customerId, payment.invoiceId, payment.serviceCostId);
    
    if (result.success) {
      // Update payment to mark email as sent
      payment.emailSent = true;
      payment.emailSentAt = new Date();
      await payment.save();
      
      res.status(200).json({
        success: true,
        message: 'Receipt email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send receipt email',
        error: result.error
      });
    }
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Send salary notification email to staff
// @route   POST /api/finance/email/send-salary-notification/:salaryId
// @access  Private (Finance Manager, Admin)
export const sendSalaryNotificationEmail = async (req, res) => {
  try {
    const salary = await StaffSalary.findById(req.params.salaryId)
      .populate('staffId', 'name email role');
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Staff salary not found'
      });
    }
    
    const result = await emailService.sendSalaryNotificationEmail(salary, salary.staffId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Salary notification email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send salary notification email',
        error: result.error
      });
    }
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Send bulk invoice emails
// @route   POST /api/finance/email/send-bulk-invoices
// @access  Private (Finance Manager, Admin)
export const sendBulkInvoiceEmails = async (req, res) => {
  try {
    const { invoiceIds } = req.body;
    
    if (!invoiceIds || !Array.isArray(invoiceIds)) {
      return res.status(400).json({
        success: false,
        message: 'Invoice IDs array is required'
      });
    }
    
    const results = [];
    
    for (const invoiceId of invoiceIds) {
      try {
        const invoice = await Invoice.findById(invoiceId)
          .populate('customer', 'name email phone');
        
        if (!invoice) {
          results.push({
            invoiceId,
            success: false,
            message: 'Invoice not found'
          });
          continue;
        }
        
        const serviceCost = await ServiceCost.findOne({ invoiceId: invoice._id });
        if (!serviceCost) {
          results.push({
            invoiceId,
            success: false,
            message: 'Service cost not found'
          });
          continue;
        }
        
        const result = await emailService.sendInvoiceEmail(invoice, invoice.customer, serviceCost);
        
        if (result.success) {
          invoice.emailSent = true;
          invoice.emailSentAt = new Date();
          await invoice.save();
        }
        
        results.push({
          invoiceId,
          success: result.success,
          message: result.success ? 'Email sent successfully' : result.error,
          messageId: result.messageId
        });
      } catch (error) {
        results.push({
          invoiceId,
          success: false,
          message: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.status(200).json({
      success: true,
      message: `Bulk email sending completed. ${successCount} successful, ${failureCount} failed.`,
      results
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Send bulk salary notification emails
// @route   POST /api/finance/email/send-bulk-salary-notifications
// @access  Private (Finance Manager, Admin)
export const sendBulkSalaryNotificationEmails = async (req, res) => {
  try {
    const { salaryIds } = req.body;
    
    if (!salaryIds || !Array.isArray(salaryIds)) {
      return res.status(400).json({
        success: false,
        message: 'Salary IDs array is required'
      });
    }
    
    const results = [];
    
    for (const salaryId of salaryIds) {
      try {
        const salary = await StaffSalary.findById(salaryId)
          .populate('staffId', 'name email role');
        
        if (!salary) {
          results.push({
            salaryId,
            success: false,
            message: 'Salary not found'
          });
          continue;
        }
        
        const result = await emailService.sendSalaryNotificationEmail(salary, salary.staffId);
        
        results.push({
          salaryId,
          success: result.success,
          message: result.success ? 'Email sent successfully' : result.error,
          messageId: result.messageId
        });
      } catch (error) {
        results.push({
          salaryId,
          success: false,
          message: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.status(200).json({
      success: true,
      message: `Bulk salary notification sending completed. ${successCount} successful, ${failureCount} failed.`,
      results
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get email sending status
// @route   GET /api/finance/email/status
// @access  Private (Finance Manager, Admin)
export const getEmailStatus = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    let model;
    let emailField;
    
    switch (type) {
      case 'invoice':
        model = Invoice;
        emailField = 'emailSent';
        break;
      case 'payment':
        model = CustomerPayment;
        emailField = 'emailSent';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Use "invoice" or "payment"'
        });
    }
    
    const totalCount = await model.countDocuments(query);
    const sentCount = await model.countDocuments({ ...query, [emailField]: true });
    const pendingCount = totalCount - sentCount;
    
    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        sent: sentCount,
        pending: pendingCount,
        sentPercentage: totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
