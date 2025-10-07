import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate PDF for Job History Report
 */
export const generateJobHistoryPDF = async (bookings, stats, filters) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: 'Job History Report',
          Author: 'AE Auto Elite - Automotive Service Management System',
          Subject: 'Job History Report',
          Keywords: 'job history, automotive, service, advisor',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('JOB HISTORY REPORT', { align: 'center' })
         .moveDown(0.5);

      // Company Info
      doc.fontSize(12)
         .font('Helvetica')
         .text('AE Auto Elite', { align: 'center' })
         .text('Automotive Service Management System', { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(1);

      // Performance Summary
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Performance Summary')
         .moveDown(0.5);

      const summaryData = [
        ['Total Jobs:', stats.totalJobs || 0],
        ['Completed Jobs:', stats.completedJobs || 0],
        ['Total Revenue:', `$${(stats.totalRevenue || 0).toLocaleString()}`],
        ['Average Rating:', `${stats.averageRating || 0}/5`]
      ];

      summaryData.forEach(([label, value]) => {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text(label, { continued: true })
           .font('Helvetica')
           .text(` ${value}`)
           .moveDown(0.3);
      });

      doc.moveDown(1);

      // Filter Information
      if (filters) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Filter Information')
           .moveDown(0.3);

        const filterData = [];
        if (filters.dateFrom) filterData.push(['From Date:', new Date(filters.dateFrom).toLocaleDateString()]);
        if (filters.dateTo) filterData.push(['To Date:', new Date(filters.dateTo).toLocaleDateString()]);
        if (filters.status && filters.status !== 'all') filterData.push(['Status:', filters.status.replace('_', ' ').toUpperCase()]);
        if (filters.serviceType && filters.serviceType !== 'all') filterData.push(['Service Type:', filters.serviceType]);

        if (filterData.length > 0) {
          filterData.forEach(([label, value]) => {
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .text(label, { continued: true })
               .font('Helvetica')
               .text(` ${value}`)
               .moveDown(0.2);
          });
        } else {
          doc.fontSize(10)
             .font('Helvetica')
             .text('No filters applied - showing all records')
             .moveDown(0.2);
        }

        doc.moveDown(0.5);
      }

      // Job History Table
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Job History Details')
         .moveDown(0.5);

      if (bookings && bookings.length > 0) {
        // Table headers
        const tableTop = doc.y;
        const dateX = 50;
        const serviceX = 120;
        const customerX = 200;
        const vehicleX = 300;
        const statusX = 400;
        const notesX = 480;

        // Headers
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('Date & Time', dateX, tableTop)
           .text('Service', serviceX, tableTop)
           .text('Customer', customerX, tableTop)
           .text('Vehicle', vehicleX, tableTop)
           .text('Status', statusX, tableTop)
           .text('Notes', notesX, tableTop);

        // Separator line
        doc.moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();

        let currentY = tableTop + 25;

        // Job history rows
        bookings.forEach((booking) => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          const dateTime = booking.date ? 
            `${new Date(booking.date).toLocaleDateString()}\n${booking.timeSlot || 'N/A'}` : 
            'N/A';

          doc.fontSize(9)
             .font('Helvetica')
             .text(dateTime, dateX, currentY, { width: 60, ellipsis: true })
             .text(booking.serviceType || 'N/A', serviceX, currentY, { width: 70, ellipsis: true })
             .text(booking.customer?.name || 'N/A', customerX, currentY, { width: 90, ellipsis: true })
             .text(`${booking.vehicle?.model || 'N/A'}\n${booking.vehicle?.year || ''} • ${booking.vehicle?.plate || ''}`, vehicleX, currentY, { width: 90, ellipsis: true })
             .text(booking.status?.replace('_', ' ') || 'N/A', statusX, currentY, { width: 70, ellipsis: true })
             .text(booking.notes || 'No notes', notesX, currentY, { width: 60, ellipsis: true });

          currentY += 30;
        });
      } else {
        doc.fontSize(12)
           .font('Helvetica')
           .text('No job history records found for the selected period.')
           .moveDown(1);
      }

      // Footer
      doc.moveDown(1);
      doc.fontSize(9)
         .font('Helvetica')
         .text('Generated by AE Auto Elite - Automotive Service Management System', { align: 'center' })
         .moveDown(0.2)
         .text('Computer-generated document. No signature required.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for Cost Estimation Report
 */
export const generateCostEstimationPDF = async (estimateData, jobInfo) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: 'Cost Estimation Report',
          Author: 'AE Auto Elite - Automotive Service Management System',
          Subject: 'Cost Estimation Report',
          Keywords: 'cost estimation, automotive, service, parts',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('COST ESTIMATION REPORT', { align: 'center' })
         .moveDown(0.5);

      // Company Info
      doc.fontSize(12)
         .font('Helvetica')
         .text('AE Auto Elite', { align: 'center' })
         .text('Automotive Service Management System', { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(1);

      // Job Information
      if (jobInfo) {
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Job Information')
           .moveDown(0.5);

        const jobData = [
          ['Job ID:', jobInfo.jobId || 'N/A'],
          ['Customer:', jobInfo.customer || 'N/A'],
          ['Vehicle:', jobInfo.vehicle || 'N/A'],
          ['Service Type:', jobInfo.serviceType || 'N/A'],
          ['Date:', jobInfo.date ? new Date(jobInfo.date).toLocaleDateString() : 'N/A']
        ];

        jobData.forEach(([label, value]) => {
          doc.fontSize(11)
             .font('Helvetica-Bold')
             .text(label, { continued: true })
             .font('Helvetica')
             .text(` ${value}`)
             .moveDown(0.3);
        });

        doc.moveDown(1);
      }

      // Parts List
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Parts & Services')
         .moveDown(0.5);

      if (estimateData && estimateData.items && estimateData.items.length > 0) {
        // Table headers
        const tableTop = doc.y;
        const partX = 50;
        const unitPriceX = 300;
        const qtyX = 400;
        const totalX = 480;

        // Headers
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('Part/Service', partX, tableTop)
           .text('Unit Price', unitPriceX, tableTop)
           .text('Qty', qtyX, tableTop)
           .text('Total', totalX, tableTop);

        // Separator line
        doc.moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();

        let currentY = tableTop + 25;

        // Parts rows
        estimateData.items.forEach((item) => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          const partName = `${item.code || 'N/A'} - ${item.name || 'N/A'}`;

          doc.fontSize(9)
             .font('Helvetica')
             .text(partName, partX, currentY, { width: 240, ellipsis: true })
             .text(`$${(item.unitPrice || 0).toFixed(2)}`, unitPriceX, currentY)
             .text((item.quantity || 0).toString(), qtyX, currentY)
             .text(`$${(item.total || 0).toFixed(2)}`, totalX, currentY);

          currentY += 20;
        });

        // Total line
        doc.moveTo(50, currentY)
           .lineTo(550, currentY)
           .stroke();

        currentY += 10;

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('TOTAL COST:', 300, currentY)
           .text(`$${(estimateData.total || 0).toFixed(2)}`, 480, currentY);
      } else {
        doc.fontSize(12)
           .font('Helvetica')
           .text('No parts or services added to this estimate.')
           .moveDown(1);
      }

      // Additional Information
      if (estimateData.notes) {
        doc.addPage();
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Additional Notes')
           .moveDown(0.5);

        doc.fontSize(10)
           .font('Helvetica')
           .text(estimateData.notes, { width: 500 });
      }

      // Footer
      doc.moveDown(1);
      doc.fontSize(9)
         .font('Helvetica')
         .text('Generated by AE Auto Elite - Automotive Service Management System', { align: 'center' })
         .moveDown(0.2)
         .text('Computer-generated document. No signature required.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
