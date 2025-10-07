import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Company branding and styling constants
const COMPANY_INFO = {
  name: 'Automotive Service Management System',
  address: '123 Auto Service Lane, City, State 12345',
  phone: '(555) 123-4567',
  email: 'info@autoservice.com',
  website: 'www.autoservice.com'
};

const COLORS = {
  primary: '#1e40af',      // Blue
  secondary: '#059669',    // Green
  accent: '#dc2626',       // Red
  warning: '#d97706',      // Orange
  dark: '#374151',         // Dark gray
  light: '#f3f4f6',        // Light gray
  border: '#d1d5db'        // Border gray
};

// Helper function to add company header
const addCompanyHeader = (doc, title, subtitle = '') => {
  // Background rectangle for header
  doc.rect(0, 0, 595, 80)
     .fill(COLORS.primary);
  
  // Company logo area (placeholder)
  doc.rect(20, 15, 50, 50)
     .fill(COLORS.light)
     .stroke(COLORS.border);
  
  // Company name
  doc.fillColor('white')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text(COMPANY_INFO.name, 80, 25);
  
  // Company details
  doc.fontSize(9)
     .font('Helvetica')
     .text(COMPANY_INFO.address, 80, 45)
     .text(`${COMPANY_INFO.phone} | ${COMPANY_INFO.email}`, 80, 55);
  
  // Document title
  doc.fillColor(COLORS.dark)
     .fontSize(20)
     .font('Helvetica-Bold')
     .text(title, 0, 100, { align: 'center' });
  
  if (subtitle) {
    doc.fontSize(12)
       .font('Helvetica')
       .text(subtitle, 0, 125, { align: 'center' });
  }
  
  // Separator line
  doc.strokeColor(COLORS.border)
     .lineWidth(1)
     .moveTo(50, 140)
     .lineTo(545, 140)
     .stroke();
  
  doc.moveDown(1);
};

// Helper function to add professional table
const addTable = (doc, headers, rows, options = {}) => {
  const { startY = doc.y, colWidths = [], headerColor = COLORS.primary, 
          rowHeight = 20, fontSize = 10, showBorders = true } = options;
  
  let currentY = startY;
  const pageWidth = 545; // A4 width minus margins
  const defaultColWidth = pageWidth / headers.length;
  
  // Calculate column widths
  const widths = colWidths.length > 0 ? colWidths : 
    headers.map(() => defaultColWidth);
  
  // Draw header
  doc.fillColor(headerColor)
     .rect(50, currentY, pageWidth, rowHeight)
     .fill();
  
  doc.fillColor('white')
     .fontSize(fontSize)
     .font('Helvetica-Bold');
  
  let xPos = 50;
  headers.forEach((header, index) => {
    doc.text(header, xPos + 5, currentY + 5, { width: widths[index] - 10 });
    xPos += widths[index];
  });
  
  currentY += rowHeight;
  
  // Draw rows
  doc.fillColor(COLORS.dark)
     .font('Helvetica');
  
  rows.forEach((row, rowIndex) => {
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.fillColor('#f9fafb')
         .rect(50, currentY, pageWidth, rowHeight)
         .fill();
    }
    
    doc.fillColor(COLORS.dark);
    
    xPos = 50;
    row.forEach((cell, colIndex) => {
      doc.text(cell, xPos + 5, currentY + 5, { width: widths[colIndex] - 10 });
      xPos += widths[colIndex];
    });
    
    currentY += rowHeight;
    
    // Check for page break
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }
  });
  
  // Draw borders if requested
  if (showBorders) {
    doc.strokeColor(COLORS.border)
       .lineWidth(0.5);
    
    // Vertical lines
    xPos = 50;
    for (let i = 0; i <= headers.length; i++) {
      doc.moveTo(xPos, startY)
         .lineTo(xPos, currentY)
         .stroke();
      xPos += widths[i] || 0;
    }
    
    // Horizontal lines
    for (let i = 0; i <= rows.length; i++) {
      const y = startY + (i * rowHeight);
      doc.moveTo(50, y)
         .lineTo(50 + pageWidth, y)
         .stroke();
    }
  }
  
  return currentY;
};

// Helper function to add signature section
const addSignatureSection = (doc, yPosition) => {
  doc.fillColor(COLORS.dark)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Authorized Signature', 50, yPosition);
  
  doc.moveDown(2);
  
  // Signature line
  doc.strokeColor(COLORS.dark)
     .lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(200, doc.y)
     .stroke();
  
  doc.fontSize(10)
     .font('Helvetica')
     .text('Signature', 50, doc.y + 5);
  
  // Date line
  doc.strokeColor(COLORS.dark)
     .moveTo(300, doc.y - 5)
     .lineTo(450, doc.y - 5)
     .stroke();
  
  doc.text('Date', 300, doc.y);
  
  doc.moveDown(1);
};

// Helper function to add footer
const addFooter = (doc) => {
  const pageHeight = 842; // A4 height
  const footerY = pageHeight - 50;
  
  doc.fillColor(COLORS.dark)
     .fontSize(8)
     .font('Helvetica')
     .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY)
     .text('Page 1', 0, footerY, { align: 'center' })
     .text(COMPANY_INFO.website, 0, footerY, { align: 'right' });
  
  // Footer line
  doc.strokeColor(COLORS.border)
     .lineWidth(0.5)
     .moveTo(50, footerY - 10)
     .lineTo(545, footerY - 10)
     .stroke();
};

/**
 * Generate PDF for a single purchase order
 */
export const generatePurchaseOrderPDF = async (purchaseOrder, supplier, parts) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Purchase Order - ${purchaseOrder.poNumber || purchaseOrder._id}`,
          Author: COMPANY_INFO.name,
          Subject: 'Purchase Order',
          Keywords: 'purchase order, automotive, parts',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add professional header
      addCompanyHeader(doc, 'PURCHASE ORDER', `PO #${purchaseOrder.poNumber || purchaseOrder._id}`);

      // PO Details Section
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Purchase Order Details', 50, doc.y);

      // Create PO details table
      const poDetailsRows = [
        ['PO Number:', purchaseOrder.poNumber || purchaseOrder._id],
        ['Date:', new Date(purchaseOrder.createdAt).toLocaleDateString()],
        ['Status:', purchaseOrder.status || 'Pending'],
        ['Expected Delivery:', purchaseOrder.expectedDeliveryDate ? new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString() : 'Not specified']
      ];

      const poDetailsTableY = doc.y + 20;
      addTable(doc, ['Field', 'Value'], poDetailsRows, {
        startY: poDetailsTableY,
        colWidths: [150, 395],
        headerColor: COLORS.secondary,
        rowHeight: 25
      });

      doc.moveDown(1);

      // Supplier Information Section
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Supplier Information', 50, doc.y);

      if (supplier) {
        const supplierRows = [
          ['Company Name:', supplier.name || 'N/A'],
          ['Email:', supplier.email || 'N/A'],
          ['Phone:', supplier.phone || 'N/A'],
          ['Address:', supplier.address || 'N/A']
        ];

        const supplierTableY = doc.y + 20;
        addTable(doc, ['Field', 'Value'], supplierRows, {
          startY: supplierTableY,
          colWidths: [150, 395],
          headerColor: COLORS.secondary,
          rowHeight: 25
        });
      }

      doc.moveDown(1);

      // Delivery Address Section
      if (purchaseOrder.deliveryAddress && Object.values(purchaseOrder.deliveryAddress).some(val => val)) {
        doc.fillColor(COLORS.primary)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Delivery Address', 50, doc.y);

        const address = purchaseOrder.deliveryAddress;
        const addressParts = [
          address.street,
          address.city,
          address.state,
          address.zipCode,
          address.country
        ].filter(Boolean);

        if (addressParts.length > 0) {
          const addressRows = [
            ['Street:', address.street || 'N/A'],
            ['City:', address.city || 'N/A'],
            ['State:', address.state || 'N/A'],
            ['ZIP Code:', address.zipCode || 'N/A'],
            ['Country:', address.country || 'N/A']
          ];

          const addressTableY = doc.y + 20;
          addTable(doc, ['Field', 'Value'], addressRows, {
            startY: addressTableY,
            colWidths: [150, 395],
            headerColor: COLORS.secondary,
            rowHeight: 25
          });
        }

        doc.moveDown(1);
      }

      // Payment Information Section
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Payment Information', 50, doc.y);

      const paymentRows = [
        ['Payment Terms:', purchaseOrder.paymentTerms || 'Not specified'],
        ['Payment Method:', purchaseOrder.paymentMethod || 'Not specified']
      ];

      const paymentTableY = doc.y + 20;
      addTable(doc, ['Field', 'Value'], paymentRows, {
        startY: paymentTableY,
        colWidths: [150, 395],
        headerColor: COLORS.secondary,
        rowHeight: 25
      });

      doc.moveDown(1);

      // Items Table Section
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Order Items', 50, doc.y);

      if (purchaseOrder.items && purchaseOrder.items.length > 0) {
        const itemHeaders = ['Item Code', 'Item Name', 'Qty', 'Unit Price', 'Total'];
        const itemRows = [];
        let grandTotal = 0;

        purchaseOrder.items.forEach((item) => {
          const part = parts.find(p => p._id === item.part);
          const itemName = part ? part.name : 'Unknown Part';
          const itemCode = part ? part.partCode : 'N/A';
          const quantity = item.quantity || 0;
          const unitPrice = item.unitPrice || 0;
          const total = quantity * unitPrice;
          grandTotal += total;

          itemRows.push([
            itemCode,
            itemName,
            quantity.toString(),
            `$${unitPrice.toFixed(2)}`,
            `$${total.toFixed(2)}`
          ]);
        });

        const itemsTableY = doc.y + 20;
        addTable(doc, itemHeaders, itemRows, {
          startY: itemsTableY,
          colWidths: [80, 200, 60, 80, 80],
          headerColor: COLORS.accent,
          rowHeight: 25
        });

        // Add subtotal section
        doc.moveDown(1);
        doc.fillColor(COLORS.dark)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Subtotal:', 400, doc.y)
           .text(`$${grandTotal.toFixed(2)}`, 480, doc.y);

        // Add tax calculation (if applicable)
        const taxRate = 0.08; // 8% tax rate
        const taxAmount = grandTotal * taxRate;
        const finalTotal = grandTotal + taxAmount;

        doc.moveDown(0.5);
        doc.text('Tax (8%):', 400, doc.y)
           .text(`$${taxAmount.toFixed(2)}`, 480, doc.y);

        // Grand total with emphasis
        doc.moveDown(0.5);
        doc.fillColor(COLORS.accent)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('GRAND TOTAL:', 400, doc.y)
           .text(`$${finalTotal.toFixed(2)}`, 480, doc.y);
      }

      // Notes Section
      if (purchaseOrder.notes) {
        doc.moveDown(2);
        doc.fillColor(COLORS.primary)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Notes', 50, doc.y);

        doc.fillColor(COLORS.dark)
           .fontSize(10)
           .font('Helvetica')
           .text(purchaseOrder.notes, 50, doc.y + 20, { width: 495 });
      }

      // Shipping Instructions Section
      if (purchaseOrder.shippingInstructions) {
        doc.moveDown(1);
        doc.fillColor(COLORS.primary)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Shipping Instructions', 50, doc.y);

        doc.fillColor(COLORS.dark)
           .fontSize(10)
           .font('Helvetica')
           .text(purchaseOrder.shippingInstructions, 50, doc.y + 20, { width: 495 });
      }

      // Signature Section
      doc.moveDown(2);
      addSignatureSection(doc, doc.y);

      // Footer
      addFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for multiple purchase orders (summary report)
 */
export const generatePurchaseOrdersSummaryPDF = async (purchaseOrders, suppliers, parts) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: 'Purchase Orders Summary Report',
          Author: COMPANY_INFO.name,
          Subject: 'Purchase Orders Summary',
          Keywords: 'purchase orders, summary, automotive, parts',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add professional header
      addCompanyHeader(doc, 'PURCHASE ORDERS SUMMARY REPORT', `Generated on ${new Date().toLocaleDateString()}`);

      // Summary Statistics Section
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Summary Statistics', 50, doc.y);

      // Calculate summary statistics
      const totalOrders = purchaseOrders.length;
      const totalValue = purchaseOrders.reduce((sum, po) => {
        return sum + (po.items ? po.items.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0) : 0);
      }, 0);
      
      const statusCounts = purchaseOrders.reduce((counts, po) => {
        const status = po.status || 'Pending';
        counts[status] = (counts[status] || 0) + 1;
        return counts;
      }, {});

      const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

      const summaryRows = [
        ['Total Orders:', totalOrders.toString()],
        ['Total Value:', `$${totalValue.toFixed(2)}`],
        ['Average Order Value:', `$${avgOrderValue.toFixed(2)}`],
        ['Pending Orders:', (statusCounts.Pending || 0).toString()],
        ['Approved Orders:', (statusCounts.Approved || 0).toString()],
        ['Completed Orders:', (statusCounts.Completed || 0).toString()]
      ];

      const summaryTableY = doc.y + 20;
      addTable(doc, ['Metric', 'Value'], summaryRows, {
        startY: summaryTableY,
        colWidths: [200, 345],
        headerColor: COLORS.secondary,
        rowHeight: 25
      });

      doc.moveDown(1);

      // Purchase Orders Table Section
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Purchase Orders Overview', 50, doc.y);

      if (purchaseOrders.length > 0) {
        const headers = ['PO Number', 'Date', 'Supplier', 'Status', 'Items', 'Total Value'];
        const rows = [];
        let grandTotal = 0;

        purchaseOrders.forEach((po) => {
          const supplier = suppliers.find(s => s._id === po.supplier);
          const supplierName = supplier ? supplier.name : 'Unknown Supplier';
          const poTotal = po.items ? po.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) : 0;
          const itemCount = po.items ? po.items.length : 0;
          grandTotal += poTotal;

          rows.push([
            po.poNumber || po._id.slice(-8),
            new Date(po.createdAt).toLocaleDateString(),
            supplierName,
            po.status || 'Pending',
            itemCount.toString(),
            `$${poTotal.toFixed(2)}`
          ]);
        });

        const ordersTableY = doc.y + 20;
        addTable(doc, headers, rows, {
          startY: ordersTableY,
          colWidths: [80, 80, 150, 80, 60, 95],
          headerColor: COLORS.accent,
          rowHeight: 25
        });

        // Add totals section
        doc.moveDown(1);
        doc.fillColor(COLORS.dark)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Total Orders:', 400, doc.y)
           .text(totalOrders.toString(), 480, doc.y);

        doc.moveDown(0.5);
        doc.fillColor(COLORS.accent)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('GRAND TOTAL VALUE:', 400, doc.y)
           .text(`$${grandTotal.toFixed(2)}`, 480, doc.y);

        // Add status breakdown
        doc.moveDown(1);
        doc.fillColor(COLORS.primary)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Status Breakdown:', 50, doc.y);

        const statusRows = Object.entries(statusCounts).map(([status, count]) => [
          status,
          count.toString(),
          `$${(grandTotal * (count / totalOrders)).toFixed(2)}`
        ]);

        const statusTableY = doc.y + 20;
        addTable(doc, ['Status', 'Count', 'Value'], statusRows, {
          startY: statusTableY,
          colWidths: [150, 100, 295],
          headerColor: COLORS.secondary,
          rowHeight: 25
        });
      } else {
        doc.fillColor(COLORS.dark)
           .fontSize(12)
           .font('Helvetica')
           .text('No purchase orders found for the selected criteria.', 50, doc.y + 20);
      }

      // Add analysis section
      doc.moveDown(1);
      doc.fillColor(COLORS.primary)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Analysis Notes:', 50, doc.y);

      const analysisText = `
This report provides a comprehensive overview of purchase orders for the specified period. 
Key insights include order volume, total spending, and status distribution. 
Use this information to track procurement performance and supplier relationships.

Recommendations:
• Monitor pending orders to ensure timely processing
• Analyze supplier performance based on order frequency and value
• Review average order values to optimize procurement strategies
• Track status trends to identify process bottlenecks
      `.trim();

      doc.fillColor(COLORS.dark)
         .fontSize(10)
         .font('Helvetica')
         .text(analysisText, 50, doc.y + 20, { width: 495 });

      // Footer
      addFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for stock summary report
 */
export const generateStockSummaryPDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: { 
          Title: 'Stock Summary Report', 
          Author: COMPANY_INFO.name,
          Subject: 'Inventory Stock Summary',
          Keywords: 'stock, inventory, automotive, parts',
          CreationDate: new Date()
        } 
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add professional header
      addCompanyHeader(doc, 'STOCK SUMMARY REPORT', `Generated on ${new Date().toLocaleDateString()}`);

      // Summary Statistics Section
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Inventory Overview', 50, doc.y);

      // Calculate additional statistics
      const lowStockItems = data.items.filter(item => item.available <= (item.minLevel || 0)).length;
      const outOfStockItems = data.items.filter(item => item.available <= 0).length;
      const overstockItems = data.items.filter(item => item.available > (item.maxLevel || 0)).length;
      const totalCategories = [...new Set(data.items.map(item => item.category))].length;

      const summaryRows = [
        ['Total Parts:', data.summary.totalParts.toString()],
        ['Total On Hand:', data.summary.totalOnHand.toString()],
        ['Total Available:', data.summary.totalAvailable.toString()],
        ['Stock Value:', `$${Number(data.summary.totalValuation || 0).toFixed(2)}`],
        ['Categories:', totalCategories.toString()],
        ['Low Stock Items:', lowStockItems.toString()],
        ['Out of Stock Items:', outOfStockItems.toString()],
        ['Overstock Items:', overstockItems.toString()]
      ];

      const summaryTableY = doc.y + 20;
      addTable(doc, ['Metric', 'Value'], summaryRows, {
        startY: summaryTableY,
        colWidths: [200, 345],
        headerColor: COLORS.secondary,
        rowHeight: 25
      });

      doc.moveDown(1);

      // Stock Status Indicators Section
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Stock Status Breakdown', 50, doc.y);

      const statusRows = [
        ['In Stock', data.items.filter(item => item.available > (item.minLevel || 0)).length.toString()],
        ['Low Stock', lowStockItems.toString()],
        ['Out of Stock', outOfStockItems.toString()],
        ['Overstock', overstockItems.toString()]
      ];

      const statusTableY = doc.y + 20;
      addTable(doc, ['Status', 'Count'], statusRows, {
        startY: statusTableY,
        colWidths: [200, 345],
        headerColor: COLORS.accent,
        rowHeight: 25
      });

      doc.moveDown(1);

      // Detailed Stock Table Section
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Detailed Stock Information', 50, doc.y);

      if (data.items && data.items.length > 0) {
        const headers = ['Part Code', 'Name', 'Category', 'On Hand', 'Reserved', 'Available', 'Min Level', 'Max Level', 'Reorder Level', 'Status', 'Unit Price', 'Total Value'];
        const rows = [];

        data.items.forEach((item) => {
          // Determine status color/indicator
          let status = 'In Stock';
          if (item.available <= 0) {
            status = 'Out of Stock';
          } else if (item.available <= (item.minLevel || 0)) {
            status = 'Low Stock';
          } else if (item.available > (item.maxLevel || 0)) {
            status = 'Overstock';
          }

          rows.push([
            item.partCode || 'N/A',
            item.name || 'N/A',
            item.category || 'N/A',
            String(item.onHand || 0),
            String(item.reserved || 0),
            String(item.available || 0),
            String(item.minLevel || 'N/A'),
            String(item.maxLevel || 'N/A'),
            String(item.reorderLevel || 'N/A'),
            status,
            `$${Number(item.unitPrice || 0).toFixed(2)}`,
            `$${Number(item.value || 0).toFixed(2)}`
          ]);
        });

        const stockTableY = doc.y + 20;
        addTable(doc, headers, rows, {
          startY: stockTableY,
          colWidths: [60, 120, 80, 50, 50, 50, 50, 50, 50, 70, 60, 70],
          headerColor: COLORS.accent,
          rowHeight: 20,
          fontSize: 8
        });

        // Add category breakdown
        doc.moveDown(1);
        doc.fillColor(COLORS.primary)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Category Breakdown:', 50, doc.y);

        const categoryStats = data.items.reduce((stats, item) => {
          const category = item.category || 'Uncategorized';
          if (!stats[category]) {
            stats[category] = { count: 0, value: 0, onHand: 0 };
          }
          stats[category].count += 1;
          stats[category].value += Number(item.value || 0);
          stats[category].onHand += Number(item.onHand || 0);
          return stats;
        }, {});

        const categoryRows = Object.entries(categoryStats).map(([category, stats]) => [
          category,
          stats.count.toString(),
          stats.onHand.toString(),
          `$${stats.value.toFixed(2)}`
        ]);

        const categoryTableY = doc.y + 20;
        addTable(doc, ['Category', 'Parts Count', 'Total On Hand', 'Total Value'], categoryRows, {
          startY: categoryTableY,
          colWidths: [150, 100, 100, 195],
          headerColor: COLORS.secondary,
          rowHeight: 25
        });
      } else {
        doc.fillColor(COLORS.dark)
           .fontSize(12)
           .font('Helvetica')
           .text('No inventory items found.', 50, doc.y + 20);
      }

      // Add recommendations section
      doc.moveDown(1);
      doc.fillColor(COLORS.primary)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Inventory Recommendations:', 50, doc.y);

      let recommendations = '';
      if (lowStockItems > 0) {
        recommendations += `• ${lowStockItems} items are below minimum stock levels - consider reordering\n`;
      }
      if (outOfStockItems > 0) {
        recommendations += `• ${outOfStockItems} items are out of stock - urgent reorder required\n`;
      }
      if (overstockItems > 0) {
        recommendations += `• ${overstockItems} items are overstocked - consider reducing future orders\n`;
      }
      if (recommendations === '') {
        recommendations = '• All items are within acceptable stock levels\n';
      }
      recommendations += '• Review reorder levels based on usage patterns\n';
      recommendations += '• Consider implementing automated reorder alerts\n';
      recommendations += '• Regular inventory audits recommended';

      doc.fillColor(COLORS.dark)
         .fontSize(10)
         .font('Helvetica')
         .text(recommendations, 50, doc.y + 20, { width: 495 });

      // Footer
      addFooter(doc);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate PDF for supplier spend report
 */
export const generateSupplierSpendPDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: { 
          Title: 'Supplier Spend Report', 
          Author: COMPANY_INFO.name,
          Subject: 'Supplier Spending Analysis',
          Keywords: 'supplier, spend, analysis, automotive, procurement',
          CreationDate: new Date()
        } 
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add professional header
      addCompanyHeader(doc, 'SUPPLIER SPEND REPORT', `Generated on ${new Date().toLocaleDateString()}`);

      // Summary Statistics Section
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Spending Overview', 50, doc.y);

      // Calculate summary statistics
      const totalSuppliers = data.rows.length;
      const totalSpend = data.rows.reduce((sum, supplier) => sum + Number(supplier.totalAmount || 0), 0);
      const avgSpendPerSupplier = totalSuppliers > 0 ? totalSpend / totalSuppliers : 0;
      const totalOrders = data.rows.reduce((sum, supplier) => sum + Number(supplier.totalOrders || 0), 0);
      const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

      // Find top supplier
      const topSupplier = data.rows.reduce((top, supplier) => {
        return Number(supplier.totalAmount || 0) > Number(top.totalAmount || 0) ? supplier : top;
      }, data.rows[0] || {});

      const summaryRows = [
        ['Total Suppliers:', totalSuppliers.toString()],
        ['Total Orders:', totalOrders.toString()],
        ['Total Spend:', `$${totalSpend.toFixed(2)}`],
        ['Average Spend per Supplier:', `$${avgSpendPerSupplier.toFixed(2)}`],
        ['Average Order Value:', `$${avgOrderValue.toFixed(2)}`],
        ['Top Supplier:', topSupplier.companyName || 'N/A'],
        ['Top Supplier Spend:', `$${Number(topSupplier.totalAmount || 0).toFixed(2)}`]
      ];

      const summaryTableY = doc.y + 20;
      addTable(doc, ['Metric', 'Value'], summaryRows, {
        startY: summaryTableY,
        colWidths: [200, 345],
        headerColor: COLORS.secondary,
        rowHeight: 25
      });

      doc.moveDown(1);

      // Supplier Performance Analysis Section
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Supplier Performance Analysis', 50, doc.y);

      if (data.rows && data.rows.length > 0) {
        const headers = ['Supplier', 'Orders', 'Total Spend', 'Avg Order Value', 'Min Order', 'Max Order', 'First Order', 'Last Order'];
        const rows = [];

        data.rows.forEach((supplier) => {
          rows.push([
            supplier.companyName || 'N/A',
            String(supplier.totalOrders || 0),
            `$${Number(supplier.totalAmount || 0).toFixed(2)}`,
            `$${Number(supplier.avgOrderValue || 0).toFixed(2)}`,
            `$${Number(supplier.minOrderValue || 0).toFixed(2)}`,
            `$${Number(supplier.maxOrderValue || 0).toFixed(2)}`,
            supplier.firstOrderDate ? new Date(supplier.firstOrderDate).toLocaleDateString() : 'N/A',
            supplier.lastOrderDate ? new Date(supplier.lastOrderDate).toLocaleDateString() : 'N/A'
          ]);
        });

        const suppliersTableY = doc.y + 20;
        addTable(doc, headers, rows, {
          startY: suppliersTableY,
          colWidths: [120, 60, 80, 80, 70, 70, 80, 80],
          headerColor: COLORS.accent,
          rowHeight: 25,
          fontSize: 9
        });

        // Add spending distribution analysis
        doc.moveDown(1);
        doc.fillColor(COLORS.primary)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Spending Distribution:', 50, doc.y);

        // Calculate spending tiers
        const highSpenders = data.rows.filter(s => Number(s.totalAmount || 0) > avgSpendPerSupplier * 1.5).length;
        const mediumSpenders = data.rows.filter(s => {
          const amount = Number(s.totalAmount || 0);
          return amount <= avgSpendPerSupplier * 1.5 && amount >= avgSpendPerSupplier * 0.5;
        }).length;
        const lowSpenders = data.rows.filter(s => Number(s.totalAmount || 0) < avgSpendPerSupplier * 0.5).length;

        const distributionRows = [
          ['High Spenders (>150% avg)', highSpenders.toString()],
          ['Medium Spenders (50-150% avg)', mediumSpenders.toString()],
          ['Low Spenders (<50% avg)', lowSpenders.toString()]
        ];

        const distributionTableY = doc.y + 20;
        addTable(doc, ['Spending Tier', 'Count'], distributionRows, {
          startY: distributionTableY,
          colWidths: [200, 345],
          headerColor: COLORS.secondary,
          rowHeight: 25
        });

        // Add top suppliers section
        doc.moveDown(1);
        doc.fillColor(COLORS.primary)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Top 5 Suppliers by Spend:', 50, doc.y);

        const topSuppliers = data.rows
          .sort((a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0))
          .slice(0, 5);

        const topSuppliersRows = topSuppliers.map((supplier, index) => [
          `${index + 1}. ${supplier.companyName || 'N/A'}`,
          `$${Number(supplier.totalAmount || 0).toFixed(2)}`,
          String(supplier.totalOrders || 0)
        ]);

        const topSuppliersTableY = doc.y + 20;
        addTable(doc, ['Supplier', 'Total Spend', 'Orders'], topSuppliersRows, {
          startY: topSuppliersTableY,
          colWidths: [200, 120, 100],
          headerColor: COLORS.accent,
          rowHeight: 25
        });
      } else {
        doc.fillColor(COLORS.dark)
           .fontSize(12)
           .font('Helvetica')
           .text('No supplier data found.', 50, doc.y + 20);
      }

      // Add strategic recommendations
      doc.moveDown(1);
      doc.fillColor(COLORS.primary)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Strategic Recommendations:', 50, doc.y);

      const recommendations = `
Based on the supplier spending analysis, consider the following strategic actions:

Procurement Strategy:
• Consolidate purchases with top-performing suppliers to leverage volume discounts
• Review contracts with high-spend suppliers for potential renegotiation
• Identify opportunities for supplier diversification to reduce risk

Cost Optimization:
• Analyze spending patterns to identify seasonal trends
• Implement spend analytics to track cost savings opportunities
• Consider bulk purchasing for frequently ordered items

Supplier Relationship Management:
• Strengthen relationships with strategic suppliers (top 20% by spend)
• Develop performance metrics for supplier evaluation
• Implement regular supplier reviews and feedback sessions

Risk Management:
• Monitor supplier concentration risk (over-reliance on single suppliers)
• Develop contingency plans for critical suppliers
• Track supplier financial stability and performance trends
      `.trim();

      doc.fillColor(COLORS.dark)
         .fontSize(10)
         .font('Helvetica')
         .text(recommendations, 50, doc.y + 20, { width: 495 });

      // Add key performance indicators
      doc.moveDown(1);
      doc.fillColor(COLORS.primary)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Key Performance Indicators:', 50, doc.y);

      const kpiRows = [
        ['Supplier Concentration Risk', totalSuppliers > 0 ? `${((Number(topSupplier.totalAmount || 0) / totalSpend) * 100).toFixed(1)}%` : 'N/A'],
        ['Average Orders per Supplier', totalSuppliers > 0 ? (totalOrders / totalSuppliers).toFixed(1) : 'N/A'],
        ['Spending Efficiency Score', avgOrderValue > 0 ? 'Good' : 'Needs Review'],
        ['Supplier Diversity Index', totalSuppliers > 5 ? 'Good' : 'Low']
      ];

      const kpiTableY = doc.y + 20;
      addTable(doc, ['KPI', 'Value'], kpiRows, {
        startY: kpiTableY,
        colWidths: [200, 345],
        headerColor: COLORS.secondary,
        rowHeight: 25
      });

      // Footer
      addFooter(doc);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate PDF for supplier performance analytics
 */
export const generateSupplierPerformancePDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: { 
          Title: 'Supplier Performance Report', 
          Author: COMPANY_INFO.name,
          Subject: 'Supplier Delivery Performance',
          Keywords: 'supplier, performance, delivery, timeliness, analytics',
          CreationDate: new Date()
        } 
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      addCompanyHeader(doc, 'SUPPLIER PERFORMANCE REPORT', `Late threshold: ${data.lateThresholdDays} days`);

      // KPI summary
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Performance Overview', 50, doc.y);

      const totalSuppliers = data.rows.length;
      const avgDelivery = totalSuppliers > 0 ? (data.rows.reduce((sum, r) => sum + Number(r.avgDeliveryDays || 0), 0) / totalSuppliers) : 0;
      const avgLatePct = totalSuppliers > 0 ? (data.rows.reduce((sum, r) => sum + Number(r.deliveredLatePct || 0), 0) / totalSuppliers) : 0;

      const kpiRows = [
        ['Suppliers Evaluated:', String(totalSuppliers)],
        ['Average Delivery Time (days):', avgDelivery.toFixed(2)],
        ['Average Late Delivery %:', `${avgLatePct.toFixed(1)}%`]
      ];

      const kpiTableY = doc.y + 20;
      addTable(doc, ['KPI', 'Value'], kpiRows, {
        startY: kpiTableY,
        colWidths: [220, 325],
        headerColor: COLORS.secondary,
        rowHeight: 25
      });

      doc.moveDown(1);

      // Detailed table
      doc.fillColor(COLORS.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Supplier Performance Details', 50, doc.y);

      const headers = ['Supplier', 'Total POs', 'Avg Delivery (d)', '% Late (> threshold)', 'Total Spend'];
      const rows = (data.rows || []).map(r => [
        r.companyName || 'N/A',
        String(r.totalPOs || 0),
        Number(r.avgDeliveryDays || 0).toFixed(2),
        `${Number(r.deliveredLatePct || 0).toFixed(1)}%`,
        `$${Number(r.totalAmount || 0).toFixed(2)}`
      ]);

      const tableY = doc.y + 20;
      addTable(doc, headers, rows, {
        startY: tableY,
        colWidths: [160, 70, 90, 120, 105],
        headerColor: COLORS.accent,
        rowHeight: 22,
        fontSize: 9
      });

      addFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};