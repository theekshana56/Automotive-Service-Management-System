import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ReportHeader from './ReportHeader';
import FilterPanel from './FilterPanel';
import EnhancedDataTable from './EnhancedDataTable';
import ExportActions from './ExportActions';
import api, { getStockSummaryReport, downloadStockSummaryCSV, downloadStockSummaryPDF } from '../../services/inventoty/api';

export default function EnhancedStockSummaryReport() {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ 
    totalParts: 0, 
    totalOnHand: 0, 
    totalAvailable: 0, 
    totalValuation: 0 
  });

  // Filters
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [category, setCategory] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const fetchMasterData = useCallback(async () => {
    try {
      const [catsRes, suppRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/suppliers', { params: { showAll: true, limit: 1000 } })
      ]);
      
      const cats = (catsRes.data || []).map(c => ({ 
        value: c.name || c._id, 
        label: c.name || c.displayName || 'Category' 
      }));
      
      const suppliers = (suppRes.data.suppliers || suppRes.data.items || suppRes.data || [])
        .map(s => ({ 
          value: s._id, 
          label: s.companyName || s.displayName || s.name 
        }));
      
      setCategoryOptions(cats);
      setSupplierOptions(suppliers);
    } catch (e) {
      console.error('Failed to load master data for filters', e);
    }
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (supplierId) params.supplierId = supplierId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const data = await getStockSummaryReport(params);
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
  }, [category, supplierId, startDate, endDate]);

  useEffect(() => {
    fetchMasterData();
    fetchReport();
  }, [fetchMasterData]);

  const getStatusBadge = (item) => {
    const available = item.available || 0;
    const reorderLevel = item.reorderLevel || 0;
    
    if (available === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
          Out of Stock
        </span>
      );
    } else if (available <= reorderLevel) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
          In Stock
        </span>
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
          <div className="w-8 h-8 rounded-lg bg-accent2/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-accent2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <span className="font-mono text-sm font-medium text-slate-200">{row.partCode}</span>
        </div>
      )
    },
    { 
      key: 'name', 
      label: 'Part Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-slate-200">{row.name}</div>
          {row.description && (
            <div className="text-xs text-slate-500 mt-1">{row.description}</div>
          )}
        </div>
      )
    },
    { 
      key: 'category', 
      label: 'Category',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
          {row.category}
        </span>
      )
    },
    { 
      key: 'onHand', 
      label: 'On Hand',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-100">
          {(row.onHand || 0).toLocaleString()}
        </span>
      )
    },
    { 
      key: 'reserved', 
      label: 'Reserved',
      sortable: true,
      render: (row) => (
        <span className="text-slate-300">
          {(row.reserved || 0).toLocaleString()}
        </span>
      )
    },
    { 
      key: 'available', 
      label: 'Available',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-accent">
          {(row.available || 0).toLocaleString()}
        </span>
      )
    },
    { 
      key: 'reorderLevel', 
      label: 'Reorder Level',
      sortable: true,
      render: (row) => (row.reorderLevel || 0).toLocaleString()
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
      render: (row) => `$${(row.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'value', 
      label: 'Total Value',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-100">
          ${(row.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
  ], []);

  const handleExport = async (type) => {
    try {
      setExportLoading(true);
      const params = {};
      if (category) params.category = category;
      if (supplierId) params.supplierId = supplierId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const resp = type === 'csv' 
        ? await downloadStockSummaryCSV(params) 
        : await downloadStockSummaryPDF(params);
      
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

  const filters = [
    {
      key: 'category',
      label: 'Category',
      value: category,
      options: categoryOptions,
      placeholder: 'All Categories'
    },
    {
      key: 'supplierId',
      label: 'Supplier',
      value: supplierId,
      options: supplierOptions,
      placeholder: 'All Suppliers'
    }
  ];

  const handleFilterChange = (key, value) => {
    if (key === 'category') setCategory(value);
    if (key === 'supplierId') setSupplierId(value);
  };

  const handleDateRangeChange = (dateRange) => {
    setStartDate(dateRange.startDate);
    setEndDate(dateRange.endDate);
  };

  const handleClearFilters = () => {
    setCategory('');
    setSupplierId('');
    setStartDate('');
    setEndDate('');
  };

  const InventoryIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  return (
    <div className="min-h-screen w-full bg-app">
      <div className="app-container space-y-6">
        {/* Header */}
        <ReportHeader
          title="Stock Summary Report"
          description="Comprehensive inventory overview with current levels, valuations, and stock status"
          stats={stats}
          icon={InventoryIcon}
          actions={[
            {
              label: 'Refresh Data',
              onClick: fetchReport,
              variant: 'secondary',
              icon: () => (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
          emptyMessage="No inventory data found for the selected filters. Try adjusting your category, supplier, or date range selection."
          showExport={false}
        />
      </div>
    </div>
  );
}