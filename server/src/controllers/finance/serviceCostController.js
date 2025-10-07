import ServiceCost from '../../models/finance/ServiceCost.js';
import User from '../../models/User.js';

// @desc    Get all service costs
// @route   GET /api/finance/service-costs
// @access  Private (Finance Manager, Admin)
export const getServiceCosts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    const serviceCosts = await ServiceCost.find(query)
      .populate('customerId', 'name email phone')
      .populate('advisorId', 'name email')
      .populate('bookingId', 'serviceType vehicle date')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ServiceCost.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: serviceCosts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single service cost
// @route   GET /api/finance/service-costs/:id
// @access  Private (Finance Manager, Admin)
export const getServiceCost = async (req, res) => {
  try {
    const serviceCost = await ServiceCost.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('advisorId', 'name email')
      .populate('bookingId', 'serviceType vehicle date');
    
    if (!serviceCost) {
      return res.status(404).json({
        success: false,
        message: 'Service cost not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: serviceCost
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Review service cost
// @route   PUT /api/finance/service-costs/:id/review
// @access  Private (Finance Manager, Admin)
export const reviewServiceCost = async (req, res) => {
  try {
    const { approved, adjustments = [], notes = '', taxRate = 12, discountAmount = 0 } = req.body;
    
    const serviceCost = await ServiceCost.findById(req.params.id);
    
    if (!serviceCost) {
      return res.status(404).json({
        success: false,
        message: 'Service cost not found'
      });
    }
    
    // Update finance manager review
    serviceCost.financeManagerReview = {
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      approved,
      adjustments,
      finalApproval: approved,
      approvedAt: approved ? new Date() : null,
      notes
    };
    
    // Update final cost with tax and discount
    serviceCost.finalCost.taxRate = taxRate;
    serviceCost.finalCost.discountAmount = discountAmount;
    serviceCost.finalCost.taxAmount = (serviceCost.finalCost.subtotal * taxRate) / 100;
    serviceCost.finalCost.totalAmount = serviceCost.finalCost.subtotal + 
                                       serviceCost.finalCost.taxAmount - 
                                       serviceCost.finalCost.discountAmount;
    
    // Update status
    serviceCost.status = approved ? 'approved' : 'rejected';
    
    await serviceCost.save();
    
    res.status(200).json({
      success: true,
      data: serviceCost,
      message: `Service cost ${approved ? 'approved' : 'rejected'} successfully`
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Generate invoice
// @route   POST /api/finance/service-costs/:id/generate-invoice
// @access  Private (Finance Manager, Admin)
export const generateInvoice = async (req, res) => {
  try {
    const serviceCost = await ServiceCost.findById(req.params.id);
    
    if (!serviceCost) {
      return res.status(404).json({
        success: false,
        message: 'Service cost not found'
      });
    }
    
    if (serviceCost.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Service cost must be approved before generating invoice'
      });
    }
    
    // Update status to invoiced
    serviceCost.status = 'invoiced';
    serviceCost.invoiceGenerated = true;
    serviceCost.invoiceId = `INV-${Date.now()}`;
    
    await serviceCost.save();
    
    res.status(200).json({
      success: true,
      data: serviceCost,
      message: 'Invoice generated successfully'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get service cost summary
// @route   GET /api/finance/service-costs/summary
// @access  Private (Finance Manager, Admin)
export const getServiceCostSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    const summary = await ServiceCost.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          totalRevenue: { $sum: '$finalCost.totalAmount' },
          approvedServices: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          invoicedServices: {
            $sum: { $cond: [{ $eq: ['$status', 'invoiced'] }, 1, 0] }
          },
          paidServices: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const result = summary[0] || {
      totalServices: 0,
      totalRevenue: 0,
      approvedServices: 0,
      invoicedServices: 0,
      paidServices: 0
    };
    
    res.status(200).json({
      success: true,
      data: {
        totals: result
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update service cost
// @route   PUT /api/finance/service-costs/:id
// @access  Private (Finance Manager, Admin)
export const updateServiceCost = async (req, res) => {
  try {
    const serviceCost = await ServiceCost.findById(req.params.id);
    
    if (!serviceCost) {
      return res.status(404).json({
        success: false,
        message: 'Service cost not found'
      });
    }
    
    if (serviceCost.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update paid service cost'
      });
    }
    
    const updatedServiceCost = await ServiceCost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedServiceCost
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete service cost
// @route   DELETE /api/finance/service-costs/:id
// @access  Private (Finance Manager, Admin)
export const deleteServiceCost = async (req, res) => {
  try {
    const serviceCost = await ServiceCost.findById(req.params.id);
    
    if (!serviceCost) {
      return res.status(404).json({
        success: false,
        message: 'Service cost not found'
      });
    }
    
    if (serviceCost.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid service cost'
      });
    }
    
    await ServiceCost.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Service cost deleted successfully'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};