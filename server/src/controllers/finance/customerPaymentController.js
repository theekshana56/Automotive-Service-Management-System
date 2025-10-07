import ServiceCost from '../../models/finance/ServiceCost.js';
import CustomerPayment from '../../models/finance/CustomerPayment.js';
import LoyaltyDiscountRequest from '../../models/finance/LoyaltyDiscountRequest.js';
import { calculateCustomerPaymentWithMargin, getCustomerPaymentsSummary, processCustomerPayment } from '../../services/finance/customerPaymentCalculationService.js';

// @desc    Calculate customer payment with 80% margin
// @route   POST /api/finance/customer-payments/calculate
// @access  Private (Finance Manager, Admin)
export const calculateCustomerPayment = async (req, res) => {
  try {
    const { serviceCostId } = req.body;

    if (!serviceCostId) {
      return res.status(400).json({ message: 'Service cost ID is required.' });
    }

    const serviceCost = await ServiceCost.findById(serviceCostId)
      .populate('customerId', 'name email')
      .populate('advisorId', 'name');

    if (!serviceCost) {
      return res.status(404).json({ message: 'Service cost not found.' });
    }

    // Check for approved loyalty discount for this customer
    const loyaltyDiscount = await LoyaltyDiscountRequest.findOne({
      customerId: serviceCost.customerId._id,
      status: 'approved',
      appliedToPayment: false
    });

    const loyaltyDiscountPercentage = loyaltyDiscount ? loyaltyDiscount.discountPercentage : 0;
    const calculation = calculateCustomerPaymentWithMargin(
      serviceCost.finalCost?.totalAmount || 0, 
      loyaltyDiscountPercentage
    );

    res.status(200).json({ 
      success: true, 
      data: {
        serviceCost: {
          id: serviceCost._id,
          vehiclePlate: serviceCost.vehiclePlate,
          serviceType: serviceCost.serviceType,
          customerName: serviceCost.customerId?.name,
          customerEmail: serviceCost.customerId?.email,
          advisorName: serviceCost.advisorId?.name,
          totalAmount: serviceCost.finalCost?.totalAmount || 0
        },
        loyaltyDiscount: loyaltyDiscount ? {
          id: loyaltyDiscount._id,
          percentage: loyaltyDiscount.discountPercentage,
          approvedAt: loyaltyDiscount.reviewedAt
        } : null,
        calculation
      }
    });
  } catch (err) {
    console.error('Error calculating customer payment:', err);
    res.status(500).json({ message: err.message || 'Failed to calculate customer payment.' });
  }
};

// @desc    Get all service costs with customer payment calculations
// @route   GET /api/finance/customer-payments/service-costs
// @access  Private (Finance Manager, Admin)
export const getServiceCostsWithPayments = async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    // Build query based on status filter
    let query = { 
      paymentReceived: { $ne: true } // Exclude already paid
    };
    
    if (status !== 'all') {
      query.status = status;
    } else {
      // For 'all', include service costs that are ready for payment processing
      query.status = { $in: ['pending_review', 'under_review', 'approved', 'invoiced'] };
    }

    const serviceCosts = await ServiceCost.find(query)
      .populate('customerId', 'name email phone')
      .populate('advisorId', 'name')
      .populate('bookingId', 'serviceType vehicle date timeSlot')
      .sort('-createdAt');

    const serviceCostsWithPayments = await Promise.all(serviceCosts.map(async (sc) => {
      // Check for approved loyalty discount for this customer
      let loyaltyDiscount = null;
      if (sc.customerId && sc.customerId._id) {
        loyaltyDiscount = await LoyaltyDiscountRequest.findOne({
          customerId: sc.customerId._id,
          status: 'approved',
          appliedToPayment: false
        });
      }

      const loyaltyDiscountPercentage = loyaltyDiscount ? loyaltyDiscount.discountPercentage : 0;
      const calculation = calculateCustomerPaymentWithMargin(
        sc.finalCost?.totalAmount || 0, 
        loyaltyDiscountPercentage
      );

      return {
        ...sc.toObject(),
        customerPaymentCalculation: calculation,
        loyaltyDiscount: loyaltyDiscount ? {
          id: loyaltyDiscount._id,
          percentage: loyaltyDiscount.discountPercentage,
          approvedAt: loyaltyDiscount.reviewedAt
        } : null,
      };
    }));

    const summary = getCustomerPaymentsSummary(serviceCosts);

    res.status(200).json({ 
      success: true, 
      data: {
        serviceCosts: serviceCostsWithPayments,
        summary
      }
    });
  } catch (err) {
    console.error('Error fetching service costs with payments:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch service costs with payments.' });
  }
};

// @desc    Process customer payment
// @route   POST /api/finance/customer-payments/process
// @access  Private (Finance Manager, Admin)
export const processCustomerPaymentRequest = async (req, res) => {
  try {
    const {
      serviceCostId,
      paymentMethod,
      paymentReference,
      transactionId,
      loyaltyDiscount = 0,
      otherDiscount = 0,
      notes = ''
    } = req.body;

    if (!serviceCostId || !paymentMethod) {
      return res.status(400).json({ message: 'Service cost ID and payment method are required.' });
    }

    const serviceCost = await ServiceCost.findById(serviceCostId)
      .populate('customerId', 'name email')
      .populate('advisorId', 'name');

    if (!serviceCost) {
      return res.status(404).json({ message: 'Service cost not found.' });
    }

    if (serviceCost.paymentReceived) {
      return res.status(400).json({ message: 'Payment for this service cost has already been received.' });
    }

    // Check for approved loyalty discount for this customer
    const loyaltyDiscountRequest = await LoyaltyDiscountRequest.findOne({
      customerId: serviceCost.customerId._id,
      status: 'approved',
      appliedToPayment: false
    });

    const loyaltyDiscountPercentage = loyaltyDiscountRequest ? loyaltyDiscountRequest.discountPercentage : 0;
    const calculation = calculateCustomerPaymentWithMargin(
      serviceCost.finalCost?.totalAmount || 0, 
      loyaltyDiscountPercentage
    );

    // Process the payment calculation
    const paymentData = processCustomerPayment(
      serviceCost,
      {
        method: paymentMethod,
        reference: paymentReference,
        transactionId: transactionId
      },
      {
        loyaltyDiscount: calculation.loyaltyDiscountAmount || 0,
        otherDiscount: Number(otherDiscount) || 0,
        notes: notes
      }
    );

    // Create customer payment record
    const customerPayment = await CustomerPayment.create({
      customerId: paymentData.customerId,
      customerName: paymentData.customerName,
      customerEmail: paymentData.customerEmail,
      serviceCostId: paymentData.serviceCostId,
      vehiclePlate: paymentData.vehiclePlate,
      serviceType: paymentData.serviceType,
      paymentCalculation: paymentData.paymentCalculation,
      paymentDetails: {
        ...paymentData.paymentDetails,
        paymentDate: new Date(),
        processedBy: req.user.id
      },
      paymentStatus: 'completed',
      receiptNumber: `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      notes: paymentData.notes,
    });

    // Update service cost status
    serviceCost.paymentReceived = true;
    serviceCost.paymentId = customerPayment._id;
    serviceCost.status = 'paid';
    await serviceCost.save();

    // Mark loyalty discount as applied if it was used
    if (loyaltyDiscountRequest) {
      loyaltyDiscountRequest.appliedToPayment = true;
      loyaltyDiscountRequest.paymentId = customerPayment._id;
      loyaltyDiscountRequest.serviceCostId = serviceCost._id;
      await loyaltyDiscountRequest.save();
    }

    res.status(201).json({ 
      success: true, 
      data: customerPayment,
      message: 'Customer payment processed successfully.'
    });
  } catch (err) {
    console.error('Error processing customer payment:', err);
    res.status(500).json({ message: err.message || 'Failed to process customer payment.' });
  }
};

// @desc    Get customer payment summary
// @route   GET /api/finance/customer-payments/summary
// @access  Private (Finance Manager, Admin)
export const getCustomerPaymentSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const serviceCosts = await ServiceCost.find({
      createdAt: { $gte: start, $lte: end },
      status: 'paid'
    });

    const summary = getCustomerPaymentsSummary(serviceCosts);

    // Get additional statistics
    // Use root-level paymentDate field for filtering
    const totalPayments = await CustomerPayment.countDocuments({
      paymentDate: { $gte: start, $lte: end }
    });

    const totalRevenue = await CustomerPayment.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paymentCalculation.finalAmount' }
        }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      data: {
        ...summary,
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        period: {
          startDate: start,
          endDate: end
        }
      }
    });
  } catch (err) {
    console.error('Error getting customer payment summary:', err);
    res.status(500).json({ message: err.message || 'Failed to get customer payment summary.' });
  }
};

// @desc    Get all customer payments
// @route   GET /api/finance/customer-payments
// @access  Private (Finance Manager, Admin)
export const getCustomerPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customerId } = req.query;

    const query = {};
    if (status) query.paymentStatus = status;
    if (customerId) query.customerId = customerId;

  const payments = await CustomerPayment.find(query)
      .populate('customerId', 'name email phone')
      .populate('serviceCostId', 'vehiclePlate serviceType')
      // Sort by root-level paymentDate for consistency
      .sort('-paymentDate')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CustomerPayment.countDocuments(query);

    res.status(200).json({ 
      success: true, 
      data: {
        payments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (err) {
    console.error('Error fetching customer payments:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch customer payments.' });
  }
};