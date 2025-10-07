import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReportHeader from './ReportHeader';
import FilterPanel from './FilterPanel';
import EnhancedDataTable from './EnhancedDataTable';
import ExportActions from './ExportActions';
import api, { getSupplierSpendReport, downloadSupplierSpendCSV, downloadSupplierSpendPDF } from '../../services/inventoty/api';

export default function EnhancedSupplierSpendReport() {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
      setSupplierOptions(items.map(s => ({ 
        value: s._id, 
        label: s.companyName || s.displayName || s.name 
      })));
    } catch (e) {
      console.error('Failed to load suppliers', e);
    }
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (supplierId) params.supplierId = supplierId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await getSupplierSpendReport(params);
      setRows(data.rows || []);
    } catch (e) {
      setRows([]);
      console.error('Failed to fetch report', e);
    } finally {
      setLoading(false);
    }
  }, [supplierId, startDate, endDate]);

  useEffect(() => {
    fetchSuppliers();
    fetchReport();
  }, [fetchSuppliers]);

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
        ? new Date(row.firstOrderDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
        : '-'
    },
    { 
      key: 'lastOrderDate', 
      label: 'Last Order',
      sortable: true,
      render: (row) => row.lastOrderDate 
        ? new Date(row.lastOrderDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
        : '-'
    },
  ], []);

  const handleExport = async (type) => {
    try {
      setExportLoading(true);
      const params = {};
      if (supplierId) params.supplierId = supplierId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const resp = type === 'csv' 
        ? await downloadSupplierSpendCSV(params) 
        : await downloadSupplierSpendPDF(params);
      
      const blob = new Blob([resp.data], { 
        type: type === 'csv' ? 'text/csv' : 'application/pdf' 
      });
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

  const handleDateRangeChange = (dateRange) => {
    setStartDate(dateRange.startDate);
    setEndDate(dateRange.endDate);
  };

  const handleClearFilters = () => {
    setSupplierId('');
    setStartDate('');
    setEndDate('');
  };

  const ChartIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  return (
    <div className="min-h-screen w-full bg-app">
      <div className="app-container space-y-6">
        {/* Header */}
        <ReportHeader
          title="Supplier Spend Analysis"
          description="Comprehensive spending analysis by supplier with detailed order metrics"
          stats={stats}
          icon={ChartIcon}
          actions={[
            {
              label: 'Export Report',
              onClick: () => {},
              variant: 'secondary',
              icon: () => (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                </svg>
              )
            }
          ]}
        />

        {/* Filters */}
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          dateRange={{ startDate, endDate }}
          onDateRangeChange={handleDateRangeChange}
          onApplyFilters={fetchReport}
          onClearFilters={handleClearFilters}
        />

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
          emptyMessage="No supplier spend data found for the selected filters. Try adjusting your date range or supplier selection."
          showExport={false}
        />
      </div>
    </div>
  );
}