import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchFilterBar from '../../components/ui/SearchFilterBar';
import SupplierListTable from '../../components/inventory/SupplierListTable';
import Pagination from '../../components/ui/Pagination';
import api from '../../api/client';

export default function SuppliersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all');
  const [suppliersData, setSuppliersData] = useState({
    items: [],
    total: 0,
    page: 1,
    pages: 1
  });

  const fetchSuppliers = useCallback(async () => {
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
      if (activeFilter !== 'all') {
        params.append('isActive', activeFilter === 'active');
      }
      
      const response = await api.get(`/api/suppliers?${params}`);
      const data = response.data;
      setSuppliersData({
        items: data.suppliers || data.items || [],
        total: data.total || 0,
        page: currentPage,
        pages: data.pagination?.totalPages || 1
      });
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setSuppliersData({
        items: [],
        total: 0,
        page: 1,
        pages: 1
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  const handleFilterChange = (key, value) => {
    if (key === 'status') setStatusFilter(value);
    if (key === 'active') setActiveFilter(value);
    setCurrentPage(1);
    fetchSuppliers();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSuppliers();
  };

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleEdit = (supplier) => {
    navigate(`/suppliers/${supplier._id}/edit`);
  };

  const handleDeactivate = async (supplier) => {
    if (window.confirm(`Are you sure you want to deactivate "${supplier.name}"?`)) {
      console.log('Deactivating supplier:', supplier._id);
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
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  const actions = [
    {
      label: 'Add New Supplier',
      icon: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: () => navigate('/suppliers/new'),
      className: 'btn-primary'
    },
    {
      label: 'Import',
      icon: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      onClick: () => console.log('Import suppliers'),
      className: 'btn-secondary'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-app flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-8 pt-8">
        <div>
          <h1 className="section-title mb-2">Suppliers Management</h1>
          <p className="text-slate-400">
            Manage your supplier relationships and contact information
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Total: <strong className="text-slate-200">{suppliersData.total}</strong></span>
          <span>Active: <strong className="text-green-400">{suppliersData.items.filter(s => s.isActive).length}</strong></span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-8">
        <SearchFilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search suppliers by name, email, or contact person..."
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

      {/* Suppliers Table */}
      <div className="flex-1 flex flex-col px-8">
        <div className="card mb-6 flex-1 flex flex-col">
          <div className="card-body p-0 flex-1 flex flex-col">
            <SupplierListTable
              data={suppliersData}
              onEdit={handleEdit}
              onDeactivate={handleDeactivate}
              onActivate={async (supplier) => {
                if (!window.confirm(`Activate "${supplier.name}"?`)) return;
                try {
                  setLoading(true);
                  await api.patch(`/api/suppliers/${supplier._id}/activate`);
                  fetchSuppliers();
                } catch (e) {
                  console.error('Failed to activate supplier', e);
                } finally {
                  setLoading(false);
                }
              }}
              onDelete={async (supplier) => {
                if (!window.confirm(`Permanently delete "${supplier.name}"? This cannot be undone.`)) return;
                try {
                  setLoading(true);
                  await api.delete(`/api/suppliers/${supplier._id}/hard`);
                  fetchSuppliers();
                } catch (e) {
                  console.error('Failed to delete supplier', e);
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
            totalPages={suppliersData.pages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {suppliersData.total}
              </div>
              <div className="text-slate-400 mb-4">Total Suppliers</div>
              <div className="flex justify-center">
                <svg className="w-8 h-8 text-blue-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {suppliersData.items.filter(s => s.isActive).length}
              </div>
              <div className="text-slate-400 mb-4">Active Suppliers</div>
              <div className="flex justify-center">
                <svg className="w-8 h-8 text-green-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="text-3xl font-bold text-slate-400 mb-2">
                {suppliersData.items.filter(s => !s.isActive).length}
              </div>
              <div className="text-slate-400 mb-4">Inactive Suppliers</div>
              <div className="flex justify-center">
                <svg className="w-8 h-8 text-slate-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}