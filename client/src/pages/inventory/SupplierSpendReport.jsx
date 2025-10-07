import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FilterPanel from '../../components/inventory/FilterPanel';
import EnhancedDataTable from '../../components/inventory/EnhancedDataTable';
import ExportActions from '../../components/inventory/ExportActions';
import api, { getSupplierSpendReport, downloadSupplierSpendCSV, downloadSupplierSpendPDF } from '../../services/inventoty/api';

export default function SupplierSpendReport() {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [supplierId, setSupplierId] = useState('');

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalAmount = rows.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalOrders = rows.reduce((sum, r) => sum + (r.totalOrders || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;
    const activeSuppliers = rows.length;

    return [
      { label: 'Total Spend', value: `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { label: 'Total Orders', value: totalOrders.toLocaleString() },
      { label: 'Avg Order Value', value: `$${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { label: 'Active Suppliers', value: activeSuppliers.toLocaleString() }
    ];
  }, [rows]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const resp = await api.get('/api/suppliers', { params: { showAll: true, limit: 1000 } });
      const items = resp.data.suppliers || resp.data.items || resp.data || [];
      setSupplierOptions(items.map(s => ({ value: s._id, label: s.companyName || s.displayName || s.name })));
    } catch (e) {
      console.error('Failed to load suppliers', e);
    }
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (supplierId) params.supplierId = supplierId;
      const data = await getSupplierSpendReport(params);
      setRows(data.rows || []);
    } catch (e) {
      setRows([]);
      console.error('Failed to fetch report', e);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchSuppliers();
    fetchReport();
  }, [fetchSuppliers, fetchReport]);

  const columns = useMemo(() => [
    { 
      key: 'companyName', 
      label: 'Supplier',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {(row.companyName || '').charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-slate-200">{row.companyName}</span>
        </div>
      )
    },
    { 
      key: 'totalOrders', 
      label: 'Orders',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent">
          {(row.totalOrders || 0).toLocaleString()}
        </span>
      )
    },
    { 
      key: 'totalAmount', 
      label: 'Total Spend',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-100">
          ${(row.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: 'avgOrderValue', 
      label: 'Avg Order',
      sortable: true,
      render: (row) => `$${(row.avgOrderValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'minOrderValue', 
      label: 'Min Order',
      sortable: true,
      render: (row) => `$${(row.minOrderValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'maxOrderValue', 
      label: 'Max Order',
      sortable: true,
      render: (row) => `$${(row.maxOrderValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'firstOrderDate', 
      label: 'First Order',
      sortable: true,
      render: (row) => row.firstOrderDate 
        ? new Date(row.firstOrderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '-'
    },
    { 
      key: 'lastOrderDate', 
      label: 'Last Order',
      sortable: true,
      render: (row) => row.lastOrderDate 
        ? new Date(row.lastOrderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '-'
    },
  ], []);

  const handleExport = async (type) => {
    try {
      setExportLoading(true);
      const params = {};
      if (supplierId) params.supplierId = supplierId;

      const resp = type === 'csv' 
        ? await downloadSupplierSpendCSV(params) 
        : await downloadSupplierSpendPDF(params);

      const blob = new Blob([resp.data], { type: type === 'csv' ? 'text/csv' : 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supplier-spend-${new Date().toISOString().split('T')[0]}.${type}`;
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

  const filters = [
    { 
      key: 'supplierId', 
      label: 'Supplier', 
      value: supplierId, 
      options: supplierOptions, 
      placeholder: 'All Suppliers' 
    }
  ];

  const handleFilterChange = (key, value) => {
    if (key === 'supplierId') setSupplierId(value);
  };

  const handleClearFilters = () => {
    setSupplierId('');
  };

  const ChartIcon = () => (
    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  return (
    <div className="min-h-screen w-full bg-app">
      <div className="app-container space-y-6">

        {/* Header - Fully Responsive */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-4">
            <ChartIcon />
            <div>
              <h1 className="text-2xl font-bold text-slate-200">Supplier Spend Analysis</h1>
              <p className="text-sm text-slate-400">Comprehensive spending analysis by supplier with detailed order metrics</p>
            </div>
          </div>

          {/* Middle: Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, idx) => (
              <div key={idx} className="bg-slate-800/60 p-4 rounded-lg text-center">
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-lg font-semibold text-slate-100">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="mt-4 md:mt-0 flex gap-2">
            <button 
              onClick={fetchReport} 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 rounded-lg shadow-xl border border-slate-700">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onApplyFilters={fetchReport}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Export Actions */}
        <div className="flex justify-end">
          <ExportActions 
            onExport={handleExport}
            loading={exportLoading}
          />
        </div>

        {/* Data Table */}
        <EnhancedDataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyMessage="No supplier spend data found for the selected supplier. Try selecting a different supplier."
          showExport={false}
        />
      </div>
    </div>
  );
}
