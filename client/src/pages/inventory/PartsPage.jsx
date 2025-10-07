import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PartListTable from "../../components/inventory/PartListTable";
import Pagination from "../../components/ui/Pagination";
import api from "../../api/client";

export default function PartsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all"); // all | active | inactive
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [partsData, setPartsData] = useState({
    items: [],
    total: 0,
    lowStockCount: 0,
    page: 1,
    pages: 1,
  });
  
  // Separate KPI data that doesn't change with filters
  const [kpiData, setKpiData] = useState({
    totalParts: 0,
    lowStockCount: 0,
    activeParts: 0,
    inactiveParts: 0,
  });

  // Fetch KPI data (always shows all parts regardless of filters)
  const fetchKpiData = useCallback(async () => {
    try {
      const response = await api.get('/api/parts?showAll=true&limit=1000');
      const data = response.data;
      const allParts = data.parts || data.items || [];
      
      const totalParts = allParts.length;
      const lowStockCount = allParts.filter(part => {
        const stock = part.stock || {};
        const onHand = stock.onHand || 0;
        const reorderLevel = stock.reorderLevel || 0;
        return onHand <= reorderLevel;
      }).length;
      
      const activeParts = allParts.filter(part => part.isActive !== false).length;
      const inactiveParts = allParts.filter(part => part.isActive === false).length;
      
      setKpiData({
        totalParts,
        lowStockCount,
        activeParts,
        inactiveParts,
      });
    } catch (err) {
      console.error("Error fetching KPI data:", err);
    }
  }, []);

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

  const fetchParts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
      });

      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);
      if (statusFilter) params.append("status", statusFilter);
      if (categoryFilter) params.append("category", categoryFilter);
      if (activeFilter === "all") {
        params.append("showAll", "true");
      } else {
        params.append("isActive", activeFilter === "active");
      }

      const response = await api.get(`/api/parts?${params}`);
      const data = response.data;
      setPartsData({
        items: data.parts || data.items || [],
        total: data.total || 0,
        lowStockCount: data.lowStockCount || 0,
        page: currentPage,
        pages: data.pages || data.pagination?.totalPages || 1,
      });
    } catch (err) {
      console.error("Error fetching parts:", err);
      setPartsData({
        items: [],
        total: 0,
        lowStockCount: 0,
        page: 1,
        pages: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, statusFilter, categoryFilter, activeFilter]);

  useEffect(() => {
    fetchParts();
    fetchKpiData();
  }, [fetchParts, fetchKpiData]);

  const handleFilterChange = (key, value) => {
    if (key === "status") setStatusFilter(value);
    if (key === "category") setCategoryFilter(value);
    if (key === "active") setActiveFilter(value);
    setCurrentPage(1);
    fetchParts();
  };

  const handleDeactivate = async (part) => {
    if (
      window.confirm(`Are you sure you want to deactivate "${part.name}"?`)
    ) {
      try {
        setLoading(true);
        await api.delete(`/api/parts/${part._id}`);
        fetchParts();
        fetchKpiData(); // Refresh KPI data
      } catch (e) {
        console.error("Failed to deactivate part", e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleActivate = async (part) => {
    if (
      window.confirm(`Are you sure you want to activate "${part.name}"?`)
    ) {
      try {
        setLoading(true);
        await api.patch(`/api/parts/${part._id}/reactivate`);
        fetchParts();
        fetchKpiData(); // Refresh KPI data
      } catch (e) {
        console.error("Failed to activate part", e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (part) => {
    if (
      window.confirm(`Are you sure you want to permanently delete "${part.name}"? This action cannot be undone.`)
    ) {
      try {
        setLoading(true);
        await api.delete(`/api/parts/${part._id}/hard`);
        fetchParts();
      } catch (e) {
        console.error("Failed to delete part", e);
      } finally {
        setLoading(false);
      }
    }
  };


  return (
    <div className="min-h-screen w-full bg-app flex flex-col">
      {/* Header + Quick Stats */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Parts Inventory
            </h1>
            <p className="text-slate-400">
              Manage your automotive parts inventory and stock levels
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <span>
              Total: <strong className="text-slate-100">{partsData.total}</strong>
            </span>
            {partsData.lowStockCount > 0 && (
              <span className="text-yellow-400">
                • Low Stock: <strong>{partsData.lowStockCount}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="card p-4 text-center hover:shadow-lg transition">
            <svg
              className="mx-auto w-6 h-6 text-blue-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" />
            </svg>
            <div className="text-2xl font-bold text-blue-400 mb-1">{kpiData.totalParts}</div>
            <div className="text-sm text-slate-400">Total Parts</div>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition">
            <svg
              className="mx-auto w-6 h-6 text-green-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-2xl font-bold text-green-400 mb-1">{kpiData.totalParts - kpiData.lowStockCount}</div>
            <div className="text-sm text-slate-400">In Stock</div>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition">
            <svg
              className="mx-auto w-6 h-6 text-yellow-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
            <div className="text-2xl font-bold text-yellow-400 mb-1">{kpiData.lowStockCount}</div>
            <div className="text-sm text-slate-400">Low Stock</div>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition">
            <svg
              className="mx-auto w-6 h-6 text-green-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-2xl font-bold text-green-400 mb-1">{kpiData.activeParts}</div>
            <div className="text-sm text-slate-400">Active</div>
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
                  placeholder="Search parts by name, code, or category..."
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

            {/* Category Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                  Category:
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="select min-w-[140px]"
                >
                  <option value="">All Categories</option>
                  <option value="brakes">Brakes</option>
                  <option value="filters">Filters</option>
                  <option value="engines">Engines</option>
                  <option value="electrical">Electrical</option>
                </select>
              </div>

              {/* Status Filter */}
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
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>

              {/* Add New Part Button */}
              <button
                onClick={() => navigate("/parts/new")}
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
                Add New Part
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || categoryFilter || statusFilter) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm text-slate-600">Active filters:</span>
                {searchQuery && (
                  <span className="badge bg-blue-100 text-blue-800">
                    Search: "{searchQuery}"
                  </span>
                )}
                {categoryFilter && (
                  <span className="badge bg-green-100 text-green-800">
                    Category: {categoryFilter}
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
                  setCategoryFilter("");
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
        <button
          onClick={() => handleFilterChange("active", "all")}
          className={`badge ${activeFilter === "all" ? "chip-accent" : ""}`}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange("active", "active")}
          className={`badge ${activeFilter === "active" ? "chip-accent" : ""}`}
        >
          Active
        </button>
        <button
          onClick={() => handleFilterChange("active", "inactive")}
          className={`badge ${activeFilter === "inactive" ? "chip-accent" : ""}`}
        >
          Inactive
        </button>
      </div>

      {/* Parts Table */}
      <div className="flex-1 flex flex-col px-8 mt-6">
        <div className="card mb-6 flex-1 flex flex-col overflow-hidden">
          <div className="card-body p-0 flex-1 flex flex-col">
            {partsData.items.length > 0 ? (
              <PartListTable
                data={partsData}
                loading={loading}
                onEdit={(part) => navigate(`/parts/${part._id}/edit`)}
                onDeactivate={handleDeactivate}
                onActivate={handleActivate}
                onDelete={handleDelete}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <svg
                  className="w-12 h-12 mb-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" />
                </svg>
                <p>No parts found.</p>
                <button
                  onClick={() => navigate("/parts/new")}
                  className="btn-primary mt-4"
                >
                  Add New Part
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {partsData.pages > 1 && (
            <div className="border-t px-4 py-3 bg-slate-900">
              <Pagination
                currentPage={currentPage}
                totalPages={partsData.pages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
