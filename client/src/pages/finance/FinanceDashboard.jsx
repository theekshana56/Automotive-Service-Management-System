import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import API services
import { getSalarySummary, getInventoryPaymentSummary, getServiceCostSummary, getPaymentSummary, getCapital, getLoyaltyDiscountSummary } from '../../api/finance/financeService';
import api from '../../api/client';

const FinanceDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    salarySummary: null,
    inventoryPaymentSummary: null,
    serviceCostSummary: null,
    paymentSummary: null,
    pendingPOs: [],
    capital: null,
    loyaltyDiscountSummary: null
  });
  const navigate = useNavigate();


  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      const refreshKeys = [
        'po_approved',
        'capital_updated',
        'customer_payment_processed',
        'service_cost_updated',
        'inventory_payment_made',
        'salary_paid'
      ];
      if (refreshKeys.includes(event.key)) {
        loadDashboardData();
      }
    };
    window.addEventListener('storage', handleStorage);
    
    // Auto-refresh when the tab gains focus or becomes visible
    const handleFocus = () => loadDashboardData();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadDashboardData();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic refresh every 60 seconds to ensure capital stays current
    const intervalId = setInterval(loadDashboardData, 60000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
    };
  }, []);

  // Capital is now auto-initialized, no need for manual initialization

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [salaryData, inventoryData, serviceData, paymentData, pendingPOsData, capitalData, loyaltyData, hrStaffData, purchaseOrderData, allServiceCostsData, allCustomerPaymentsData, serviceCostsWithPayments] = await Promise.all([
        getSalarySummary().catch((err) => {
          console.error('Salary summary error:', err);
          return { data: { totalSalaries: 0, totalNetSalary: 0 } };
        }),
        getInventoryPaymentSummary().catch((err) => {
          console.error('Inventory payment summary error:', err);
          return { data: { totals: { totalPayments: 0, totalPaid: 0 } } };
        }),
        getServiceCostSummary().catch((err) => {
          console.error('Service cost summary error:', err);
          return { data: { totals: { totalServices: 0, totalRevenue: 0, approvedServices: 0 } } };
        }),
        getPaymentSummary().catch((err) => {
          console.error('Payment summary error:', err);
          return { data: { totals: { totalAmount: 0, totalPayments: 0 } } };
        }),
        api.get('/api/purchase-orders?status=submitted&limit=5').catch((err) => {
          console.error('Pending POs error:', err);
          return { data: { purchaseOrders: [] } };
        }),
        getCapital().catch((err) => {
          console.error('Capital data error:', err);
          return { data: { initialAmount: 0, currentAmount: 0, totalSpent: 0 } };
        }),
        getLoyaltyDiscountSummary().catch((err) => {
          console.error('Loyalty discount summary error:', err);
          return { data: { totals: { totalRequests: 0, pendingRequests: 0, approvedRequests: 0, declinedRequests: 0, activeDiscounts: 0 }, recentRequests: [] } };
        }),
        api.get('/api/hr/staff/salary').catch((err) => {
          console.error('HR staff data error:', err);
          return { data: { staff: [] } };
        }),
        api.get('/api/purchase-orders?status=approved&limit=100').catch((err) => {
          console.error('Purchase orders error:', err);
          return { data: { purchaseOrders: [] } };
        }),
        api.get('/api/finance/service-costs?limit=1000').catch((err) => {
          console.error('All service costs error:', err);
          return { data: { data: [] } };
        }),
        api.get('/api/finance/customer-payments?status=completed&limit=1000').catch((err) => {
          console.error('All customer payments error:', err);
          return { data: { data: { payments: [] } } };
        }),
        api.get('/api/finance/customer-payments/service-costs?status=all').catch((err) => {
          console.error('Service costs with payments error:', err);
          return { data: { data: { serviceCosts: [], summary: { totalCustomerPayment: 0 } } } };
        })
      ]);



      // Debug: Log capital data
      console.log('🔍 Capital Data Debug:');
      console.log('Raw capitalData:', capitalData);
      console.log('capitalData.data:', capitalData.data);
      console.log('capitalData.data.currentAmount:', capitalData.data?.currentAmount);

      // Calculate total staff salaries (final pay after EPF 8% + ETF 3%) from HR data
      const totalStaffSalaries = hrStaffData.data?.staff?.reduce((sum, staff) => {
        const base = Number(staff.baseSalary || staff.regularPay || 0);
        const otPay = Number(staff.extraWorkPay || 0);
        const totalPay = Number(staff.totalPay || base + otPay);
        const epfEmployee = Math.round(base * 0.08);
        const etf = Math.round(base * 0.03);
        const finalPay = totalPay - (epfEmployee + etf);
        return sum + (finalPay > 0 ? finalPay : 0);
      }, 0) || 0;

      // Calculate total inventory costs from purchase orders
      const totalInventoryCosts = purchaseOrderData.data?.purchaseOrders?.reduce((sum, po) => {
        return sum + (po.totalAmount || 0);
      }, 0) || 0;

      // Calculate total service costs from all service cost records
      const totalServiceCosts = allServiceCostsData.data?.data?.reduce((sum, sc) => {
        return sum + (sc.finalCost?.totalAmount || 0);
      }, 0) || 0;

      // Calculate total customer payments from all customer payment records
      const paymentsList = allCustomerPaymentsData.data?.data?.payments || [];
      const computedPaymentsTotal = paymentsList.reduce((sum, payment) => {
        if (payment?.paymentStatus && payment.paymentStatus !== 'completed') return sum;
        const amount = Number(
          payment?.paymentDetails?.finalAmount ??
          payment?.paymentCalculation?.finalAmount ??
          payment?.paymentDetails?.amount ??
          0
        );
        // Include only valid, non-null, positive payment amounts (typically completed payments)
        return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
      }, 0);

      // Prefer server summary if it provides a value; fallback to computed list sum
      const summaryTotalRevenue = Number(
        paymentData?.data?.data?.totalRevenue ??
        paymentData?.data?.totalRevenue ??
        paymentData?.data?.totals?.totalAmount ??
        0
      );
      // Fallback to calculated totals from service costs (even if not processed yet)
      const calcSummaryTotal = Number(
        serviceCostsWithPayments?.data?.data?.summary?.totalCustomerPayment || 0
      );
      const calcComputedTotal = (serviceCostsWithPayments?.data?.data?.serviceCosts || []).reduce((sum, sc) => {
        const amt = Number(sc?.customerPaymentCalculation?.finalCustomerPayment || 0);
        return sum + (Number.isFinite(amt) && amt > 0 ? amt : 0);
      }, 0);

      const totalCustomerPayments =
        (summaryTotalRevenue && summaryTotalRevenue > 0 && summaryTotalRevenue) ||
        (computedPaymentsTotal && computedPaymentsTotal > 0 && computedPaymentsTotal) ||
        (calcSummaryTotal && calcSummaryTotal > 0 && calcSummaryTotal) ||
        calcComputedTotal || 0;

      setDashboardData({
        salarySummary: { ...salaryData.data, totalNetSalary: totalStaffSalaries },
        inventoryPaymentSummary: { ...inventoryData.data, totals: { ...inventoryData.data.totals, totalPaid: totalInventoryCosts } },
        serviceCostSummary: { ...serviceData.data, totals: { ...serviceData.data.totals, totalRevenue: totalServiceCosts } },
        paymentSummary: { ...paymentData.data, totalRevenue: totalCustomerPayments },
        pendingPOs: pendingPOsData.data.purchaseOrders || [],
        capital: capitalData.data,
        loyaltyDiscountSummary: loyaltyData.data,
        hrStaffData: hrStaffData.data,
        purchaseOrderData: purchaseOrderData.data,
        allServiceCostsData: allServiceCostsData.data,
        allCustomerPaymentsData: allCustomerPaymentsData.data
      });
    } catch (err) {
      console.error('❌ Dashboard load error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };


  const quickActions = [
    {
      title: 'Staff Salaries',
      description: 'Manage staff salaries and overtime',
      icon: '👥',
      color: 'bg-blue-500',
      action: () => navigate('/finance/salaries'),
      count: dashboardData.salarySummary?.totalSalaries || 0
    },
    {
      title: 'Inventory Payments',
      description: 'Track supplier payments',
      icon: '📦',
      color: 'bg-green-500',
      action: () => navigate('/finance/inventory-payments'),
      count: dashboardData.inventoryPaymentSummary?.totals?.totalPayments || 0
    },
    {
      title: 'Cost Service',
      description: 'Review advisor estimates',
      icon: '🛠️',
      color: 'bg-yellow-500',
      action: () => navigate('/finance/service-costs'),
      count: dashboardData.serviceCostSummary?.totals?.totalServices || 0
    },
    {
      title: 'Customer Payments',
      description: 'Process customer payments',
      icon: '💰',
      color: 'bg-purple-500',
      action: () => navigate('/finance/customer-payments'),
      count: dashboardData.paymentSummary?.totals?.totalPayments || 0
    },
   
    {
      title: 'Profit/Loss',
      description: 'View profit and loss summary',
      icon: '📊',
      color: 'bg-indigo-500',
      action: () => navigate('/finance/profit-loss'),
      count: 0
    },
    {
      title: 'Final Amount',
      description: 'Calculate final payment amounts',
      icon: '💵',
      color: 'bg-green-500',
      action: () => navigate('/finance/final-amount'),
      count: 0
    }
  ];

  const StatCard = ({ title, value, icon, color, subtitle }) => {
    const formattedValue = (() => {
      const numeric = Number(value || 0);
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(isNaN(numeric) ? 0 : numeric);
    })();

    return (
      <div className="glass-panel p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted mb-1">{title}</h3>
            <p className="text-2xl font-bold text-white">
              ${formattedValue}
            </p>
            {subtitle && (
              <p className="text-xs text-muted mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`text-3xl ${color}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-gray-600">Loading Finance Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold section-title mb-2">
          Finance Manager Dashboard
        </h1>
        <p className="text-muted">
          Welcome back, {user?.name}. Manage your financial operations efficiently.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Initial Capital"
          value={dashboardData.capital?.initialAmount || 500000}
          icon="💰"
          color="text-green-400"
        />
        <StatCard
          title="Total Revenue"
          value={dashboardData.paymentSummary?.totalRevenue || 0}
          icon="📈"
          color="text-blue-400"
          subtitle="Customer payments"
        />
        <StatCard
          title="Staff Salaries"
          value={dashboardData.salarySummary?.totalNetSalary || 0}
          icon="👥"
          color="text-purple-400"
          subtitle="Net salary paid (after EPF 8% + ETF 3%)"
        />
        <StatCard
          title="Inventory Payments"
          value={dashboardData.inventoryPaymentSummary?.totals?.totalPaid || 0}
          icon="📦"
          color="text-orange-400"
          subtitle="Supplier payments"
        />
        <StatCard
          title="Cost Service"
          value={dashboardData.serviceCostSummary?.totals?.totalRevenue || 0}
          icon="🛠️"
          color="text-yellow-400"
          subtitle="Total service costs"
        />
      </div>

      {/* Quick Actions */}
      <div className="glass-panel p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="glass-panel p-4 border border-white/10 cursor-pointer hover:border-primary/40 transition-all duration-200 hover:transform hover:scale-105"
              onClick={action.action}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">{action.title}</h3>
                  <p className="text-sm text-muted mb-2">{action.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg">
                    {action.count}
                  </span>
                  <span className="text-xl">{action.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Capital Management section removed as requested */}

      {/* Pending Purchase Orders */}
      {dashboardData.pendingPOs && dashboardData.pendingPOs.length > 0 && (
        <div className="glass-panel p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Pending Purchase Order Approvals</h3>
            <button
              onClick={() => navigate('/finance/inventory-payments')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {dashboardData.pendingPOs.slice(0, 3).map((po) => (
              <div key={po._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="font-medium text-white">{po.poNumber}</h4>
                    <p className="text-sm text-muted">
                      {po.supplier?.companyName || 'Unknown Supplier'} • {po.items?.length || 0} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold text-white">
                    ${(po.totalAmount || 0).toLocaleString()}
                  </span>
                  <button
                    onClick={() => navigate('/finance/inventory-payments')}
                    className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg hover:bg-yellow-500/30 transition-colors"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
            {dashboardData.pendingPOs.length > 3 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => navigate('/finance/inventory-payments')}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  View {dashboardData.pendingPOs.length - 3} more pending approvals
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="btn btn-secondary"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>


    </div>
  );
};

export default FinanceDashboard;
