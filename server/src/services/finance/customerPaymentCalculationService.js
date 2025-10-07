// customerPaymentCalculationService.js

const PROFIT_MARGIN_PERCENTAGE = 80; // 80% profit margin
const TAX_RATE_PERCENTAGE = 12;     // 12% tax rate
const ADVISOR_FIXED_COST = 100;     // $100 advisor fixed cost
const STAFF_FIXED_COST = 60;        // $60 staff fixed cost

/**
 * Calculates the customer payment based on the service cost total amount,
 * applying an 80% profit margin, advisor fixed cost, staff fixed cost, tax, and optional loyalty discount.
 * Formula: (service cost + service cost * 80/100 + advisor fixed cost + staff fixed cost)
 * @param {number} serviceCostTotal - The total amount from service cost (renamed from cost estimation).
 * @param {number} loyaltyDiscountPercentage - Optional loyalty discount percentage (default 0).
 * @returns {object} An object containing serviceCost, profitAmount, advisorFixedCost, staffFixedCost, costWithProfit, taxAmount, loyaltyDiscount, and finalCustomerPayment.
 */
export const calculateCustomerPaymentWithMargin = (serviceCostTotal, loyaltyDiscountPercentage = 0) => {
  const serviceCost = Number(serviceCostTotal) || 0; // Renamed from baseCost to serviceCost
  const loyaltyDiscount = Number(loyaltyDiscountPercentage) || 0;

  // Calculate profit margin (80% of service cost)
  const profitAmount = serviceCost * (PROFIT_MARGIN_PERCENTAGE / 100);

  // Calculate total cost with profit, advisor fixed cost, and staff fixed cost
  const costWithProfit = serviceCost + profitAmount + ADVISOR_FIXED_COST + STAFF_FIXED_COST;

  // Calculate tax
  const taxAmount = costWithProfit * (TAX_RATE_PERCENTAGE / 100);

  // Subtotal before loyalty discount
  const subtotal = costWithProfit + taxAmount;

  // Calculate loyalty discount amount
  const loyaltyDiscountAmount = subtotal * (loyaltyDiscount / 100);

  // Final customer payment after loyalty discount
  const finalCustomerPayment = subtotal - loyaltyDiscountAmount;

  return {
    serviceCost: parseFloat(serviceCost.toFixed(2)), // Renamed from baseCost
    profitAmount: parseFloat(profitAmount.toFixed(2)),
    advisorFixedCost: parseFloat(ADVISOR_FIXED_COST.toFixed(2)),
    staffFixedCost: parseFloat(STAFF_FIXED_COST.toFixed(2)),
    costWithProfit: parseFloat(costWithProfit.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    subtotal: parseFloat(subtotal.toFixed(2)),
    loyaltyDiscountPercentage: parseFloat(loyaltyDiscount.toFixed(2)),
    loyaltyDiscountAmount: parseFloat(loyaltyDiscountAmount.toFixed(2)),
    finalCustomerPayment: parseFloat(finalCustomerPayment.toFixed(2)),
  };
};

/**
 * Calculates the summary for multiple service costs with customer payments.
 * @param {Array<object>} serviceCosts - An array of service cost objects, each with a finalCost.totalAmount.
 * @returns {object} An object containing totalServiceCost, totalProfitAmount, totalAdvisorFixedCost, totalStaffFixedCost, totalCustomerPayment, and averageCustomerPayment.
 */
export const getCustomerPaymentsSummary = (serviceCosts) => {
  let totalServiceCost = 0;
  let totalProfitAmount = 0;
  let totalAdvisorFixedCost = 0;
  let totalStaffFixedCost = 0;
  let totalCustomerPayment = 0;

  serviceCosts.forEach(sc => {
    const { serviceCost, profitAmount, advisorFixedCost, staffFixedCost, finalCustomerPayment } = calculateCustomerPaymentWithMargin(sc.finalCost?.totalAmount || 0);
    totalServiceCost += serviceCost;
    totalProfitAmount += profitAmount;
    totalAdvisorFixedCost += advisorFixedCost;
    totalStaffFixedCost += staffFixedCost;
    totalCustomerPayment += finalCustomerPayment;
  });

  const averageCustomerPayment = serviceCosts.length > 0 ? totalCustomerPayment / serviceCosts.length : 0;

  return {
    totalServiceCost: parseFloat(totalServiceCost.toFixed(2)),
    totalProfitAmount: parseFloat(totalProfitAmount.toFixed(2)),
    totalAdvisorFixedCost: parseFloat(totalAdvisorFixedCost.toFixed(2)),
    totalStaffFixedCost: parseFloat(totalStaffFixedCost.toFixed(2)),
    totalCustomerPayment: parseFloat(totalCustomerPayment.toFixed(2)),
    averageCustomerPayment: parseFloat(averageCustomerPayment.toFixed(2)),
    profitMarginPercentage: PROFIT_MARGIN_PERCENTAGE,
    taxRatePercentage: TAX_RATE_PERCENTAGE,
    advisorFixedCost: ADVISOR_FIXED_COST,
    staffFixedCost: STAFF_FIXED_COST,
  };
};

/**
 * Processes a customer payment with the calculated margin.
 * @param {object} serviceCost - The service cost object.
 * @param {object} paymentDetails - Payment details including method, reference, etc.
 * @param {object} additionalData - Additional data like discounts, notes, etc.
 * @returns {object} The processed payment data.
 */
export const processCustomerPayment = (serviceCost, paymentDetails, additionalData = {}) => {
  const calculation = calculateCustomerPaymentWithMargin(serviceCost.finalCost?.totalAmount || 0);
  
  return {
    serviceCostId: serviceCost._id,
    customerId: serviceCost.customerId,
    customerName: serviceCost.customerId?.name || 'Unknown Customer',
    customerEmail: serviceCost.customerId?.email || '',
    vehiclePlate: serviceCost.vehiclePlate,
    serviceType: serviceCost.serviceType,
    paymentCalculation: {
      ...calculation,
      loyaltyDiscount: additionalData.loyaltyDiscount || 0,
      otherDiscount: additionalData.otherDiscount || 0,
      finalAmount: calculation.finalCustomerPayment - (additionalData.loyaltyDiscount || 0) - (additionalData.otherDiscount || 0)
    },
    paymentDetails: {
      ...paymentDetails,
      originalAmount: calculation.finalCustomerPayment,
      finalAmount: calculation.finalCustomerPayment - (additionalData.loyaltyDiscount || 0) - (additionalData.otherDiscount || 0)
    },
    notes: additionalData.notes || '',
    processedAt: new Date()
  };
};
