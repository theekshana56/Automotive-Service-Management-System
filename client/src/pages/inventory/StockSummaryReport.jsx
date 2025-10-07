import React, { useEffect, useMemo, useState, useCallback } from 'react';
import EnhancedDataTable from '../../components/inventory/EnhancedDataTable';
import ExportActions from '../../components/inventory/ExportActions';
import { getStockSummaryReport, downloadStockSummaryCSV, downloadStockSummaryPDF } from '../../services/inventoty/api';

export default function StockSummaryReport() {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ 
    totalParts: 0, 
    totalOnHand: 0, 
    totalAvailable: 0, 
    totalValuation: 0 
  });



  // Calculate additional stats
  const stats = useMemo(() => {
    const lowStockItems = rows.filter(item => 
      (item.available || 0) <= (item.reorderLevel || 0)
    ).length;
    
    const outOfStockItems = rows.filter(item => 
      (item.available || 0) === 0
    ).length;

    return [
      { 
        label: 'Total Parts', 
        value: summary.totalParts.toLocaleString(),
        change: rows.length > 0 ? `+${((rows.length / summary.totalParts) * 100).toFixed(1)}%` : null
      },
      { 
        label: 'On Hand', 
        value: summary.totalOnHand.toLocaleString()
      },
      { 
        label: 'Available', 
        value: summary.totalAvailable.toLocaleString()
      },
      { 
        label: 'Stock Value', 
        value: `$${(summary.totalValuation || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      },
      { 
        label: 'Low Stock', 
        value: lowStockItems.toLocaleString(),
        change: lowStockItems > 0 ? `-${lowStockItems}` : null
      },
      { 
        label: 'Out of Stock', 
        value: outOfStockItems.toLocaleString(),
        change: outOfStockItems > 0 ? `-${outOfStockItems}` : null
      }
    ];
  }, [summary, rows]);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStockSummaryReport({});
      setRows(data.items || []);
      setSummary(data.summary || { 
        totalParts: 0, 
        totalOnHand: 0, 
        totalAvailable: 0, 
        totalValuation: 0 
      });
    } catch (e) {
      setRows([]);
      setSummary({ totalParts: 0, totalOnHand: 0, totalAvailable: 0, totalValuation: 0 });
      console.error('Failed to fetch report', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const getStatusBadge = (item) => {
    const available = item.available || 0;
    const reorderLevel = item.reorderLevel || 0;
    
    if (available === 0) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30">
            Out of Stock
          </span>
        </div>
      );
    } else if (available <= reorderLevel) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30">
            Low Stock
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30">
            In Stock
          </span>
        </div>
      );
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'partCode', 
      label: 'Part Code',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <div className="font-mono text-sm font-semibold text-white">{row.partCode}</div>
            <div className="text-xs text-slate-400">Part ID</div>
          </div>
        </div>
      )
    },
    { 
      key: 'name', 
      label: 'Part Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-white text-sm">{row.name}</div>
          {row.description && (
            <div className="text-xs text-slate-400 mt-1 line-clamp-2">{row.description}</div>
          )}
        </div>
      )
    },
    { 
      key: 'category', 
      label: 'Category',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
          {row.category}
        </span>
      )
    },
    { 
      key: 'onHand', 
      label: 'On Hand',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {(row.onHand || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">units</div>
        </div>
      )
    },
    { 
      key: 'reserved', 
      label: 'Reserved',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-300">
            {(row.reserved || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">units</div>
        </div>
      )
    },
    { 
      key: 'available', 
      label: 'Available',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-400">
            {(row.available || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">units</div>
        </div>
      )
    },
    { 
      key: 'reorderLevel', 
      label: 'Reorder Level',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-semibold text-orange-400">
            {(row.reorderLevel || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">threshold</div>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (row) => getStatusBadge(row)
    },
    { 
      key: 'unitPrice', 
      label: 'Unit Price',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">
            ${(row.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400">per unit</div>
        </div>
      )
    },
    { 
      key: 'value', 
      label: 'Total Value',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">
            ${(row.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400">total</div>
        </div>
      )
    },
  ], []);

  const handleExport = async (type) => {
    try {
      setExportLoading(true);
      const resp = type === 'csv' 
        ? await downloadStockSummaryCSV({}) 
        : await downloadStockSummaryPDF({});
      
      const blob = new Blob([resp.data], { 
        type: type === 'csv' ? 'text/csv' : 'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-summary-${new Date().toISOString().split('T')[0]}.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setExportLoading(false);
    }
  };


  const InventoryIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative app-container space-y-8">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-xl border border-slate-600/50 shadow-2xl">
          {/* Header Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-full translate-y-24 -translate-x-24"></div>
          </div>
          
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30">
                  <InventoryIcon />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Stock Summary Report</h1>
                  <p className="text-slate-300 text-lg">Comprehensive inventory overview with current levels, valuations, and stock status</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchReport}
                  disabled={loading}
                  className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                        {stat.label}
                      </div>
                      {stat.change && (
                        <div className={`text-xs font-medium ${
                          stat.change.startsWith('+') ? 'text-green-400' : 
                          stat.change.startsWith('-') ? 'text-red-400' : 
                          'text-slate-400'
                        }`}>
                          {stat.change}
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-white group-hover:text-white/90 transition-colors duration-300">
                      {stat.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Enhanced Export Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Export Options</h3>
          </div>
          <ExportActions 
            onExport={handleExport}
            loading={exportLoading}
          />
        </div>

        {/* Enhanced Data Table */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border border-slate-600/50 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 to-slate-400/5"></div>
          <div className="relative">
            <EnhancedDataTable
              columns={columns}
              data={rows}
              loading={loading}
              emptyMessage="No inventory data found. Please check your inventory setup."
              showExport={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

