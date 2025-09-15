import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchFilterBar from '../../components/ui/SearchFilterBar';
import PartListTable from '../../components/inventory/PartListTable';
import Pagination from '../../components/ui/Pagination';
import api from '../../api/client';

export default function PartsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all'); // all | active | inactive
  const [partsData, setPartsData] = useState({
    items: [],
    total: 0,
    lowStockCount: 0,
    page: 1,
    pages: 1
  });

  const fetchParts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      if (activeFilter !== 'all') {
        params.append('isActive', activeFilter === 'active');
      }
      
      const response = await api.get(`/api/parts?${params}`);
      const data = response.data;
      setPartsData({
        items: data.parts || data.items || [],
        total: data.total || 0,
        lowStockCount: data.lowStockCount || 0,
        page: currentPage,
        pages: data.pagination?.totalPages || 1
      });
    } catch (err) {
      console.error('Error fetching parts:', err);
      setPartsData({
        items: [],
        total: 0,
        lowStockCount: 0,
        page: 1,
        pages: 1
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, categoryFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchParts();
  };

  const handleFilterChange = (key, value) => {
    if (key === 'status') setStatusFilter(value);
    if (key === 'category') setCategoryFilter(value);
    if (key === 'active') setActiveFilter(value);
    setCurrentPage(1);
    fetchParts();
  };

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleEdit = (part) => {
    navigate(`/parts/${part._id}/edit`);
  };

  const handleDeactivate = async (part) => {
    if (window.confirm(`Are you sure you want to deactivate "${part.name}"?`)) {
      // Simulate API call
      try {
        setLoading(true);
        await api.delete(`/api/parts/${part._id}`);
        fetchParts();
      } catch (e) {
        console.error('Failed to deactivate part', e);
      } finally {
        setLoading(false);
      }
    }
  };

  const filters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      placeholder: 'All Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'low_stock', label: 'Low Stock' }
      ]
    },
    {
      key: 'category',
      label: 'Category',
      value: categoryFilter,
      placeholder: 'All Categories',
      options: [
        { value: 'brakes', label: 'Brakes' },
        { value: 'filters', label: 'Filters' },
        { value: 'engines', label: 'Engines' },
        { value: 'electrical', label: 'Electrical' }
      ]
    }
  ];

  const actions = [
    {
      label: 'Add New Part',
      icon: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: () => navigate('/parts/new'),
      className: 'btn-primary'
    },
    {
      label: 'Show Inactive',
      icon: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      onClick: async () => {
        try {
          setLoading(true);
          const params = new URLSearchParams({ page: 1, limit: 10, isActive: false });
          const response = await api.get(`/api/parts?${params}`);
          const data = response.data;
          setPartsData({
            items: data.items || [],
            total: data.total || 0,
            lowStockCount: data.lowStockCount || 0,
            page: 1,
            pages: data.pages || 1
          });
        } catch (e) {
          console.error('Failed to load inactive parts', e);
        } finally {
          setLoading(false);
        }
      },
      className: 'btn-secondary'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-app flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-8 pt-8">
        <div>
          <h1 className="section-title mb-2">Parts Inventory</h1>
          <p className="text-slate-400">
            Manage your automotive parts inventory and stock levels
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Total: <strong className="text-slate-200">{partsData.total}</strong></span>
          {partsData.lowStockCount > 0 && (
            <span className="text-yellow-400">
              • Low Stock: <strong>{partsData.lowStockCount}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-8">
        <SearchFilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search parts by name, code, or category..."
          filters={filters}
          onFilterChange={handleFilterChange}
          actions={actions}
          className="mb-6"
        />

        {/* Availability chips */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => handleFilterChange('active', 'all')}
            className={`badge ${activeFilter === 'all' ? 'chip-accent' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('active', 'active')}
            className={`badge ${activeFilter === 'active' ? 'chip-accent' : ''}`}
          >
            Active
          </button>
          <button
            onClick={() => handleFilterChange('active', 'inactive')}
            className={`badge ${activeFilter === 'inactive' ? 'chip-accent' : ''}`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Parts Table */}
      <div className="flex-1 flex flex-col px-8">
        <div className="card mb-6 flex-1 flex flex-col">
          <div className="card-body p-0 flex-1 flex flex-col">
            <PartListTable
              data={partsData}
              onEdit={handleEdit}
              onDeactivate={handleDeactivate}
              onActivate={async (part) => {
                if (!window.confirm(`Activate "${part.name}"?`)) return;
                try {
                  setLoading(true);
                  await api.patch(`/api/parts/${part._id}/activate`);
                  fetchParts();
                } catch (e) {
                  console.error('Failed to activate part', e);
                } finally {
                  setLoading(false);
                }
              }}
              onDelete={async (part) => {
                if (!window.confirm(`Permanently delete "${part.name}"? This cannot be undone.`)) return;
                try {
                  setLoading(true);
                  await api.delete(`/api/parts/${part._id}/hard`);
                  fetchParts();
                } catch (e) {
                  console.error('Failed to delete part', e);
                } finally {
                  setLoading(false);
                }
              }}
              loading={loading}
            />
          </div>
        </div>

        {/* Pagination */}
        <div className="mb-8">
          <Pagination
            currentPage={currentPage}
            totalPages={partsData.pages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {partsData.total}
            </div>
            <div className="text-sm text-slate-400">Total Parts</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {partsData.total - partsData.lowStockCount}
            </div>
            <div className="text-sm text-slate-400">In Stock</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {partsData.lowStockCount}
            </div>
            <div className="text-sm text-slate-400">Low Stock</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-slate-400 mb-1">
              {Math.round(partsData.total * 0.95)}
            </div>
            <div className="text-sm text-slate-400">Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}