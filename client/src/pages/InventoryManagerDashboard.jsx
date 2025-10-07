import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import NotificationBell from '../components/inventory/NotificationBell';
import PartListTable from '../components/inventory/PartListTable';
import api from '../api/client';
// Utility function for formatting currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount || 0);
};

export default function InventoryManagerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      parts: 156,
      lowStock: 8,
      suppliers: 12,
      purchaseOrdersValue: 15420.50,
      poCount: 23
    },
    recentParts: [],
    lowStockParts: [],
    recentSuppliers: [],
    auditSummary: {
      totalLogs: 45,
      recentActivity: 12
    }
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const [partsResponse, suppliersResponse, lowStockResponse, recentPartsResponse] = await Promise.all([
        api.get('/api/parts?limit=5'),
        api.get('/api/suppliers?limit=3'),
        api.get('/api/parts/low-stock'),
        api.get('/api/parts?limit=5')
      ]);

      const partsData = partsResponse.data;
      const suppliersData = suppliersResponse.data;
      const lowStockData = lowStockResponse.data;
      const recentPartsData = recentPartsResponse.data;

      setDashboardData(prev => ({
        ...prev,
        stats: {
          parts: partsData.total || 0,
          lowStock: lowStockData.items?.length || 0,
          suppliers: suppliersData.total || 0,
          purchaseOrdersValue: 15420.50, // This would need a separate API call
          poCount: 23 // This would need a separate API call
        },
        recentParts: recentPartsData.parts || recentPartsData.items || [],
        lowStockParts: lowStockData.items || [],
        recentSuppliers: suppliersData.suppliers || suppliersData.items || []
      }));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-app flex flex-col items-center justify-center">
        <LoadingSpinner size="xl" text="Loading inventory dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-app flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-8 pt-8">
        <div>
          <h1 className="section-title mb-2">Inventory Dashboard</h1>
          <p className="text-slate-400">
            Monitor your inventory, track stock levels, and manage suppliers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <button 
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-8">
        <StatCard
          title="Total Parts"
          value={dashboardData.stats.parts}
          icon={() => (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )}
          color="primary"
          onClick={() => navigate('/parts')}
        />
        <StatCard
          title="Low Stock Items"
          value={dashboardData.stats.lowStock}
          icon={() => (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
          color="warning"
          onClick={() => navigate('/low-stock')}
        />
        <StatCard
          title="Active Suppliers"
          value={dashboardData.stats.suppliers}
          icon={() => (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )}
          color="success"
          onClick={() => navigate('/suppliers')}
        />
        <StatCard
          title="PO Value"
          value={formatCurrency(dashboardData.stats.purchaseOrdersValue)}
          icon={() => (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          color="primary"
          onClick={() => navigate('/purchase-orders')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 px-8">
        {/* Recent Parts */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="card flex-1 flex flex-col">
            <div className="card-header">
              <h2 className="card-title">Recent Parts</h2>
              <button 
                onClick={() => navigate('/parts')}
                className="btn-ghost text-sm"
              >
                View All →
              </button>
            </div>
            <div className="card-body flex-1 flex flex-col">
              <PartListTable
                data={{ items: dashboardData.recentParts }}
                onEdit={(part) => navigate(`/parts/${part._id}/edit`)}
                onDeactivate={(part) => console.log('Deactivate part:', part._id)}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title text-lg">Low Stock Alert</h3>
              <span className="badge chip-accent">
                {dashboardData.lowStockParts.length} items
              </span>
            </div>
            <div className="card-body">
              {dashboardData.lowStockParts.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-slate-400">All parts in stock!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.lowStockParts.slice(0, 5).map(part => (
                    <div key={part._id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div>
                        <div className="font-medium text-slate-200 text-sm">
                          {part.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {part.partCode}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-red-400">
                          {part.stock?.onHand || 0}
                        </div>
                        <div className="text-xs text-slate-500">
                          Min: {part.stock?.reorderLevel || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => navigate('/low-stock')}
                    className="btn-secondary w-full text-sm"
                  >
                    View All Low Stock Items
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title text-lg">Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/parts/new')}
                  className="btn-primary w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Part
                </button>
                <button 
                  onClick={() => navigate('/suppliers/new')}
                  className="btn-secondary w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Supplier
                </button>
                <button 
                  onClick={() => navigate('/purchase-orders/new')}
                  className="btn-secondary w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Create Purchase Order
                </button>
                <button 
                  onClick={() => navigate('/inventory/audit')}
                  className="btn-ghost w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View Audit Logs
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title text-lg">Recent Activity</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1 text-sm">
                    <div className="text-slate-300">Part updated</div>
                    <div className="text-slate-500 text-xs">2 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1 text-sm">
                    <div className="text-slate-300">PO approved</div>
                    <div className="text-slate-500 text-xs">1 hour ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="flex-1 text-sm">
                    <div className="text-slate-300">Low stock alert</div>
                    <div className="text-slate-500 text-xs">3 hours ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

