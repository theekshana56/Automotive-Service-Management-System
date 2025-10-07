import ServiceCost from '../../models/finance/ServiceCost.js';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import Notification from '../../models/inventory/Notification.js';

// @desc    Create service cost from advisor estimate
// @route   POST /api/advisor/estimate/send
// @access  Private (Advisor)
export const createServiceCostFromEstimate = async (req, res) => {
  try {
    const {
      bookingId,
      vehiclePlate,
      serviceType,
      items = [],
      total = 0,
      laborHours = 0,
      laborRate = 50 // Default labor rate
    } = req.body;

    if (!bookingId || !vehiclePlate || !serviceType || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: bookingId, vehiclePlate, serviceType, and items'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Calculate parts cost from items
    const partsRequired = items.map(item => ({
      partId: item.id,
      partName: item.name,
      partNumber: item.code,
      quantity: Number(item.quantity) || 0,
      unitCost: Number(item.unitPrice) || 0,
      totalCost: Number(item.total) || 0
    }));

    const partsCost = partsRequired.reduce((sum, part) => sum + part.totalCost, 0);
    const laborCost = Number(laborHours) * Number(laborRate);
    const advisorTotal = partsCost + laborCost;

    // Create service cost record
    const serviceCostData = {
      bookingId,
      advisorId: req.user.id,
      customerId: booking.user,
      vehiclePlate,
      serviceType,
      advisorEstimate: {
        laborHours: Number(laborHours),
        laborRate: Number(laborRate),
        partsRequired,
        additionalServices: [],
        notes: `Advisor estimate for ${serviceType}`,
        estimatedTotal: advisorTotal
      },
      finalCost: {
        laborCost,
        partsCost,
        additionalServicesCost: 0,
        subtotal: advisorTotal,
        taxRate: 12, // 12% tax
        taxAmount: advisorTotal * 0.12,
        discountAmount: 0,
        totalAmount: advisorTotal * 1.12 // Include tax
      },
      status: 'pending_review'
    };

    const serviceCost = await ServiceCost.create(serviceCostData);

    // Create notifications for managers
    const notificationData = {
      title: 'New Service Cost Estimate',
      message: `Advisor ${req.user.name} has submitted a cost estimate for ${serviceType} - Vehicle: ${vehiclePlate}. Total: $${advisorTotal.toFixed(2)}`,
      link: '/finance/service-costs',
      type: 'SYSTEM',
      userId: null,
      meta: new Map(Object.entries({
        serviceCostId: serviceCost._id,
        advisorId: req.user.id,
        vehiclePlate,
        serviceType,
        estimatedTotal: advisorTotal
      }))
    };

    // Notify finance managers
    await Notification.create(notificationData);

    // Also notify staff members
    await Notification.create({
      ...notificationData,
      link: '/staff-dashboard'
    });

    res.status(201).json({
      success: true,
      data: serviceCost,
      message: 'Estimate sent to Staff Member and Finance Manager with 60% profit margin calculation.'
    });
  } catch (err) {
    console.error('Service cost creation error:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get service costs for advisor
// @route   GET /api/advisor/service-costs
// @access  Private (Advisor)
export const getAdvisorServiceCosts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { advisorId: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    const serviceCosts = await ServiceCost.find(query)
      .populate('customerId', 'name email phone')
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
// @route   GET /api/advisor/service-costs/:id
// @access  Private (Advisor)
export const getServiceCost = async (req, res) => {
  try {
    const serviceCost = await ServiceCost.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('bookingId', 'serviceType vehicle date')
      .populate('advisorId', 'name email');
    
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
