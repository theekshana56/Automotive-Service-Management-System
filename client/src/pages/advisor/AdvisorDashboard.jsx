import React, { useEffect, useState } from 'react';
import { advisorApi } from '../../services/advisor/api';
import { fetchNotifications } from '../../services/notificationsApi';
import { getSocket, initSocket } from '../../services/socket';
import StatCard from '../../components/ui/StatCard';
import NotificationList from '../../components/advisor/NotificationList';
import { useNavigate } from 'react-router-dom';

// Simple inline bar chart (no external deps)
function BarChart({ data = [] }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div className="mt-4 p-4 bg-slate-800/60 border border-slate-700 rounded-xl">
      <div className="text-slate-200 font-semibold mb-2">Upcoming Inspections (14 days)</div>
      <div className="grid grid-cols-14 gap-2 items-end" style={{ gridTemplateColumns: `repeat(${data.length || 14}, minmax(0, 1fr))` }}>
        {(data.length ? data : Array.from({ length: 14 }, (_, i) => ({ day: i+1, count: 0 }))).map((d, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-full bg-blue-600/40 rounded" style={{ height: `${(d.count / max) * 120}px` }} />
            <div className="text-[10px] text-slate-400 mt-1">{d.dayLabel || `D${i+1}`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const AdvisorDashboard = () => {
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0 });
  const [notifItems, setNotifItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const data = await advisorApi.getOverview();
        if (!mounted) return;
        setStats({
          pending: data.pendingJobs ?? 0,
          inProgress: 0,
          completed: data.completedJobs ?? data.completed ?? 0,
        });
        if (Array.isArray(data.next14Days)) {
          setChartData(data.next14Days.map(d => ({ dayLabel: d.day, count: d.count })));
        }
      } catch (e) {
        // graceful fallback - use 0 for all counts on error
        if (!mounted) return;
        setStats({ pending: 0, inProgress: 0, completed: 0 });
      } finally {
        setLoading(false);
      }
    };
    const fetchAdvisorNotifications = async () => {
      try {
        const items = await fetchNotifications({ unreadOnly: 1 });
        if (!mounted) return;
        setNotifItems(items.map(n => ({
          _id: n._id || n.id,
          title: n.title,
          subtitle: n.message,
          type: 'info',
          badge: 'New',
          link: n.link
        })));
      } catch {}
    };
    fetchOverview();
    fetchAdvisorNotifications();
    // Ensure socket is initialized for real-time refresh
    (async () => {
      try {
        let s = getSocket();
        if (!s) {
          s = await initSocket({ url: 'http://localhost:5000' });
        }
        if (s) {
          s.on('booking:created', () => fetchOverview());
          s.on('inspection:completed', () => fetchOverview());
          s.on('notification:new', () => fetchAdvisorNotifications());
        }
      } catch (_) {}
    })();

    return () => { mounted = false; };
  }, []);

  const notifications = [
    { title: 'New job assigned: Oil Change', subtitle: 'Job #12345', type: 'info', badge: 'New' },
    { title: 'Inspection approved for Brake Repair', subtitle: 'Job #67890', type: 'success', badge: 'Approved' },
    { title: 'Alert: Job delayed due to part availability', subtitle: 'Job #11223', type: 'warning', badge: 'Delay' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Welcome back, Service Advisor.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard title="Pending Jobs" value={stats.pending} color="warning" />
          {/* Removed In Progress per request */}
          <StatCard title="Completed Jobs" value={stats.completed} color="success" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-4">
            <h2 className="text-white text-xl font-semibold">Quick Actions</h2>
            <div className="flex gap-3">
              <button className="btn-primary bg-orange-600 hover:bg-orange-500" onClick={() => nav('/advisor/inspections')}>
                Start Inspection
              </button>
              <button className="btn-secondary" onClick={() => nav('/advisor/assign')}>Assign Jobs</button>
              {/* Estimates feature removed */}
            </div>
            <BarChart data={chartData} />
          </section>

          <aside>
            <NotificationList
              items={notifItems.length ? notifItems : notifications}
              onChange={async () => {
                // refetch after delete
                try {
                  const items = await fetchNotifications({ unreadOnly: 1 });
                  setNotifItems(items.map(n => ({
                    _id: n._id || n.id,
                    title: n.title,
                    subtitle: n.message,
                    type: 'info',
                    badge: 'New',
                    link: n.link
                  })));
                } catch {}
              }}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AdvisorDashboard;
