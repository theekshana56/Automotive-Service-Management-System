import { useEffect, useMemo, useState } from 'react';
import { getInventoryOverview, getTopUsedParts, getStockSummaryReport, getSupplierSpendReport, getPartUsageLogs, getPartPriceTrend } from '../../services/inventoty/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Bar } from 'react-chartjs-2';
import { getSocket, setSocket } from '../../services/socket';
import PartListTable from '../../components/inventory/PartListTable';
import DashboardHeader from '../../components/inventory/DashboardHeader';
import DashboardKPIs from '../../components/inventory/DashboardKPIs';
import DashboardCharts from '../../components/inventory/DashboardCharts';
import EmbeddedReports from '../../components/inventory/EmbeddedReports';
import DashboardSidebar from '../../components/inventory/DashboardSidebar';
import MLDashboardWidget from '../../components/inventory/MLDashboardWidget';
import MLQuickAccess from '../../components/inventory/MLQuickAccess';
import MLTestComponent from '../../components/inventory/MLTestComponent';
import ComprehensiveMLDashboard from '../../components/inventory/ComprehensiveMLDashboard';
import api from '../../api/client';
// Optional: live updates when server emits stock/po events
let socketInitTried = false;
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

function PartsUsageLogWidget({ onNavigate, refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getPartUsageLogs({ limit: 5, page: 1 });
      setLogs(data.items || []);
    } catch (error) {
      console.error('Failed to fetch usage logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [refreshTrigger]);

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getUsageTypeIcon = (note) => {
    if (note?.includes('Cost Estimation')) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center">
        <svg className="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h3m4 0V7a2 2 0 00-2-2h-7.5a2 2 0 00-2 2v2" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Recent Parts Usage</h3>
              <p className="text-sm text-slate-400">Latest inventory consumption events</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/inventory/parts-usage-log-report')}
            className="text-sm text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
          >
            Open full report
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <svg className="w-6 h-6 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-slate-400">Loading usage logs...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h4 className="text-base font-medium text-white mb-1">No Usage Logs Found</h4>
            <p className="text-sm text-slate-400 max-w-xs">No parts have been consumed yet. Usage logs will appear here when parts are used.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log._id} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
                {/* Part Icon */}
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {log.partId?.name || 'Unknown Part'}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">
                        {log.partId?.partCode && `${log.partId.partCode}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {/* Quantity */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-400">
                          {log.quantityUsed} units
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatTimeAgo(log.usedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-xs text-slate-400">
                      {log.usedBy?.name || 'Unknown User'}
                    </span>
                    {log.note && (
                      <>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400 truncate max-w-32">
                          {log.note}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [topUsed, setTopUsed] = useState([]);
  const [days, setDays] = useState(30);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const raw = localStorage.getItem('inv_dash_auto');
    return raw ? raw === '1' : false;
  });
  const [stockSummary, setStockSummary] = useState({ summary: null, items: [] });
  const [supplierSpend, setSupplierSpend] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      parts: 0,
      lowStock: 0,
      suppliers: 0,
      purchaseOrdersValue: 0,
      poCount: 0
    },
    recentParts: [],
    lowStockParts: [],
  });
  const [error, setError] = useState(null);
  const [priceTrend, setPriceTrend] = useState({ labels: [], datasets: [] });
  const [showMLWidget, setShowMLWidget] = useState(true);
  const [currentMLView, setCurrentMLView] = useState('main'); // 'main', 'ml-full'
  const navigate = useNavigate();

  // ML Navigation Handlers
  const handleViewFullML = () => {
    setCurrentMLView('ml-full');
  };


  const handleViewMain = () => {
    setCurrentMLView('main');
  };

  const toggleMLWidget = () => {
    setShowMLWidget(!showMLWidget);
  };

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [o, u, partsResp, suppliersResp, lowStockResp] = await Promise.all([
        getInventoryOverview(),
        getTopUsedParts(days),
        api.get('/api/parts', { params: { limit: 5 } }),
        api.get('/api/suppliers', { params: { limit: 3 } }),
        api.get('/api/parts/low-stock')
      ]);
      setOverview(o);
      setTopUsed(u);
      // derive PO metrics
      const poBreakdown = o?.purchaseOrders?.breakdown || [];
      const poCount = poBreakdown.reduce((sum, b) => sum + (b.count || 0), 0);
      const purchaseOrdersValue = poBreakdown.reduce((sum, b) => sum + (b.totalValue || 0), 0);
      setDashboardData(prev => ({
        ...prev,
        stats: {
          parts: o?.totalParts || 0,
          lowStock: o?.lowStockCount || 0,
          suppliers: suppliersResp?.data?.total || (suppliersResp?.data?.suppliers?.length || suppliersResp?.data?.items?.length || 0),
          purchaseOrdersValue,
          poCount
        },
        recentParts: partsResp?.data?.items || partsResp?.data?.parts || [],
        lowStockParts: lowStockResp?.data?.items || []
      }));
      // lightweight snapshots for embedded components
      getStockSummaryReport().then((data) => setStockSummary({ summary: data.summary, items: (data.items || []).slice(0, 5) })).catch(()=>{});
      getSupplierSpendReport({}).then((data) => setSupplierSpend((data.rows || []).slice(0, 5))).catch(()=>{});
      getPartPriceTrend({ months: 6, limit: 5 }).then(setPriceTrend).catch(()=>{});
      
      // Trigger refresh for parts usage log widget
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, days]);

  useEffect(() => {
    localStorage.setItem('inv_dash_auto', autoRefresh ? '1' : '0');
  }, [autoRefresh]);


  useEffect(() => {
    // Attempt to hook into socket if available
    if (!socketInitTried) {
      socketInitTried = true;
      try {
        // dynamic import to avoid bundling if not installed
        import('socket.io-client').then(({ io }) => {
          const s = io();
          setSocket(s);
        }).catch(() => {});
      } catch {}
    }
    const s = getSocket?.();
    if (!s) return;
    const onLow = () => load();
    const onPO = () => load();
    s.on('stock:low', onLow);
    s.on('po:updated', onPO);
    return () => {
      s.off?.('stock:low', onLow);
      s.off?.('po:updated', onPO);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poStatusData = useMemo(() => {
    const breakdown = overview?.purchaseOrders?.breakdown || [];
    const labels = breakdown.map(b => b._id);
    const counts = breakdown.map(b => b.count);
    return {
      labels,
      datasets: [
        {
          label: 'PO Count',
          data: counts,
          backgroundColor: 'rgba(59,130,246,0.5)'
        }
      ]
    };
  }, [overview]);

  const topUsedData = useMemo(() => {
    const labels = topUsed.map(i => i.partCode || i.name);
    const values = topUsed.map(i => i.usedQty);
    return {
      labels,
      datasets: [
        { 
          label: 'Used Qty', 
          data: values, 
          backgroundColor: 'rgba(79, 255, 176, 0.6)',
          borderColor: 'rgba(79, 255, 176, 0.8)',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };
  }, [topUsed]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-app flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-app flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4 opacity-50">⚠️</div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">Dashboard Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={load}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  if (currentMLView === 'ml-full') {
    return (
      <div className="min-h-screen w-full bg-app">
        <div className="app-container space-y-6">
          {/* ML Navigation Header */}
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Full ML Dashboard</h1>
                <p className="text-sm text-slate-400">Complete AI analytics and predictions</p>
              </div>
            </div>
            <button 
              onClick={handleViewMain}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              ← Back to Main Dashboard
            </button>
          </div>
          
          {/* Full ML Content - Using ComprehensiveMLDashboard */}
          <ComprehensiveMLDashboard />
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="min-h-screen w-full bg-app">
      <div className="app-container space-y-6">
        {/* Header */}
        <DashboardHeader
          days={days}
          onDaysChange={setDays}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          onRefresh={load}
          loading={loading}
        />

        {/* ML Widget Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Dashboard Controls</h2>
            <button
              onClick={toggleMLWidget}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                showMLWidget 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {showMLWidget ? 'Hide ML Widget' : 'Show ML Widget'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewFullML}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              🤖 Full ML Dashboard
            </button>
          </div>
        </div>

        {/* KPIs */}
        <DashboardKPIs stats={dashboardData.stats} />

        {/* Charts */}
        <DashboardCharts
          poStatusData={poStatusData}
          topUsedData={topUsedData}
          topUsed={topUsed}
          onNavigate={navigate}
        />

        {/* Price Trend Widget */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 13l3-3 4 4 3-3" />
                </svg>
              </div>
              <div>
                <h3 className="card-title">Avg Unit Price Trend (Last 6 months)</h3>
                <p className="card-subtitle">Top parts by recent pricing activity</p>
              </div>
            </div>
            <button 
              className="btn-ghost text-sm"
              onClick={() => navigate('/inventory/supplier-performance')}
            >
              Supplier Performance →
            </button>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-slate-300">
                    <th className="px-4 py-2">Part</th>
                    {priceTrend.labels.map((l) => (
                      <th key={l} className="px-4 py-2">{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {priceTrend.datasets.map((ds) => (
                    <tr key={ds.label} className="border-t border-slate-700/50">
                      <td className="px-4 py-2 text-white">{ds.label}</td>
                      {ds.data.map((v, idx) => (
                        <td key={idx} className="px-4 py-2 text-slate-300">{v != null ? `$${Number(v).toFixed(2)}` : '-'}</td>
                      ))}
                    </tr>
                  ))}
                  {priceTrend.datasets.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-slate-400" colSpan={1 + priceTrend.labels.length}>No price data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Embedded Reports */}
        <EmbeddedReports
          stockSummary={stockSummary}
          supplierSpend={supplierSpend}
          onNavigate={navigate}
        />

        {/* Parts Usage Log Widget */}
        <PartsUsageLogWidget onNavigate={navigate} refreshTrigger={refreshTrigger} />

        {/* ML Widget */}
        {showMLWidget && (
          <div className="space-y-4">
            <MLDashboardWidget 
              onViewFull={handleViewFullML}
            />
            {/* Quick ML Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Predictive Analytics</h3>
                    <p className="text-blue-100">30-day forecasts & seasonal patterns</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">JIT Optimization</h3>
                    <p className="text-green-100">Dynamic reorder points & EOQ</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Real-time Alerts</h3>
                    <p className="text-orange-100">Priority alerts & cost insights</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content: Recent Parts + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Parts */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="card-title">Recent Parts</h3>
                    <p className="card-subtitle">Latest inventory additions</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/parts')} 
                  className="btn-ghost text-sm"
                >
                  View All →
                </button>
              </div>
              <div className="card-body p-0">
                <PartListTable
                  data={{ items: dashboardData.recentParts }}
                  loading={false}
                  onEdit={(part) => navigate(`/parts/${part._id}/edit`)}
                  onDeactivate={(part) => console.log('Deactivate part:', part._id)}
                  onActivate={(part) => console.log('Activate part:', part._id)}
                  onDelete={(part) => console.log('Delete part:', part._id)}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <DashboardSidebar
            lowStockParts={dashboardData.lowStockParts}
            onNavigate={navigate}
          />
        </div>

        {/* Floating ML Quick Access */}
        <MLQuickAccess 
          onViewMain={handleViewMain}
          onViewFullML={handleViewFullML}
        />
      </div>
    </div>
  );
}
