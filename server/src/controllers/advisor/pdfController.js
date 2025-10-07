import {
  generateJobHistoryPDF,
  generateCostEstimationPDF
} from '../../services/advisor/pdfService.js';
import Booking from '../../models/Booking.js';

// Generate Job History Report PDF
export const generateJobHistoryPDFController = async (req, res) => {
  try {
    const { dateFrom, dateTo, status, serviceType } = req.query;
    
    // Build query
    let query = {};
    
    if (dateFrom && dateTo) {
      query.date = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (serviceType && serviceType !== 'all') {
      query.serviceType = serviceType;
    }

    // Get bookings with populated customer and vehicle information
    const bookings = await Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('vehicle', 'model year plate')
      .sort({ date: -1, timeSlot: -1 });

    // Calculate stats
    const stats = {
      totalJobs: bookings.length,
      completedJobs: bookings.filter(b => b.status === 'completed').length,
      totalRevenue: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      averageRating: bookings.length > 0 ? 
        bookings.reduce((sum, b) => sum + (b.rating || 0), 0) / bookings.length : 0
    };

    const filters = {
      dateFrom,
      dateTo,
      status,
      serviceType
    };

    // Generate PDF
    const pdfBuffer = await generateJobHistoryPDF(bookings, stats, filters);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="job-history-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating job history PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate job history report PDF',
      error: error.message 
    });
  }
};

// Generate Cost Estimation Report PDF
export const generateCostEstimationPDFController = async (req, res) => {
  try {
    const { items, jobInfo, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided for cost estimation'
      });
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.total || 0), 0);

    const estimateData = {
      items,
      total,
      notes
    };

    // Generate PDF
    const pdfBuffer = await generateCostEstimationPDF(estimateData, jobInfo);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cost-estimation-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating cost estimation PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate cost estimation report PDF',
      error: error.message 
    });
  }
};
