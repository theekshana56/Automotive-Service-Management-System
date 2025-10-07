import api from '../client';

// Salary Management API
export const getStaffSalaries = (params = {}) =>
  api.get('/api/finance/salaries', { params });

// HR Staff Salary Data API
export const getHRStaffSalaryData = () =>
  api.get('/api/hr/staff/salary');

export const getStaffSalary = (id) =>
  api.get(`/api/finance/salaries/${id}`);

export const createStaffSalary = (data) =>
  api.post('/api/finance/salaries', data);

export const updateStaffSalary = (id, data) =>
  api.put(`/api/finance/salaries/${id}`, data);

export const approveStaffSalary = (id) =>
  api.put(`/api/finance/salaries/${id}/approve`);

export const payStaffSalary = (id, data) =>
  api.put(`/api/finance/salaries/${id}/pay`, data);

export const getSalarySummary = (params = {}) =>
  api.get('/api/finance/salaries/summary', { params });

export const deleteStaffSalary = (id) =>
  api.delete(`/api/finance/salaries/${id}`);

// Comprehensive Salary Calculation API
export const calculateSalaryFromAttendance = (data) =>
  api.post('/api/finance/salaries/calculate', data);

export const createSalaryFromAttendance = (data) =>
  api.post('/api/finance/salaries/create-from-attendance', data);

export const calculateAllSalariesFromAttendance = (data) =>
  api.post('/api/finance/salaries/calculate-all', data);

export const getComprehensiveSalarySummary = (params = {}) =>
  api.get('/api/finance/salaries/comprehensive-summary', { params });

export const generateDetailedSalaryReport = (staffEmail, params = {}) =>
  api.get(`/api/finance/salaries/report/${staffEmail}`, { params });

export const populateSampleSalaryData = () =>
  api.post('/api/finance/salaries/populate-sample-data');

export const createMissingSalaryRecords = () =>
  api.post('/api/finance/salaries/create-missing-records');

// Inventory Payment API
export const getInventoryPayments = (params = {}) =>
  api.get('/api/finance/inventory-payments', { params });

export const getInventoryPayment = (id) =>
  api.get(`/api/finance/inventory-payments/${id}`);

export const createInventoryPayment = (data) =>
  api.post('/api/finance/inventory-payments', data);

export const makeInventoryPayment = (id, data) =>
  api.put(`/api/finance/inventory-payments/${id}/pay`, data);

export const updateInventoryPayment = (id, data) =>
  api.put(`/api/finance/inventory-payments/${id}`, data);

export const getInventoryPaymentSummary = (params = {}) =>
  api.get('/api/finance/inventory-payments/summary', { params });

export const deleteInventoryPayment = (id) =>
  api.delete(`/api/finance/inventory-payments/${id}`);

// Capital Management API
export const getCapital = () =>
  api.get('/api/finance/capital');

export const initializeCapital = (amount) =>
  api.post('/api/finance/capital/initialize', { amount });

export const updateCapital = (amount, description) =>
  api.put('/api/finance/capital', { amount, description });

export const getCapitalTransactions = (params = {}) =>
  api.get('/api/finance/capital/transactions', { params });

// Service Cost API
export const getServiceCosts = (params = {}) =>
  api.get('/api/finance/service-costs', { params });

export const getServiceCost = (id) =>
  api.get(`/api/finance/service-costs/${id}`);

export const createServiceCost = (data) =>
  api.post('/api/finance/service-costs', data);

export const reviewServiceCost = (id, data) =>
  api.put(`/api/finance/service-costs/${id}/review`, data);

export const generateInvoice = (id) =>
  api.post(`/api/finance/service-costs/${id}/generate-invoice`);

export const getServiceCostSummary = (params = {}) =>
  api.get('/api/finance/service-costs/summary', { params });

export const updateServiceCost = (id, data) =>
  api.put(`/api/finance/service-costs/${id}`, data);

export const deleteServiceCost = (id) =>
  api.delete(`/api/finance/service-costs/${id}`);

// Customer Payment Calculation API
export const calculateCustomerPayment = (data) =>
  api.post('/api/finance/customer-payments/calculate', data);

export const getServiceCostsWithPayments = (params = {}) =>
  api.get('/api/finance/customer-payments/service-costs', { params });

export const processCustomerPaymentRequest = (data) =>
  api.post('/api/finance/customer-payments/process', data);

export const getCustomerPaymentSummary = (params = {}) =>
  api.get('/api/finance/customer-payments/summary', { params });

// Customer Payment Management API
export const getCustomerPayments = (params = {}) =>
  api.get('/api/finance/customer-payments', { params });

export const getCustomerPayment = (id) =>
  api.get(`/api/finance/customer-payments/${id}`);

export const processCustomerPayment = (data) =>
  api.post('/api/finance/customer-payments', data);

export const updatePaymentStatus = (id, data) =>
  api.put(`/api/finance/customer-payments/${id}/status`, data);

export const processRefund = (id, data) =>
  api.post(`/api/finance/customer-payments/${id}/refund`, data);

export const getPaymentSummary = (params = {}) =>
  api.get('/api/finance/customer-payments/summary', { params });

export const updateCustomerPayment = (id, data) =>
  api.put(`/api/finance/customer-payments/${id}`, data);

export const deleteCustomerPayment = (id) =>
  api.delete(`/api/finance/customer-payments/${id}`);

// Loyalty Discount API
export const createLoyaltyDiscountRequest = (data) =>
  api.post('/api/finance/loyalty-discount-requests', data);

export const getLoyaltyDiscountRequests = (params = {}) =>
  api.get('/api/finance/loyalty-discount-requests', { params });

export const getLoyaltyDiscountRequest = (id) =>
  api.get(`/api/finance/loyalty-discount-requests/${id}`);

export const reviewLoyaltyDiscountRequest = (id, data) =>
  api.put(`/api/finance/loyalty-discount-requests/${id}/review`, data);

export const getCustomerLoyaltyRequests = (customerId) =>
  api.get(`/api/finance/loyalty-discount-requests/customer/${customerId}`);

export const getLoyaltyDiscountSummary = (params = {}) =>
  api.get('/api/finance/loyalty-discount-requests/summary', { params });

// Email API
export const sendInvoiceEmail = (invoiceId) =>
  api.post(`/api/finance/email/send-invoice/${invoiceId}`);

export const sendReceiptEmail = (paymentId) =>
  api.post(`/api/finance/email/send-receipt/${paymentId}`);

export const sendSalaryNotificationEmail = (salaryId) =>
  api.post(`/api/finance/email/send-salary-notification/${salaryId}`);

export const sendBulkInvoiceEmails = (data) =>
  api.post('/api/finance/email/send-bulk-invoices', data);

export const sendBulkSalaryNotificationEmails = (data) =>
  api.post('/api/finance/email/send-bulk-salary-notifications', data);

export const getEmailStatus = (params = {}) =>
  api.get('/api/finance/email/status', { params });

// PDF Generation API
export const generateStaffSalaryPDF = (params = {}) =>
  api.get('/api/finance/pdf/staff-salary', { 
    params,
    responseType: 'blob'
  });

export const generateCustomerPaymentPDF = (params = {}) =>
  api.get('/api/finance/pdf/customer-payment', { 
    params,
    responseType: 'blob'
  });

export const generateServiceCostPDF = (params = {}) =>
  api.get('/api/finance/pdf/service-cost', { 
    params,
    responseType: 'blob'
  });

export const generatePurchaseOrderCostPDF = (params = {}) =>
  api.get('/api/finance/pdf/purchase-order-cost', { 
    params,
    responseType: 'blob'
  });

export const generateCombinedFinancePDF = (params = {}) =>
  api.get('/api/finance/pdf/combined', { 
    params,
    responseType: 'blob'
  });

export const generateProfitLossPDF = (params = {}) =>
  api.get('/api/finance/pdf/profit-loss', {
    params,
    responseType: 'blob'
  });

export const generateFinalAmountPDF = (params = {}) =>
  api.get('/api/finance/pdf/final-amount', {
    params,
    responseType: 'blob'
  });

// Salary Report API
export const generateSalaryReport = (params = {}) =>
  api.get('/api/finance/salaries/report', { params });

export const generateSalaryReportPDF = (params = {}) =>
  api.get('/api/finance/salaries/report-pdf', { 
    params,
    responseType: 'blob'
  });

// Staff Management API
export const addStaffMember = (data) =>
  api.post('/api/finance/pdf/add-staff', data);
