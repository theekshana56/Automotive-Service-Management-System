import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate PDF for Staff Salary Report
 */
export const generateStaffSalaryReportPDF = async (salaries, summary) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: 'Staff Salary Report',
          Author: 'AE Auto Elite - Automotive Service Management System',
          Subject: 'Staff Salary Report',
          Keywords: 'staff, salary, report, automotive',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('STAFF SALARY REPORT', { align: 'center' })
         .moveDown(0.5);

      // Company Info
      doc.fontSize(12)
         .font('Helvetica')
         .text('AE Auto Elite', { align: 'center' })
         .text('Automotive Service Management System', { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(1);

      // Staff Salary Table
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Staff Salary Details')
         .moveDown(0.5);

      if (salaries && salaries.length > 0) {
        // Table headers (compressed spacing, removed Email column)
        const tableTop = doc.y;
        const staffX = 50;
        const regularPayX = 120;
        const otRateX = 190;
        const extraHoursX = 240;
        const extraWorkPayX = 300;
        const totalPayX = 370;
        const epfX = 430;
        const etfX = 490;
        const finalPayX = 550;

        // Headers
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Staff Member', staffX, tableTop)
           .text('Regular Pay', regularPayX, tableTop)
           .text('OT Rate', otRateX, tableTop)
           .text('Extra Hours', extraHoursX, tableTop)
           .text('Extra Work Pay', extraWorkPayX, tableTop)
           .text('Total Pay', totalPayX, tableTop)
           .text('EPF (8%)', epfX, tableTop)
           .text('ETF (3%)', etfX, tableTop)
           .text('Final Pay', finalPayX, tableTop);

        // Separator line
        doc.moveTo(50, tableTop + 15)
           .lineTo(630, tableTop + 15)
           .stroke();

        let currentY = tableTop + 25;

        // Staff salary rows
        salaries.forEach((salary) => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          const regularPay = salary.regularPay || salary.basicSalary || 0;
          const otRate = salary.otRate || salary.hourlyRate || 0;
          const extraHours = salary.extraHours || salary.overtimeHours || 0;
          const extraWorkPay = salary.extraWorkPay || salary.overtimePay || 0;
          const totalPay = salary.totalPay || (regularPay + extraWorkPay);
          const epf = salary.epfEmployee || salary.epf || (totalPay * 0.08);
          const etf = salary.etf || (totalPay * 0.03);
          const finalPay = salary.finalPay || (totalPay - epf - etf);

          doc.fontSize(8)
             .font('Helvetica')
             .text(salary.name || salary.staffName || 'N/A', staffX, currentY, { width: 60, ellipsis: true })
             .text(`$${regularPay.toFixed(2)}`, regularPayX, currentY)
             .text(otRate > 0 ? `$${otRate.toFixed(2)}/h` : '-', otRateX, currentY)
             .text(`${extraHours.toFixed(1)}h`, extraHoursX, currentY)
             .text(`$${extraWorkPay.toFixed(2)}`, extraWorkPayX, currentY)
             .text(`$${totalPay.toFixed(2)}`, totalPayX, currentY)
             .text(`$${epf.toFixed(2)}`, epfX, currentY)
             .text(`$${etf.toFixed(2)}`, etfX, currentY)
             .text(`$${finalPay.toFixed(2)}`, finalPayX, currentY);

          currentY += 20;
        });

        // Total line
        doc.moveTo(50, currentY)
           .lineTo(630, currentY)
           .stroke();

        currentY += 10;

        // Calculate totals
        const totalRegularPay = salaries.reduce((sum, s) => sum + (s.regularPay || s.basicSalary || 0), 0);
        const totalExtraWorkPay = salaries.reduce((sum, s) => sum + (s.extraWorkPay || s.overtimePay || 0), 0);
        const totalPay = salaries.reduce((sum, s) => sum + (s.totalPay || (s.regularPay || s.basicSalary || 0) + (s.extraWorkPay || s.overtimePay || 0)), 0);
        const totalEPF = salaries.reduce((sum, s) => sum + (s.epfEmployee || ((s.totalPay || (s.regularPay || s.basicSalary || 0) + (s.extraWorkPay || s.overtimePay || 0)) * 0.08)), 0);
        const totalETF = salaries.reduce((sum, s) => sum + (s.etf || ((s.totalPay || (s.regularPay || s.basicSalary || 0) + (s.extraWorkPay || s.overtimePay || 0)) * 0.03)), 0);
        const totalFinalPay = salaries.reduce((sum, s) => sum + (s.finalPay || (s.totalPay || (s.regularPay || s.basicSalary || 0) + (s.extraWorkPay || s.overtimePay || 0)) - (s.epfEmployee || ((s.totalPay || (s.regularPay || s.basicSalary || 0) + (s.extraWorkPay || s.overtimePay || 0)) * 0.08)) - (s.etf || ((s.totalPay || (s.regularPay || s.basicSalary || 0) + (s.extraWorkPay || s.overtimePay || 0)) * 0.03))), 0);

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('TOTALS:', 50, currentY)
           .text(`$${totalRegularPay.toFixed(2)}`, regularPayX, currentY)
           .text('-', otRateX, currentY)
           .text('-', extraHoursX, currentY)
           .text(`$${totalExtraWorkPay.toFixed(2)}`, extraWorkPayX, currentY)
           .text(`$${totalPay.toFixed(2)}`, totalPayX, currentY)
           .text(`$${totalEPF.toFixed(2)}`, epfX, currentY)
           .text(`$${totalETF.toFixed(2)}`, etfX, currentY)
           .text(`$${totalFinalPay.toFixed(2)}`, finalPayX, currentY);

      } else {
        doc.fontSize(12)
           .font('Helvetica')
           .text('No staff salary records found for the selected period.')
           .moveDown(1);
      }

      // Footer - Position at bottom center of page
      const pageHeight = 842; // A4 page height in points
      const footerY = pageHeight - 100; // Position 100 points from bottom
      
      doc.fontSize(9)
         .font('Helvetica')
         .text('Generated by AE Auto Elite - Automotive Service Management System', 50, footerY, { width: 500, align: 'center' })
         .text('Computer-generated document. No signature required.', 50, footerY + 15, { width: 500, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for Customer Payment Report
 */
export const generateCustomerPaymentReportPDF = async (serviceCosts, summary) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: 'Customer Payment Report',
          Author: 'AE Auto Elite - Automotive Service Management System',
          Subject: 'Customer Payment Report',
          Keywords: 'customer, payment, report, automotive',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('CUSTOMER PAYMENT REPORT', { align: 'center' })
         .moveDown(0.5);

      // Company Info
      doc.fontSize(12)
         .font('Helvetica')
         .text('AE Auto Elite', { align: 'center' })
         .text('Automotive Service Management System', { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(1);

      // Customer Payments Table
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Customer Payment Details')
         .moveDown(0.5);

      if (serviceCosts && serviceCosts.length > 0) {
        // Table headers
        const tableTop = doc.y;
        const customerX = 50;
        const vehicleX = 120;
        const serviceTypeX = 170;
        const costServiceX = 230;
        const profitX = 290;
        const advisorCostX = 350;
        const staffCostX = 410;
        const customerPaymentX = 470;

        // Headers
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Customer', customerX, tableTop)
           .text('Vehicle', vehicleX, tableTop)
           .text('Service', serviceTypeX, tableTop)
           .text('Cost', costServiceX, tableTop)
           .text('Profit', profitX, tableTop)
           .text('Advisor', advisorCostX, tableTop)
           .text('Staff', staffCostX, tableTop)
           .text('Payment', customerPaymentX, tableTop);

        // Separator line
        doc.moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();

        let currentY = tableTop + 25;

        // Customer payment rows
        serviceCosts.forEach((serviceCost) => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          const costService = serviceCost.finalCost?.totalAmount || 0;
          const profit = serviceCost.customerPaymentCalculation?.profitAmount || (costService * 0.8);
          const advisorCost = serviceCost.customerPaymentCalculation?.advisorFixedCost || 100;
          const staffCost = serviceCost.customerPaymentCalculation?.staffFixedCost || 60;
          const customerPayment = serviceCost.customerPaymentCalculation?.finalCustomerPayment || 
            ((costService + profit + advisorCost + staffCost) * 1.12);

          doc.fontSize(8)
             .font('Helvetica')
             .text(serviceCost.customerId?.name || 'N/A', customerX, currentY, { width: 60, ellipsis: true })
             .text(serviceCost.vehiclePlate || 'N/A', vehicleX, currentY, { width: 40, ellipsis: true })
             .text(serviceCost.serviceType || 'N/A', serviceTypeX, currentY, { width: 50, ellipsis: true })
             .text(`$${costService.toFixed(2)}`, costServiceX, currentY)
             .text(`$${profit.toFixed(2)}`, profitX, currentY)
             .text(`$${advisorCost.toFixed(2)}`, advisorCostX, currentY)
             .text(`$${staffCost.toFixed(2)}`, staffCostX, currentY)
             .text(`$${customerPayment.toFixed(2)}`, customerPaymentX, currentY);

          currentY += 20;
        });

        // Total line
        doc.moveTo(50, currentY)
           .lineTo(550, currentY)
           .stroke();

        currentY += 10;

        // Calculate totals
        const totalCostService = serviceCosts.reduce((sum, sc) => sum + (sc.finalCost?.totalAmount || 0), 0);
        const totalProfit = serviceCosts.reduce((sum, sc) => sum + (sc.customerPaymentCalculation?.profitAmount || (sc.finalCost?.totalAmount || 0) * 0.8), 0);
        const totalAdvisorCost = serviceCosts.reduce((sum, sc) => sum + (sc.customerPaymentCalculation?.advisorFixedCost || 100), 0);
        const totalStaffCost = serviceCosts.reduce((sum, sc) => sum + (sc.customerPaymentCalculation?.staffFixedCost || 60), 0);
        const totalCustomerPayment = serviceCosts.reduce((sum, sc) => sum + (sc.customerPaymentCalculation?.finalCustomerPayment || 
          ((sc.finalCost?.totalAmount || 0) + (sc.customerPaymentCalculation?.profitAmount || (sc.finalCost?.totalAmount || 0) * 0.8) + 
           (sc.customerPaymentCalculation?.advisorFixedCost || 100) + (sc.customerPaymentCalculation?.staffFixedCost || 60)) * 1.12), 0);

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('TOTALS:', 50, currentY)
           .text(`$${totalCostService.toFixed(2)}`, costServiceX, currentY)
           .text(`$${totalProfit.toFixed(2)}`, profitX, currentY)
           .text(`$${totalAdvisorCost.toFixed(2)}`, advisorCostX, currentY)
           .text(`$${totalStaffCost.toFixed(2)}`, staffCostX, currentY)
           .text(`$${totalCustomerPayment.toFixed(2)}`, customerPaymentX, currentY);
      } else {
        doc.fontSize(12)
           .font('Helvetica')
           .text('No customer payment records found for the selected period.')
           .moveDown(1);
      }

      // Footer - Position at bottom center of page
      const pageHeight = 842; // A4 page height in points
      const footerY = pageHeight - 100; // Position 100 points from bottom
      
      doc.fontSize(9)
         .font('Helvetica')
         .text('Generated by AE Auto Elite - Automotive Service Management System', 50, footerY, { width: 500, align: 'center' })
         .text('Computer-generated document. No signature required.', 50, footerY + 15, { width: 500, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for Service Cost Report
 */
export const generateServiceCostReportPDF = async (serviceCosts, summary) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: 'Service Cost Report',
          Author: 'AE Auto Elite - Automotive Service Management System',
          Subject: 'Service Cost Report',
          Keywords: 'service, cost, report, automotive',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('SERVICE COST REPORT', { align: 'center' })
         .moveDown(0.5);

      // Company Info
      doc.fontSize(12)
         .font('Helvetica')
         .text('AE Auto Elite', { align: 'center' })
         .text('Automotive Service Management System', { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(1);

      // Service Costs Table
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Service Cost Details')
         .moveDown(0.5);

      if (serviceCosts && serviceCosts.length > 0) {
        // Table headers
        const tableTop = doc.y;

        // Dynamic, evenly spaced columns between left and right margins
        const baseX = 50;            // left margin
        const tableWidth = 500;      // draws to x = 550
        const colCount = 5;          // Customer, Vehicle, Service, Advisor, Cost
        const colWidth = tableWidth / colCount;

        const customerX = baseX + (0 * colWidth);
        const vehicleX = baseX + (1 * colWidth);
        const serviceTypeX = baseX + (2 * colWidth);
        const advisorX = baseX + (3 * colWidth);
        const costX = baseX + (4 * colWidth);

        // Headers
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Customer', customerX, tableTop, { width: colWidth })
           .text('Vehicle',  vehicleX,  tableTop, { width: colWidth })
           .text('Service',  serviceTypeX, tableTop, { width: colWidth })
           .text('Advisor',  advisorX,  tableTop, { width: colWidth })
           .text('Cost',     costX,     tableTop, { width: colWidth, align: 'right' });

        // Separator line
        doc.moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();

        let currentY = tableTop + 25;

        // Service cost rows
        serviceCosts.forEach((serviceCost) => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          const cost = serviceCost.finalCost?.totalAmount || serviceCost.serviceCost || 0;

          doc.fontSize(8)
             .font('Helvetica')
             .text(serviceCost.customerId?.name || 'N/A', customerX, currentY, { width: colWidth, ellipsis: true })
             .text(serviceCost.vehiclePlate || 'N/A',     vehicleX,  currentY, { width: colWidth, ellipsis: true })
             .text(serviceCost.serviceType || 'N/A',      serviceTypeX, currentY, { width: colWidth, ellipsis: true })
             .text(serviceCost.advisorId?.name || 'N/A',  advisorX,  currentY, { width: colWidth, ellipsis: true })
             .text(`$${cost.toFixed(2)}`,                 costX,     currentY, { width: colWidth, align: 'right' });

          currentY += 20;
        });

        // Total line
        doc.moveTo(50, currentY)
           .lineTo(550, currentY)
           .stroke();

        currentY += 10;

        // Calculate totals
        const totalCost = serviceCosts.reduce((sum, sc) => sum + (sc.finalCost?.totalAmount || sc.serviceCost || 0), 0);

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('TOTALS:', baseX, currentY, { width: colWidth })
           .text(`$${totalCost.toFixed(2)}`, costX, currentY, { width: colWidth, align: 'right' });

      } else {
        doc.fontSize(12)
           .font('Helvetica')
           .text('No service cost records found for the selected period.')
           .moveDown(1);
      }

      // Footer - Position at bottom center of page
      const pageHeight = 842; // A4 page height in points
      const footerY = pageHeight - 100; // Position 100 points from bottom
      
      doc.fontSize(9)
         .font('Helvetica')
         .text('Generated by AE Auto Elite - Automotive Service Management System', 50, footerY, { width: 500, align: 'center' })
         .text('Computer-generated document. No signature required.', 50, footerY + 15, { width: 500, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for Combined Finance Report
 */
export const generateCombinedFinanceReportPDF = async (salaries, serviceCosts, salarySummary, paymentSummary) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: 'Combined Finance Report',
          Author: 'AE Auto Elite - Automotive Service Management System',
          Subject: 'Combined Finance Report',
          Keywords: 'finance, staff, customer, payment, report, automotive',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('COMBINED FINANCE REPORT', { align: 'center' })
         .moveDown(0.5);

      // Company Info
      doc.fontSize(12)
         .font('Helvetica')
         .text('AE Auto Elite', { align: 'center' })
         .text('Automotive Service Management System', { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(1);

      // Executive Summary
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Executive Summary')
         .moveDown(0.5);

      const totalStaffCost = salarySummary?.totalNetSalary || 0;
      const totalCustomerRevenue = paymentSummary?.totalCustomerPayment || 0;
      const netProfit = totalCustomerRevenue - totalStaffCost;

      const summaryData = [
          ['Total Staff Costs:', `$${totalStaffCost.toLocaleString()}`],
          ['Total Customer Revenue:', `$${totalCustomerRevenue.toLocaleString()}`],
          ['Net Profit:', `$${netProfit.toLocaleString()}`],
          ['Profit Margin:', `${totalCustomerRevenue > 0 ? ((netProfit / totalCustomerRevenue) * 100).toFixed(2) : 0}%`]
      ];

      summaryData.forEach(([label, value]) => {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(label, { continued: true })
           .font('Helvetica')
           .text(` ${value}`)
           .moveDown(0.3);
      });

      doc.moveDown(1);

      // Staff Salary Summary
      if (salarySummary) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Staff Salary Summary')
           .moveDown(0.3);

        const salaryData = [
          ['Total Staff Members:', salarySummary.totalSalaries || 0],
          ['Total Net Salary Paid:', `$${(salarySummary.totalNetSalary || 0).toLocaleString()}`],
          ['Total EPF Contributions:', `$${(salarySummary.totalEPF || 0).toLocaleString()}`],
          ['Total ETF Contributions:', `$${(salarySummary.totalETF || 0).toLocaleString()}`]
        ];

        salaryData.forEach(([label, value]) => {
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text(label, { continued: true })
             .font('Helvetica')
             .text(` ${value}`)
             .moveDown(0.2);
        });

        doc.moveDown(0.5);
      }

      // Customer Payment Summary
      if (paymentSummary) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Customer Payment Summary')
           .moveDown(0.3);

        const paymentData = [
          ['Total Service Cost:', `$${(paymentSummary.totalServiceCost || 0).toLocaleString()}`],
          ['Total Profit (80%):', `$${(paymentSummary.totalProfitAmount || 0).toLocaleString()}`],
          ['Total Advisor Fixed Cost:', `$${(paymentSummary.totalAdvisorFixedCost || 0).toLocaleString()}`],
          ['Total Staff Fixed Cost:', `$${(paymentSummary.totalStaffFixedCost || 0).toLocaleString()}`],
          ['Total Customer Payment:', `$${(paymentSummary.totalCustomerPayment || 0).toLocaleString()}`]
        ];

        paymentData.forEach(([label, value]) => {
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text(label, { continued: true })
             .font('Helvetica')
             .text(` ${value}`)
             .moveDown(0.2);
        });

        doc.moveDown(0.5);
      }

      // Footer - bottom center
      const pageHeightCombined = 842;
      const footerYCombined = pageHeightCombined - 80;
      doc.fontSize(9)
         .font('Helvetica')
         .text('Generated by AE Auto Elite - Automotive Service Management System', 50, footerYCombined, { width: 500, align: 'center' })
         .text('Computer-generated document. No signature required.', 50, footerYCombined + 15, { width: 500, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for Purchase Order Cost Report
 */
export const generatePurchaseOrderCostReportPDF = async (purchaseOrders, summary) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: 'Purchase Order Cost Report',
          Author: 'AE Auto Elite - Automotive Service Management System',
          Subject: 'Purchase Order Cost Report',
          Keywords: 'purchase, order, cost, report, automotive',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('PURCHASE ORDER COST REPORT', { align: 'center' })
         .moveDown(0.5);

      // Company Info
      doc.fontSize(12)
         .font('Helvetica')
         .text('AE Auto Elite', { align: 'center' })
         .text('Automotive Service Management System', { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(1);

      // Purchase Order Cost Table
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Purchase Order Cost Details')
         .moveDown(0.5);

      if (purchaseOrders && purchaseOrders.length > 0) {
        // Table headers (compressed spacing)
        const tableTop = doc.y;
        const itemX = 50;
        const supplierX = 150;
        const deliveryX = 250;
        const quantityX = 350;
        const unitPriceX = 420;
        const totalX = 490;

        // Headers
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Item', itemX, tableTop)
           .text('Supplier', supplierX, tableTop)
           .text('Delivery Expected', deliveryX, tableTop)
           .text('Quantity', quantityX, tableTop)
           .text('Unit Price', unitPriceX, tableTop)
           .text('Total', totalX, tableTop)
           .text('Amount', totalX, tableTop + 8);

        // Separator line
        doc.moveTo(50, tableTop + 20)
           .lineTo(560, tableTop + 20)
           .stroke();

        let currentY = tableTop + 30;

        // Purchase order rows
        purchaseOrders.forEach((po) => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          const total = po.totalAmount || po.total || 0;
          const deliveryDate = po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'N/A';
          const supplierName = po.supplier?.name || 'N/A';
          const items = po.items || [];
          
          if (items.length > 0) {
            // Show each item separately
            items.forEach((item, index) => {
              const itemName = item.part?.name || item.part?.partNumber || item.name || 'N/A';
              const quantity = item.quantity || 0;
              const unitPrice = item.unitPrice || 0;
              const itemTotal = item.totalPrice || (unitPrice * quantity) || 0;
              
              doc.fontSize(8)
                 .font('Helvetica')
                 .text(itemName, itemX, currentY, { width: 90, ellipsis: true })
                 .text(supplierName, supplierX, currentY, { width: 90, ellipsis: true })
                 .text(deliveryDate, deliveryX, currentY, { width: 90, ellipsis: true })
                 .text(quantity.toString(), quantityX, currentY)
                 .text(`$${unitPrice.toFixed(2)}`, unitPriceX, currentY)
                 .text(`$${itemTotal.toFixed(2)}`, totalX, currentY);

              currentY += 20;
            });
          } else {
            // Fallback if no items array
            const itemCount = po.itemCount || 1;
            
            doc.fontSize(8)
               .font('Helvetica')
               .text('N/A', itemX, currentY, { width: 90, ellipsis: true })
               .text(supplierName, supplierX, currentY, { width: 90, ellipsis: true })
               .text(deliveryDate, deliveryX, currentY, { width: 90, ellipsis: true })
               .text(itemCount.toString(), quantityX, currentY)
               .text('$0.00', unitPriceX, currentY)
               .text(`$${total.toFixed(2)}`, totalX, currentY);

            currentY += 20;
          }
        });

        // Total line
        doc.moveTo(50, currentY)
           .lineTo(560, currentY)
           .stroke();

        currentY += 10;

        // Calculate totals
        const totalAmount = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || po.total || 0), 0);
        const totalQuantity = purchaseOrders.reduce((sum, po) => {
          if (po.items && po.items.length > 0) {
            return sum + po.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
          }
          return sum + (po.itemCount || 1);
        }, 0);

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('TOTALS:', 50, currentY)
           .text(totalQuantity.toString(), quantityX, currentY)
           .text(`$${totalAmount.toFixed(2)}`, totalX, currentY);

      } else {
        doc.fontSize(12)
           .font('Helvetica')
           .text('No purchase order records found for the selected period.')
           .moveDown(1);
      }

      // Footer - Position at bottom center of page
      const pageHeight = 842; // A4 page height in points
      const footerY = pageHeight - 100; // Position 100 points from bottom
      
      doc.fontSize(9)
         .font('Helvetica')
         .text('Generated by AE Auto Elite - Automotive Service Management System', 50, footerY, { width: 500, align: 'center' })
         .text('Computer-generated document. No signature required.', 50, footerY + 15, { width: 500, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for Final Amount Report
 */
export const generateFinalAmountReportPDF = async ({
  initialCapital = 0,
  customerPayments = 0,
  staffSalaries = 0,
  inventoryPayments = 0,
  serviceCost = 0,
  finalAmount = 0
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Final Amount Report',
          Author: 'AE Auto Elite - Automotive Service Management System',
          Subject: 'Final Amount Report',
          Keywords: 'final amount, finance, report, automotive',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('FINAL AMOUNT REPORT', { align: 'center' }).moveDown(0.5);
      doc.fontSize(12).font('Helvetica')
        .text('AE Auto Elite', { align: 'center' })
        .text('Automotive Service Management System', { align: 'center' })
        .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
        .moveDown(1);

      // Table
      doc.fontSize(16).font('Helvetica-Bold').text('Summary').moveDown(0.5);
      const baseX = 50; const tableWidth = 500; const leftX = baseX; const rightX = baseX + tableWidth;
      const headerY = doc.y;
      doc.fontSize(9).font('Helvetica-Bold').text('Category', leftX, headerY).text('Amount', leftX, headerY, { width: tableWidth, align: 'right' });
      doc.moveTo(50, headerY + 15).lineTo(550, headerY + 15).stroke();
      let y = headerY + 25;
      const row = (label, value) => {
        doc.fontSize(8).font('Helvetica').text(label, leftX, y).text(`$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, leftX, y, { width: tableWidth, align: 'right', lineBreak: false });
        y += 20;
      };
      row('Initial Capital', initialCapital);
      row('Customer Payments', customerPayments);
      row('Staff Salaries', staffSalaries);
      row('Inventory Payments', inventoryPayments);
      row('Service Cost', serviceCost);
      doc.moveTo(50, y).lineTo(550, y).stroke(); y += 10;
      doc.fontSize(10).font('Helvetica-Bold').text('Final Amount', leftX, y)
        .text(`$${Number(finalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, leftX, y, { width: tableWidth, align: 'right', lineBreak: false });

      // Spacer before footer
      doc.moveDown(2);

      // Footer bottom center
      const pageHeight = 842; const footerY = pageHeight - 80;
      doc.fontSize(9).font('Helvetica')
        .text('Generated by AE Auto Elite - Automotive Service Management System', 50, footerY, { width: 500, align: 'center' })
        .text('Computer-generated document. No signature required.', 50, footerY + 15, { width: 500, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate PDF for Profit/Loss Report
 */
export const generateProfitLossReportPDF = async (summary) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: 'Profit/Loss Report',
          Author: 'AE Auto Elite - Automotive Service Management System',
          Subject: 'Profit/Loss Report',
          Keywords: 'profit, loss, finance, report, automotive',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('PROFIT / LOSS REPORT', { align: 'center' })
         .moveDown(0.5);

      // Company Info
      doc.fontSize(12)
         .font('Helvetica')
         .text('AE Auto Elite', { align: 'center' })
         .text('Automotive Service Management System', { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(1);

      const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      // Summary table (two columns like the provided example)
      doc.fontSize(16).font('Helvetica-Bold').text('Summary Details').moveDown(0.5);

      const tableTop = doc.y;
      const leftX = 50;
      const tableWidth = 500; // draw within page margins (50..550)

      // Header row
      doc.fontSize(9).font('Helvetica-Bold')
         .text('Category', leftX, tableTop)
         .text('Amount', leftX, tableTop, { width: tableWidth, align: 'right', lineBreak: false });

      // Separator
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let currentY = tableTop + 25;
      const rows = [
        ['Customer Payments', fmt(summary.customerPayments)],
        ['Service Costs', fmt(summary.serviceCosts)],
        ['Inventory Payments', fmt(summary.inventoryPayments)],
        ['Staff Salaries', fmt(summary.staffSalaries)]
      ];

      rows.forEach(([label, value]) => {
        if (currentY > 700) { doc.addPage(); currentY = 50; }
        doc.fontSize(8).font('Helvetica')
           .text(label, leftX, currentY)
           .text(value, leftX, currentY, { width: tableWidth, align: 'right', lineBreak: false });
        currentY += 20;
      });

      // Totals line
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 10;
      doc.fontSize(10).font('Helvetica-Bold')
         .text('Net Profit/Loss', leftX, currentY)
         .text(fmt(summary.netProfitLoss), leftX, currentY, { width: tableWidth, align: 'right', lineBreak: false });

      doc.moveDown(1);

      // Verdict
      const isProfit = Number(summary.netProfitLoss || 0) >= 0;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(isProfit ? 'green' : 'red')
         .text(isProfit ? 'Company is PROFITABLE' : 'Company is NOT PROFITABLE', 50, doc.y, { width: 500, align: 'center', lineBreak: false })
         .fillColor('black')
         .moveDown(0.5);

      // Footer - bottom center
      const pageHeightPL = 842;
      const footerYPL = pageHeightPL - 80;
      doc.fontSize(9)
         .font('Helvetica')
         .text('Generated by AE Auto Elite - Automotive Service Management System', 50, footerYPL, { width: 500, align: 'center' })
         .text('Computer-generated document. No signature required.', 50, footerYPL + 15, { width: 500, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
