import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCapital, generateFinalAmountPDF } from '../../api/finance/financeService';
import api from '../../api/client';

export default function FinalAmount() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    initialCapital: 0,
    customerPayments: 0,
    staffSalaries: 0,
    inventoryPayments: 0,
    serviceCost: 0,
    finalAmount: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [capitalRes, poRes, scRes, paymentsRes, hrStaffRes, scWithPaymentsRes, paymentSummaryRes] = await Promise.all([
          getCapital().catch(() => ({ data: { initialAmount: 0, currentAmount: 0 } })),
          api.get('/api/purchase-orders?status=approved&limit=100').catch(() => ({ data: { purchaseOrders: [] } })),
          api.get('/api/finance/service-costs?limit=1000').catch(() => ({ data: { data: [] } })),
          api.get('/api/finance/customer-payments?status=completed&limit=1000').catch(() => ({ data: { data: { payments: [] } } })),
          api.get('/api/hr/staff/salary').catch(() => ({ data: { staff: [] } })),
          api.get('/api/finance/customer-payments/service-costs?status=all').catch(() => ({ data: { data: { serviceCosts: [], summary: { totalCustomerPayment: 0 } } } })),
          api.get('/api/finance/customer-payments/summary').catch(() => ({ data: { data: { totalRevenue: 0, totals: { totalAmount: 0 } } } }))
        ]);

        const initialCapital = Number(capitalRes.data?.initialAmount || capitalRes.data?.data?.initialAmount || 0);

        const inventoryPayments = (poRes.data?.purchaseOrders || []).reduce((sum, po) => sum + (po.totalAmount || 0), 0);
        const serviceCost = (scRes.data?.data || []).reduce((sum, sc) => sum + (sc.finalCost?.totalAmount || 0), 0);

        const summaryTotalRevenue = Number(
          paymentSummaryRes?.data?.data?.totalRevenue || paymentSummaryRes?.data?.data?.totals?.totalAmount || 0
        );
        const paymentsList = paymentsRes.data?.data?.payments || [];
        const paymentsComputed = paymentsList.reduce((sum, p) => {
          if (p?.paymentStatus && p.paymentStatus !== 'completed') return sum;
          const amt = Number(p?.paymentDetails?.finalAmount ?? p?.paymentCalculation?.finalAmount ?? p?.paymentDetails?.amount ?? 0);
          return sum + (Number.isFinite(amt) && amt > 0 ? amt : 0);
        }, 0);
        const calcSummaryTotal = Number(scWithPaymentsRes?.data?.data?.summary?.totalCustomerPayment || 0);
        const calcComputedTotal = (scWithPaymentsRes?.data?.data?.serviceCosts || []).reduce((sum, sc) => {
          const amt = Number(sc?.customerPaymentCalculation?.finalCustomerPayment || 0);
          return sum + (Number.isFinite(amt) && amt > 0 ? amt : 0);
        }, 0);
        const customerPayments = summaryTotalRevenue || paymentsComputed || calcSummaryTotal || calcComputedTotal || 0;

        const staffSalaries = (hrStaffRes.data?.staff || []).reduce((sum, s) => {
          const base = Number(s.baseSalary || s.regularPay || 0);
          const ot = Number(s.extraWorkPay || 0);
          const totalPay = Number(s.totalPay || base + ot);
          const epf = Math.round(base * 0.08);
          const etf = Math.round(base * 0.03);
          const finalPay = totalPay - (epf + etf);
          return sum + (finalPay > 0 ? finalPay : 0);
        }, 0);

        const finalAmount = initialCapital + customerPayments - (serviceCost + staffSalaries + inventoryPayments);

        setData({ initialCapital, customerPayments, staffSalaries, inventoryPayments, serviceCost, finalAmount });
      } catch (e) {
        setError('Failed to load final amount');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));

  if (loading) return <div className="card p-6">Loading Final Amount...</div>;
  if (error) return <div className="card p-6 text-red-400">{error}</div>;

  return (
    <div className="card p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold section-title">Final Amount</h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={async () => {
            try {
              const blobRes = await generateFinalAmountPDF({
                initialCapital: data.initialCapital,
                customerPayments: data.customerPayments,
                staffSalaries: data.staffSalaries,
                inventoryPayments: data.inventoryPayments,
                serviceCost: data.serviceCost,
                finalAmount: data.finalAmount
              });
              const blob = new Blob([blobRes.data], { type: 'application/pdf' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `final-amount-${new Date().toISOString().split('T')[0]}.pdf`;
              a.click();
              window.URL.revokeObjectURL(url);
            } catch (e) {
              console.error('Failed to generate final amount PDF', e);
              alert('Failed to generate PDF');
            }
          }}>Export PDF</button>
          <button className="btn btn-secondary" onClick={() => navigate('/finance')}>Back to Finance</button>
        </div>
      </div>

      <div className="glass-panel p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <table className="w-full">
          <tbody>
            <tr className="border-b border-white/5"><td className="p-3">Initial Capital</td><td className="p-3 text-right">{'$' + fmt(data.initialCapital)}</td></tr>
            <tr className="border-b border-white/5"><td className="p-3">Customer Payments</td><td className="p-3 text-right">{'$' + fmt(data.customerPayments)}</td></tr>
            <tr className="border-b border-white/5"><td className="p-3">Staff Salaries</td><td className="p-3 text-right">{'$' + fmt(data.staffSalaries)}</td></tr>
            <tr className="border-b border-white/5"><td className="p-3">Inventory Payments</td><td className="p-3 text-right">{'$' + fmt(data.inventoryPayments)}</td></tr>
            <tr className="border-b border-white/5"><td className="p-3">Service Cost</td><td className="p-3 text-right">{'$' + fmt(data.serviceCost)}</td></tr>
            <tr>
              <td className="p-3 font-semibold">Final Amount</td>
              <td className={`p-3 text-right font-semibold ${data.finalAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>{'$' + fmt(data.finalAmount)}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-muted mt-4">Formula: Final amount = Initial capital + Customer payments − (Service cost + Staff salaries + Inventory payments)</p>
      </div>
    </div>
  );
}


