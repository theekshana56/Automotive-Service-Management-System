import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SupplierListTable from "../../components/inventory/SupplierListTable";
import Pagination from "../../components/ui/Pagination";
import api from "../../api/client";

export default function SuppliersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const [suppliersData, setSuppliersData] = useState({
    items: [],
    total: 0,
    page: 1,
    pages: 1,
  });

  // Debounce search query
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setSearchLoading(true);
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery]);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
      });
      if (debouncedSearchQuery) params.append("q", debouncedSearchQuery);
      if (statusFilter) params.append("status", statusFilter);
      if (activeFilter === "all") params.append("showAll", "true");
      else params.append("isActive", activeFilter === "active");

      const response = await api.get(`/api/suppliers?${params}`);
      const data = response.data;
      setSuppliersData({
        items: data.suppliers || data.items || [],
        total: data.total || 0,
        page: currentPage,
        pages: data.pages || data.pagination?.totalPages || 1,
      });
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setSuppliersData({
        items: [],
        total: 0,
        page: 1,
        pages: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, statusFilter, activeFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleFilterChange = (key, value) => {
    if (key === "status") setStatusFilter(value);
    if (key === "active") setActiveFilter(value);
    setCurrentPage(1);
  };

  const handleEdit = (supplier) => navigate(`/suppliers/${supplier._id}/edit`);
  const handleDeactivate = async (supplier) => {
    if (!window.confirm(`Are you sure you want to deactivate "${supplier.companyName}"?`)) return;
    try {
      setLoading(true);
      await api.delete(`/api/suppliers/${supplier._id}`);
      fetchSuppliers();
    } catch (e) {
      console.error("Failed to deactivate supplier", e);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full bg-app flex flex-col">
      {/* Header + Quick Stats */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Suppliers Management</h1>
            <p className="text-slate-400">
              Manage your supplier relationships and contact information
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <span>Total: <strong className="text-slate-100">{suppliersData.total}</strong></span>
            <span>Active: <strong className="text-green-400">{suppliersData.items.filter(s => s.isActive).length}</strong></span>
            <span>Inactive: <strong className="text-slate-400">{suppliersData.items.filter(s => !s.isActive).length}</strong></span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="card p-4 text-center hover:shadow-lg transition">
            <div className="text-2xl font-bold text-blue-400 mb-1">{suppliersData.total}</div>
            <div className="text-sm text-slate-400">Total Suppliers</div>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition">
            <div className="text-2xl font-bold text-green-400 mb-1">{suppliersData.items.filter(s => s.isActive).length}</div>
            <div className="text-sm text-slate-400">Active Suppliers</div>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition">
            <div className="text-2xl font-bold text-slate-400 mb-1">{suppliersData.items.filter(s => !s.isActive).length}</div>
            <div className="text-sm text-slate-400">Inactive Suppliers</div>
          </div>
        </div>
      </div>

      {/* Custom Search and Filter Bar */}
      <div className="px-8 mt-6">
        <div className="card p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {searchLoading ? (
                    <svg
                      className="h-5 w-5 text-slate-400 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  )}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search suppliers by company name, contact, email, phone, address, or any field..."
                  className="input pl-10 w-full lg:w-96"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="select min-w-[120px]"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Add New Supplier Button */}
              <button
                onClick={() => navigate("/suppliers/new")}
                className="btn-primary whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add New Supplier
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || statusFilter) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm text-slate-600">Active filters:</span>
                {searchQuery && (
                  <span className="badge bg-blue-100 text-blue-800">
                    Search: "{searchQuery}"
                  </span>
                )}
                {statusFilter && (
                  <span className="badge bg-purple-100 text-purple-800">
                    Status: {statusFilter}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                  setCurrentPage(1);
                }}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active / Inactive / All Chips */}
      <div className="flex items-center gap-2 px-8 mb-6">
        {["all", "active", "inactive"].map((status) => (
          <button
            key={status}
            onClick={() => handleFilterChange("active", status)}
            className={`badge ${activeFilter === status ? "chip-accent" : ""}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Suppliers Table */}
      <div className="flex-1 flex flex-col px-8 mt-6">
        <div className="card mb-6 flex-1 flex flex-col overflow-hidden">
          <div className="card-body p-0 flex-1 flex flex-col">
            {suppliersData.items.length > 0 ? (
              <SupplierListTable
                data={suppliersData}
                loading={loading}
                onEdit={handleEdit}
                onDeactivate={handleDeactivate}
                onActivate={async (supplier) => {
                  if (!window.confirm(`Activate "${supplier.companyName}"?`)) return;
                  try {
                    setLoading(true);
                    await api.patch(`/api/suppliers/${supplier._id}/activate`);
                    fetchSuppliers();
                  } finally { setLoading(false); }
                }}
                onDelete={async (supplier) => {
                  if (!window.confirm(`Permanently delete "${supplier.companyName}"?`)) return;
                  try {
                    setLoading(true);
                    await api.delete(`/api/suppliers/${supplier._id}/hard`);
                    fetchSuppliers();
                  } finally { setLoading(false); }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <p>No suppliers found.</p>
                <button
                  onClick={() => navigate("/suppliers/new")}
                  className="btn-primary mt-4"
                >
                  Add New Supplier
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {suppliersData.pages > 1 && (
            <div className="border-t px-4 py-3 bg-slate-900">
              <Pagination
                currentPage={currentPage}
                totalPages={suppliersData.pages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
