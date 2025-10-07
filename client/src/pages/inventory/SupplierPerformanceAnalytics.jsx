import React, { useEffect, useMemo, useState, useCallback } from 'react';
import EnhancedDataTable from '../../components/inventory/EnhancedDataTable';
import ExportActions from '../../components/inventory/ExportActions';
import { downloadSupplierPerformancePDF, getSupplierPerformance } from '../../services/inventoty/api';

export default function SupplierPerformanceAnalytics() {
  const [rows, setRows] = useState([]);
  const [lateDays, setLateDays] = useState(2);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (rows.length === 0) {
      return [
        { label: 'Total Suppliers', value: '0' },
        { label: 'Total Orders', value: '0' },
        { label: 'Avg Delivery Time', value: '0 days' },
        { label: 'Late Deliveries', value: '0%' },
        { label: 'Total Spend', value: '$0.00' },
        { label: 'On-Time Suppliers', value: '0' }
      ];
    }

    const totalSuppliers = rows.length;
    const totalOrders = rows.reduce((sum, r) => sum + (r.totalPOs || 0), 0);
    const avgDeliveryTime = rows.reduce((sum, r) => sum + (r.avgDeliveryDays || 0), 0) / rows.length;
    const avgLatePercentage = rows.reduce((sum, r) => sum + (r.deliveredLatePct || 0), 0) / rows.length;
    const totalSpend = rows.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const onTimeSuppliers = rows.filter(r => (r.deliveredLatePct || 0) <= 10).length;

    return [
      { 
        label: 'Total Suppliers', 
        value: totalSuppliers.toLocaleString()
      },
      { 
        label: 'Total Orders', 
        value: totalOrders.toLocaleString()
      },
      { 
        label: 'Avg Delivery Time', 
        value: `${avgDeliveryTime.toFixed(1)} days`
      },
      { 
        label: 'Late Deliveries', 
        value: `${avgLatePercentage.toFixed(1)}%`,
        change: avgLatePercentage > 20 ? 'high' : avgLatePercentage > 10 ? 'medium' : 'low'
      },
      { 
        label: 'Total Spend', 
        value: `$${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      },
      { 
        label: 'On-Time Suppliers', 
        value: `${onTimeSuppliers}/${totalSuppliers}`,
        change: `${((onTimeSuppliers / totalSuppliers) * 100).toFixed(1)}%`
      }
    ];
  }, [rows]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSupplierPerformance({ lateDays });
      setRows(data.rows || []);
    } catch (e) {
      console.error('Failed to load supplier performance', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [lateDays]);

  useEffect(() => { 
    load(); 
  }, [load]);

  const onExportPDF = async () => {
    try {
      setExportLoading(true);
      const resp = await downloadSupplierPerformancePDF({ lateDays });
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supplier-performance-${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Failed to export PDF', e);
    } finally {
      setExportLoading(false);
    }
  };

  const getPerformanceBadge = (latePercentage) => {
    const percentage = latePercentage || 0;
    
    if (percentage <= 5) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30">
            Excellent
          </span>
        </div>
      );
    } else if (percentage <= 15) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30">
            Good
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30">
            Needs Improvement
          </span>
        </div>
      );
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'supplierId', 
      label: 'Supplier',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 border rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border-emerald-500/30">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0H3m2 0v-5a2 2 0 012-2h2m0 0V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h2" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{row.companyName || row.supplierId}</div>
            <div className="text-xs text-slate-400">Supplier ID: {row.supplierId}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'totalPOs', 
      label: 'Total Orders',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {(row.totalPOs || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">orders</div>
        </div>
      )
    },
    { 
      key: 'avgDeliveryDays', 
      label: 'Avg Delivery Time',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-400">
            {Number(row.avgDeliveryDays || 0).toFixed(1)}
          </div>
          <div className="text-xs text-slate-400">days</div>
        </div>
      )
    },
    { 
      key: 'deliveredLatePct', 
      label: 'Late Deliveries',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-bold text-orange-400">
            {Number(row.deliveredLatePct || 0).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">late rate</div>
        </div>
      )
    },
    { 
      key: 'performance', 
      label: 'Performance',
      render: (row) => getPerformanceBadge(row.deliveredLatePct)
    },
    { 
      key: 'totalAmount', 
      label: 'Total Spend',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">
            ${Number(row.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400">total value</div>
        </div>
      )
    },
  ], []);

  const handleExport = async (type) => {
    if (type === 'pdf') {
      await onExportPDF();
    }
  };

  const SupplierIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0H3m2 0v-5a2 2 0 012-2h2m0 0V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h2" />
    </svg>
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 rounded-full w-96 h-96 bg-emerald-500 mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 bg-blue-500 rounded-full w-96 h-96 mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 bg-purple-500 rounded-full left-1/2 w-96 h-96 mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative space-y-8 app-container">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden border shadow-2xl rounded-3xl bg-gradient-to-r from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-xl border-slate-600/50">
          {/* Header Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 translate-x-32 -translate-y-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 -translate-x-24 translate-y-24 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500"></div>
          </div>
          
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 border rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border-emerald-500/30">
                  <SupplierIcon />
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-white">Supplier Performance Analytics</h1>
                  <p className="text-lg text-slate-300">Evaluate suppliers based on delivery history, timeliness, and overall performance metrics</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 border bg-slate-700/50 backdrop-blur-sm border-slate-600/30 rounded-xl">
                  <label className="text-sm font-medium text-slate-300">Late if days &gt;</label>
                  <input
                    type="number"
                    min={0}
                    className="w-20 px-3 py-1.5 bg-slate-600/50 border border-slate-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    value={lateDays}
                    onChange={(e) => setLateDays(parseInt(e.target.value || '0', 10))}
                  />
                </div>
                <button
                  onClick={load}
                  disabled={loading}
                  className="relative px-6 py-3 overflow-hidden font-medium text-white transition-all duration-300 group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-white/20 to-transparent group-hover:opacity-100"></div>
                  <div className="relative flex items-center gap-2">
                    {loading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    <span>Refresh Data</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden transition-all duration-300 border group rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border-slate-600/30 hover:border-slate-500/50 hover:scale-105 hover:shadow-lg"
                >
                  <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-br from-white/5 to-transparent group-hover:opacity-100"></div>
                  <div className="relative p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium tracking-wide uppercase text-slate-400">
                        {stat.label}
                      </div>
                      {stat.change && (
                        <div className={`text-xs font-medium ${
                          stat.change === 'high' ? 'text-red-400' : 
                          stat.change === 'medium' ? 'text-yellow-400' : 
                          stat.change === 'low' ? 'text-green-400' :
                          stat.change.includes('%') ? 'text-emerald-400' :
                          'text-slate-400'
                        }`}>
                          {stat.change === 'high' ? '⚠ High' : 
                           stat.change === 'medium' ? '⚡ Medium' : 
                           stat.change === 'low' ? '✓ Low' : 
                           stat.change}
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-white transition-colors duration-300 group-hover:text-white/90">
                      {stat.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Export Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 border rounded-lg bg-emerald-500/10 border-emerald-500/20">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Export Options</h3>
          </div>
          <ExportActions 
            onExport={handleExport}
            loading={exportLoading}
            showCSV={false}
          />
        </div>

        {/* Enhanced Data Table */}
        <div className="relative overflow-hidden border shadow-xl rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border-slate-600/50">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 to-slate-400/5"></div>
          <div className="relative">
            <EnhancedDataTable
              columns={columns}
              data={rows}
              loading={loading}
              emptyMessage="No supplier performance data found. Please check your supplier records and purchase orders."
              showExport={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


