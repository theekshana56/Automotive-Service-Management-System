import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServiceCostSummary, getInventoryPaymentSummary, getSalarySummary, getPaymentSummary, generateProfitLossPDF } from '../../api/finance/financeService';
import api from '../../api/client';

export default function ProfitLoss() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    serviceCosts: 0,
    inventoryPayments: 0,
    staffSalaries: 0,
    customerPayments: 0,
    profitLoss: 0,
    rows: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        // Use summaries when available but fall back to raw collections to be robust
        const [
          serviceCostsRes,
          inventoryRes,
          salaryRes,
          paymentsRes,
          hrStaffData,
          purchaseOrderData,
          allServiceCostsData,
          allCustomerPaymentsData,
          serviceCostsWithPayments
        ] = await Promise.all([
          getServiceCostSummary().catch(() => ({ data: { data: { totals: { totalRevenue: 0 } } } })),
          getInventoryPaymentSummary().catch(() => ({ data: { data: { totals: { totalPaid: 0 } } } })),
          getSalarySummary().catch(() => ({ data: { data: { totalNetSalary: 0 } } })),
          getPaymentSummary().catch(() => ({ data: { data: { totalRevenue: 0, totals: { totalAmount: 0 } } } })),
          api.get('/api/hr/staff/salary').catch(() => ({ data: { staff: [] } })),
          api.get('/api/purchase-orders?status=approved&limit=100').catch(() => ({ data: { purchaseOrders: [] } })),
          api.get('/api/finance/service-costs?limit=1000').catch(() => ({ data: { data: [] } })),
          api.get('/api/finance/customer-payments?limit=1000').catch(() => ({ data: { data: { payments: [] } } })),
          api.get('/api/finance/customer-payments/service-costs?status=all').catch(() => ({ data: { data: { serviceCosts: [], summary: { totalCustomerPayment: 0 } } } }))
        ]);

        // Summaries first
        let serviceCosts = Number(serviceCostsRes.data?.data?.totals?.totalRevenue || 0);
        let inventoryPayments = Number(inventoryRes.data?.data?.totals?.totalPaid || 0);
        let staffSalaries = Number(salaryRes.data?.data?.totalNetSalary || salaryRes.data?.data?.totals?.totalNetSalary || 0);
        let customerPayments = Number(
          paymentsRes.data?.data?.totalRevenue ||
          paymentsRes.data?.data?.totals?.totalAmount ||
          paymentsRes.data?.totalRevenue || 0
        );

        // Fallback computations
        if (!serviceCosts) {
          serviceCosts = (allServiceCostsData.data?.data || []).reduce((sum, sc) => sum + (sc.finalCost?.totalAmount || 0), 0);
        }
        if (!inventoryPayments) {
          inventoryPayments = (purchaseOrderData.data?.purchaseOrders || []).reduce((sum, po) => sum + (po.totalAmount || 0), 0);
        }
        if (!staffSalaries) {
          staffSalaries = (hrStaffData.data?.staff || []).reduce((sum, staff) => {
            const base = Number(staff.baseSalary || staff.regularPay || 0);
            const otPay = Number(staff.extraWorkPay || 0);
            const totalPay = Number(staff.totalPay || base + otPay);
            const epfEmployee = Math.round(base * 0.08);
            const etf = Math.round(base * 0.03);
            const finalPay = totalPay - (epfEmployee + etf);
            return sum + (finalPay > 0 ? finalPay : 0);
          }, 0);
        }
        if (!customerPayments) {
          // Sum of actual payment documents
          const paymentsList = allCustomerPaymentsData.data?.data?.payments || [];
          const computedPaymentsTotal = paymentsList.reduce((sum, p) => {
            const amount = Number(
              p?.paymentDetails?.finalAmount ??
              p?.paymentCalculation?.finalAmount ??
              p?.paymentDetails?.amount ?? 0
            );
            return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
          }, 0);

          // Fallback to calculated totals from service costs (even if not processed)
          const calcSummaryTotal = Number(serviceCostsWithPayments?.data?.data?.summary?.totalCustomerPayment || 0);
          const calcComputedTotal = (serviceCostsWithPayments?.data?.data?.serviceCosts || []).reduce((sum, sc) => {
            const amt = Number(sc?.customerPaymentCalculation?.finalCustomerPayment || 0);
            return sum + (Number.isFinite(amt) && amt > 0 ? amt : 0);
          }, 0);

          customerPayments = computedPaymentsTotal || calcSummaryTotal || calcComputedTotal || 0;
        }

        const profitLoss = customerPayments - (serviceCosts + inventoryPayments + staffSalaries);

        setData({
          serviceCosts,
          inventoryPayments,
          staffSalaries,
          customerPayments,
          profitLoss,
          rows: [
            { label: 'Customer Payments', value: customerPayments, type: 'income' },
            { label: 'Service Costs', value: serviceCosts, type: 'expense' },
            { label: 'Inventory Payments', value: inventoryPayments, type: 'expense' },
            { label: 'Staff Salaries', value: staffSalaries, type: 'expense' },
          ]
        });
      } catch (e) {
        setError('Failed to load profit/loss');
      } finally {
        setLoading(false);
      }
    };

    load();

    // Auto-refresh on relevant app events and periodically
    const handleStorage = (event) => {
      const keys = [
        'customer_payment_processed',
        'service_cost_updated',
        'inventory_payment_made',
        'salary_paid'
      ];
      if (keys.includes(event.key)) {
        load();
      }
    };
    const handleFocus = () => load();
    const handleVisibility = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    const intervalId = setInterval(load, 30000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
    };
  }, []);

  const format = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));

  if (loading) {
    return <div className="card p-6">Loading Profit/Loss...</div>;
  }

  if (error) {
    return <div className="card p-6 text-red-400">{error}</div>;
  }

  const profitPositive = data.profitLoss >= 0;

  return (
    <div className="card p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold section-title">Profit / Loss</h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => window.location.reload()}>Refresh</button>
          <button className="btn btn-secondary" onClick={async () => {
            try {
              const params = new URLSearchParams({
                customerPayments: String(data.customerPayments || 0),
                serviceCosts: String(data.serviceCosts || 0),
                inventoryPayments: String(data.inventoryPayments || 0),
                staffSalaries: String(data.staffSalaries || 0),
                netProfitLoss: String(data.profitLoss || 0)
              });
              const blobRes = await generateProfitLossPDF(Object.fromEntries(params));
              const blob = new Blob([blobRes.data], { type: 'application/pdf' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `profit-loss-${new Date().toISOString().split('T')[0]}.pdf`;
              a.click();
              window.URL.revokeObjectURL(url);
            } catch (e) {
              console.error('Failed to generate profit/loss PDF', e);
              alert('Failed to generate PDF');
            }
          }}>Export PDF</button>
          <button className="btn btn-secondary" onClick={() => navigate('/finance')}>Back to Finance</button>
        </div>
      </div>
      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <Metric title="Customer Payments" value={data.customerPayments} color="text-green-400" icon="💰" />
        <Metric title="Service Costs" value={data.serviceCosts} color="text-yellow-400" icon="🛠️" />
        <Metric title="Inventory Payments" value={data.inventoryPayments} color="text-orange-400" icon="📦" />
        <Metric title="Staff Salaries" value={data.staffSalaries} color="text-purple-400" icon="👥" />
        <Metric title="Net Profit/Loss" value={data.profitLoss} color={profitPositive ? 'text-green-400' : 'text-red-400'} icon={profitPositive ? '📈' : '📉'} />
      </div>

      {/* Summary table */}
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              <th className="text-left p-3">Item</th>
              <th className="text-right p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td className="p-3">Customer Payments</td>
              <td className="p-3 text-right">{'$' + format(data.customerPayments)}</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="p-3">Service Costs</td>
              <td className="p-3 text-right">{'$' + format(data.serviceCosts)}</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="p-3">Inventory Payments</td>
              <td className="p-3 text-right">{'$' + format(data.inventoryPayments)}</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="p-3">Staff Salaries</td>
              <td className="p-3 text-right">{'$' + format(data.staffSalaries)}</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">Net Profit/Loss</td>
              <td className={`p-3 text-right font-semibold ${profitPositive ? 'text-green-400' : 'text-red-400'}`}>{'$' + format(data.profitLoss)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Breakdown box removed as requested */}
    </div>
  );
}

function Metric({ title, value, icon, color }) {
  const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
  return (
    <div className="glass-panel p-6 border border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted mb-1">{title}</h3>
          <p className="text-2xl font-bold text-white">${formatted}</p>
        </div>
        <div className={`text-3xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}


