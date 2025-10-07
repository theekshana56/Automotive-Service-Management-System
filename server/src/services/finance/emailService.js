import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs/promises';

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Generate HTML invoice template
const generateInvoiceHTML = (invoice, customer, serviceCost) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
        .invoice-title { font-size: 28px; color: #333; margin: 0; }
        .invoice-number { font-size: 16px; color: #666; margin: 5px 0; }
        .company-info { text-align: right; margin-bottom: 30px; }
        .customer-info { margin-bottom: 30px; }
        .info-section { margin-bottom: 20px; }
        .info-section h3 { color: #007bff; margin-bottom: 10px; font-size: 16px; }
        .info-section p { margin: 5px 0; color: #333; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background-color: #f8f9fa; font-weight: bold; color: #333; }
        .items-table tr:nth-child(even) { background-color: #f8f9fa; }
        .text-right { text-align: right; }
        .totals { margin-top: 20px; }
        .totals table { width: 100%; }
        .totals td { padding: 8px 12px; }
        .totals .total-row { font-weight: bold; font-size: 18px; background-color: #007bff; color: white; }
        .payment-info { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 30px; }
        .payment-info h3 { color: #007bff; margin-top: 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        .service-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .service-details h4 { color: #007bff; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AUTO ELITE</div>
          <h1 class="invoice-title">INVOICE</h1>
          <p class="invoice-number">Invoice #: ${invoice.invoiceNumber}</p>
        </div>
        
        <div class="company-info">
          <p><strong>AUTO ELITE Service Center</strong></p>
          <p>123 Service Street, City, State 12345</p>
          <p>Phone: (555) 123-4567 | Email: info@autoelite.com</p>
        </div>
        
        <div class="customer-info">
          <div class="info-section">
            <h3>Bill To:</h3>
            <p><strong>${customer.name}</strong></p>
            <p>${customer.email}</p>
            ${customer.phone ? `<p>${customer.phone}</p>` : ''}
          </div>
        </div>
        
        <div class="service-details">
          <h4>Service Details</h4>
          <p><strong>Vehicle:</strong> ${serviceCost.vehiclePlate}</p>
          <p><strong>Service Type:</strong> ${serviceCost.serviceType}</p>
          <p><strong>Service Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
                <td class="text-right">$${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <table>
            <tr>
              <td class="text-right">Subtotal:</td>
              <td class="text-right">$${invoice.subtotal.toFixed(2)}</td>
            </tr>
            ${invoice.taxAmount > 0 ? `
              <tr>
                <td class="text-right">Tax (${invoice.taxRate}%):</td>
                <td class="text-right">$${invoice.taxAmount.toFixed(2)}</td>
              </tr>
            ` : ''}
            ${invoice.discountAmount > 0 ? `
              <tr>
                <td class="text-right">Discount:</td>
                <td class="text-right">-$${invoice.discountAmount.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td class="text-right"><strong>Total Amount:</strong></td>
              <td class="text-right"><strong>$${invoice.totalAmount.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>
        
        <div class="payment-info">
          <h3>Payment Information</h3>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><strong>Payment Terms:</strong> ${invoice.paymentTerms || 'Net 30 days'}</p>
          <p><strong>Payment Methods:</strong> Cash, Credit Card, Bank Transfer, Check</p>
          <p><strong>Late Payment:</strong> A late fee of 1.5% per month will be charged on overdue amounts.</p>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing AUTO ELITE for your automotive service needs!</p>
          <p>For any questions regarding this invoice, please contact us at (555) 123-4567 or info@autoelite.com</p>
          <p>This invoice was generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate payment receipt HTML
const generateReceiptHTML = (payment, customer, invoice, serviceCost) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt ${payment.receiptNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #28a745; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #28a745; margin-bottom: 10px; }
        .receipt-title { font-size: 28px; color: #333; margin: 0; }
        .receipt-number { font-size: 16px; color: #666; margin: 5px 0; }
        .company-info { text-align: right; margin-bottom: 30px; }
        .customer-info { margin-bottom: 30px; }
        .info-section { margin-bottom: 20px; }
        .info-section h3 { color: #28a745; margin-bottom: 10px; font-size: 16px; }
        .info-section p { margin: 5px 0; color: #333; }
        .payment-details { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .payment-details h3 { color: #28a745; margin-top: 0; }
        .calculation-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .calculation-table th, .calculation-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .calculation-table th { background-color: #f8f9fa; font-weight: bold; color: #333; }
        .calculation-table tr:nth-child(even) { background-color: #f8f9fa; }
        .text-right { text-align: right; }
        .total-row { font-weight: bold; font-size: 18px; background-color: #28a745; color: white; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        .service-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .service-details h4 { color: #28a745; margin-top: 0; }
        .status-badge { display: inline-block; padding: 5px 15px; background-color: #28a745; color: white; border-radius: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AUTO ELITE</div>
          <h1 class="receipt-title">PAYMENT RECEIPT</h1>
          <p class="receipt-number">Receipt #: ${payment.receiptNumber}</p>
          <span class="status-badge">PAID</span>
        </div>
        
        <div class="company-info">
          <p><strong>AUTO ELITE Service Center</strong></p>
          <p>123 Service Street, City, State 12345</p>
          <p>Phone: (555) 123-4567 | Email: info@autoelite.com</p>
        </div>
        
        <div class="customer-info">
          <div class="info-section">
            <h3>Customer Information:</h3>
            <p><strong>${customer.name}</strong></p>
            <p>${customer.email}</p>
            ${customer.phone ? `<p>${customer.phone}</p>` : ''}
          </div>
        </div>
        
        <div class="service-details">
          <h4>Service Details</h4>
          <p><strong>Vehicle:</strong> ${serviceCost.vehiclePlate}</p>
          <p><strong>Service Type:</strong> ${serviceCost.serviceType}</p>
          <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Payment Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}</p>
        </div>
        
        <div class="payment-details">
          <h3>Payment Details</h3>
          <p><strong>Payment Method:</strong> ${payment.paymentDetails.paymentMethod.toUpperCase()}</p>
          ${payment.paymentDetails.paymentReference ? `<p><strong>Reference:</strong> ${payment.paymentDetails.paymentReference}</p>` : ''}
          ${payment.paymentDetails.transactionId ? `<p><strong>Transaction ID:</strong> ${payment.paymentDetails.transactionId}</p>` : ''}
        </div>
        
        <table class="calculation-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td class="text-right">$${payment.paymentCalculation.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Tax Amount</td>
              <td class="text-right">$${payment.paymentCalculation.taxAmount.toFixed(2)}</td>
            </tr>
            ${payment.paymentCalculation.loyaltyDiscount > 0 ? `
              <tr>
                <td>Loyalty Discount</td>
                <td class="text-right">-$${payment.paymentCalculation.loyaltyDiscount.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr>
              <td><strong>Gross Amount</strong></td>
              <td class="text-right"><strong>$${payment.paymentCalculation.grossAmount.toFixed(2)}</strong></td>
            </tr>
            ${payment.paymentCalculation.deductions.epf > 0 ? `
              <tr>
                <td>EPF Deduction</td>
                <td class="text-right">-$${payment.paymentCalculation.deductions.epf.toFixed(2)}</td>
              </tr>
            ` : ''}
            ${payment.paymentCalculation.deductions.etf > 0 ? `
              <tr>
                <td>ETF Deduction</td>
                <td class="text-right">-$${payment.paymentCalculation.deductions.etf.toFixed(2)}</td>
              </tr>
            ` : ''}
            ${payment.paymentCalculation.deductions.other > 0 ? `
              <tr>
                <td>Other Deductions</td>
                <td class="text-right">-$${payment.paymentCalculation.deductions.other.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td><strong>NET AMOUNT PAID</strong></td>
              <td class="text-right"><strong>$${payment.paymentCalculation.netAmount.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Thank you for your payment!</p>
          <p>This receipt confirms your payment has been processed successfully.</p>
          <p>For any questions, please contact us at (555) 123-4567 or info@autoelite.com</p>
          <p>Receipt generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send invoice email
const sendInvoiceEmail = async (invoice, customer, serviceCost) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = generateInvoiceHTML(invoice, customer, serviceCost);
    
    const mailOptions = {
      from: `"AUTO ELITE" <${process.env.SMTP_USER}>`,
      to: customer.email,
      subject: `Invoice ${invoice.invoiceNumber} - AUTO ELITE Service Center`,
      html: htmlContent,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.html`,
          content: htmlContent,
          contentType: 'text/html'
        }
      ]
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Invoice email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return { success: false, error: error.message };
  }
};

// Send payment receipt email
const sendReceiptEmail = async (payment, customer, invoice, serviceCost) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = generateReceiptHTML(payment, customer, invoice, serviceCost);
    
    const mailOptions = {
      from: `"AUTO ELITE" <${process.env.SMTP_USER}>`,
      to: customer.email,
      subject: `Payment Receipt ${payment.receiptNumber} - AUTO ELITE Service Center`,
      html: htmlContent,
      attachments: [
        {
          filename: `receipt-${payment.receiptNumber}.html`,
          content: htmlContent,
          contentType: 'text/html'
        }
      ]
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Receipt email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending receipt email:', error);
    return { success: false, error: error.message };
  }
};

// Send salary notification email
const sendSalaryNotificationEmail = async (salary, staff) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Salary Notification</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
          .title { font-size: 24px; color: #333; margin: 0; }
          .content { margin: 20px 0; }
          .salary-details { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AUTO ELITE</div>
            <h1 class="title">Salary Notification</h1>
          </div>
          
          <div class="content">
            <p>Dear ${staff.name},</p>
            <p>Your salary for the period ${new Date(salary.payPeriod.startDate).toLocaleDateString()} to ${new Date(salary.payPeriod.endDate).toLocaleDateString()} has been processed.</p>
            
            <div class="salary-details">
              <h3>Salary Details:</h3>
              <p><strong>Basic Salary:</strong> $${salary.basicSalary.toFixed(2)}</p>
              <p><strong>Regular Hours:</strong> ${salary.regularHours} hours</p>
              <p><strong>Overtime Hours:</strong> ${salary.overtimeHours} hours</p>
              <p><strong>Gross Salary:</strong> $${salary.calculations.grossSalary.toFixed(2)}</p>
              <p><strong>Total Deductions:</strong> $${salary.calculations.totalDeductions.toFixed(2)}</p>
              <p><strong>Net Salary:</strong> $${salary.calculations.netSalary.toFixed(2)}</p>
              <p><strong>Payment Status:</strong> ${salary.status.toUpperCase()}</p>
            </div>
            
            <p>If you have any questions about your salary, please contact the HR department.</p>
          </div>
          
          <div class="footer">
            <p>AUTO ELITE Service Center</p>
            <p>Phone: (555) 123-4567 | Email: hr@autoelite.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const mailOptions = {
      from: `"AUTO ELITE HR" <${process.env.SMTP_USER}>`,
      to: staff.email,
      subject: `Salary Notification - ${new Date(salary.payPeriod.startDate).toLocaleDateString()} to ${new Date(salary.payPeriod.endDate).toLocaleDateString()}`,
      html: htmlContent
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Salary notification email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending salary notification email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendInvoiceEmail,
  sendReceiptEmail,
  sendSalaryNotificationEmail
};
