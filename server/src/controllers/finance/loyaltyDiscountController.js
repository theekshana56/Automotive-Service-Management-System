import LoyaltyDiscountRequest from '../../models/finance/LoyaltyDiscountRequest.js';
import User from '../../models/User.js';
import Booking from '../../models/Booking.js';
import Notification from '../../models/inventory/Notification.js';

// @desc    Create loyalty discount request
// @route   POST /api/finance/loyalty-discount-requests
// @access  Private (User)
export const createLoyaltyDiscountRequest = async (req, res) => {
  try {
    const { requestReason } = req.body;
    const customerId = req.user.id;

    // Get customer details
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    // Count total bookings for this customer
    const totalBookings = await Booking.countDocuments({ user: customerId });

    // Check if customer already has a pending request
    const existingRequest = await LoyaltyDiscountRequest.findOne({
      customerId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending loyalty discount request.' 
      });
    }

    // Check if customer already has an approved request
    const approvedRequest = await LoyaltyDiscountRequest.findOne({
      customerId,
      status: 'approved',
      appliedToPayment: false
    });

    if (approvedRequest) {
      return res.status(400).json({ 
        message: 'You already have an approved loyalty discount that has not been used yet.' 
      });
    }

    // Create loyalty discount request
    const loyaltyRequest = await LoyaltyDiscountRequest.create({
      customerId,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      totalBookings,
      loyaltyEligible: totalBookings >= 5,
      discountPercentage: 10,
      requestReason: requestReason || 'Loyalty discount request',
      status: 'pending'
    });

    // Send notification to finance managers
    const meta = new Map(Object.entries({
      loyaltyRequestId: loyaltyRequest._id.toString(),
      customerId: customerId,
      customerName: customer.name,
      totalBookings: totalBookings,
      discountPercentage: 10
    }));

    const base = {
      title: 'New Loyalty Discount Request',
      message: `${customer.name} has requested a 10% loyalty discount. Total bookings: ${totalBookings}.`,
      link: `/finance/loyalty-discount-requests/${loyaltyRequest._id}`,
      meta,
    };

    // Send notification to all finance managers
    await Notification.create({ ...base, userId: null, type: 'SYSTEM' });
    await Notification.create({ ...base, userId: null, type: 'PO_EVENT' });

    res.status(201).json({
      success: true,
      data: loyaltyRequest,
      message: 'Loyalty discount request submitted successfully. Finance manager will review your request.'
    });

  } catch (err) {
    console.error('Error creating loyalty discount request:', err);
    res.status(500).json({ message: err.message || 'Failed to create loyalty discount request.' });
  }
};

// @desc    Get all loyalty discount requests
// @route   GET /api/finance/loyalty-discount-requests
// @access  Private (Finance Manager, Admin)
export const getLoyaltyDiscountRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const requests = await LoyaltyDiscountRequest.find(query)
      .populate('customerId', 'name email phone')
      .populate('reviewedBy', 'name')
      .populate('serviceCostId', 'vehiclePlate serviceType finalCost')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LoyaltyDiscountRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (err) {
    console.error('Error fetching loyalty discount requests:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch loyalty discount requests.' });
  }
};

// @desc    Get single loyalty discount request
// @route   GET /api/finance/loyalty-discount-requests/:id
// @access  Private (Finance Manager, Admin, Customer)
export const getLoyaltyDiscountRequest = async (req, res) => {
  try {
    const request = await LoyaltyDiscountRequest.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('reviewedBy', 'name')
      .populate('serviceCostId', 'vehiclePlate serviceType finalCost')
      .populate('paymentId', 'paymentDetails');

    if (!request) {
      return res.status(404).json({ message: 'Loyalty discount request not found.' });
    }

    // Check if user has access to this request
    if (request.customerId._id.toString() !== req.user.id && 
        !['admin', 'finance_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have access to this request.' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (err) {
    console.error('Error fetching loyalty discount request:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch loyalty discount request.' });
  }
};

// @desc    Review loyalty discount request (approve/decline)
// @route   PUT /api/finance/loyalty-discount-requests/:id/review
// @access  Private (Finance Manager, Admin)
export const reviewLoyaltyDiscountRequest = async (req, res) => {
  try {
    const { status, reviewNotes, declineReason } = req.body;
    const requestId = req.params.id;

    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or declined.' });
    }

    const request = await LoyaltyDiscountRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Loyalty discount request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been reviewed.' });
    }

    // Update request
    request.status = status;
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes || '';
    
    if (status === 'declined') {
      request.declineReason = declineReason || 'No reason provided';
    }

    await request.save();

    // Send notification to customer
    const customerNotification = {
      title: `Loyalty Discount Request ${status === 'approved' ? 'Approved' : 'Declined'}`,
      message: status === 'approved' 
        ? `Your loyalty discount request has been approved! You will receive a 10% discount on your next service payment.`
        : `Your loyalty discount request has been declined. Reason: ${request.declineReason}`,
      link: '/profile',
      userId: request.customerId,
      type: 'USER',
      meta: new Map(Object.entries({
        loyaltyRequestId: request._id.toString(),
        status: status,
        discountPercentage: request.discountPercentage
      }))
    };

    await Notification.create(customerNotification);

    res.status(200).json({
      success: true,
      data: request,
      message: `Loyalty discount request ${status} successfully.`
    });

  } catch (err) {
    console.error('Error reviewing loyalty discount request:', err);
    res.status(500).json({ message: err.message || 'Failed to review loyalty discount request.' });
  }
};

// @desc    Get customer's loyalty discount requests
// @route   GET /api/finance/loyalty-discount-requests/customer/:customerId
// @access  Private (Customer, Finance Manager, Admin)
export const getCustomerLoyaltyRequests = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Check if user has access to this customer's requests
    if (customerId !== req.user.id && !['admin', 'finance_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have access to this customer\'s requests.' });
    }

    const requests = await LoyaltyDiscountRequest.find({ customerId })
      .populate('reviewedBy', 'name')
      .populate('serviceCostId', 'vehiclePlate serviceType')
      .populate('paymentId', 'paymentDetails')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error('Error fetching customer loyalty requests:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch customer loyalty requests.' });
  }
};

// @desc    Get loyalty discount summary
// @route   GET /api/finance/loyalty-discount-requests/summary
// @access  Private (Finance Manager, Admin)
export const getLoyaltyDiscountSummary = async (req, res) => {
  try {
    console.log('🔍 Getting loyalty discount summary...');
    console.log('🔍 Request user:', req.user);
    console.log('🔍 Request query:', req.query);
    
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    console.log('📅 Date range:', { start, end });

    // Check if model is available
    if (!LoyaltyDiscountRequest) {
      console.error('❌ LoyaltyDiscountRequest model is not defined');
      return res.status(500).json({ 
        message: 'Database model not available',
        error: 'LoyaltyDiscountRequest model is not defined'
      });
    }

    // Check if collection exists
    let collectionExists = false;
    try {
      collectionExists = await LoyaltyDiscountRequest.collection.exists();
      console.log('📊 Collection exists:', collectionExists);
    } catch (collectionError) {
      console.error('❌ Error checking collection existence:', collectionError);
      // Continue with the request even if collection check fails
    }

    if (!collectionExists) {
      console.log('⚠️ Collection does not exist, returning empty summary');
      return res.status(200).json({
        success: true,
        data: {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          declinedRequests: 0,
          summary: {},
          period: {
            startDate: start,
            endDate: end
          }
        }
      });
    }

    let summary = [];
    try {
      summary = await LoyaltyDiscountRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalDiscount: { $sum: '$discountPercentage' }
          }
        }
      ]);
      console.log('📈 Aggregation result:', summary);
    } catch (aggError) {
      console.error('❌ Aggregation failed:', aggError);
      // Fallback: get all documents and group manually
      const allRequests = await LoyaltyDiscountRequest.find({
        createdAt: { $gte: start, $lte: end }
      }).select('status discountPercentage');
      
      const statusGroups = {};
      allRequests.forEach(req => {
        if (!statusGroups[req.status]) {
          statusGroups[req.status] = { count: 0, totalDiscount: 0 };
        }
        statusGroups[req.status].count++;
        statusGroups[req.status].totalDiscount += req.discountPercentage;
      });
      
      summary = Object.entries(statusGroups).map(([status, data]) => ({
        _id: status,
        count: data.count,
        totalDiscount: data.totalDiscount
      }));
      console.log('📈 Fallback summary result:', summary);
    }

    let totalRequests = 0;
    let pendingRequests = 0;
    let approvedRequests = 0;
    let declinedRequests = 0;

    try {
      totalRequests = await LoyaltyDiscountRequest.countDocuments({
        createdAt: { $gte: start, $lte: end }
      });

      pendingRequests = await LoyaltyDiscountRequest.countDocuments({
        status: 'pending',
        createdAt: { $gte: start, $lte: end }
      });

      approvedRequests = await LoyaltyDiscountRequest.countDocuments({
        status: 'approved',
        createdAt: { $gte: start, $lte: end }
      });

      declinedRequests = await LoyaltyDiscountRequest.countDocuments({
        status: 'declined',
        createdAt: { $gte: start, $lte: end }
      });
    } catch (countError) {
      console.error('❌ Count queries failed:', countError);
      // Use fallback counts from summary data
      totalRequests = summary.reduce((sum, item) => sum + item.count, 0);
      pendingRequests = summary.find(item => item._id === 'pending')?.count || 0;
      approvedRequests = summary.find(item => item._id === 'approved')?.count || 0;
      declinedRequests = summary.find(item => item._id === 'declined')?.count || 0;
    }

    console.log('📊 Counts:', { totalRequests, pendingRequests, approvedRequests, declinedRequests });

    const result = {
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        declinedRequests,
        summary: summary.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        period: {
          startDate: start,
          endDate: end
        }
      }
    };

    console.log('✅ Summary result:', result);
    res.status(200).json(result);
  } catch (err) {
    console.error('❌ Error getting loyalty discount summary:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ 
      message: err.message || 'Failed to get loyalty discount summary.',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};