import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/inventory/PageHeader';
import FilterBar from '../../components/inventory/FilterBar';
import StatsCard from '../../components/inventory/StatsCard';
import StatusBadge from '../../components/inventory/StatusBadge';
import Pagination from '../../components/inventory/Pagination';
import LoadingSpinner from '../../components/inventory/LoadingSpinner';
import ErrorAlert from '../../components/inventory/ErrorAlert';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    entityType: '',
    action: '',
    startDate: '',
    endDate: ''
  });
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.action && { action: filters.action }),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });
      
      const response = await api.get(`/api/audit?${params}`);
      setLogs(response.data.items || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.action, filters.entityType, filters.startDate, filters.endDate]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await api.get('/api/audit/summary/stats');
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  }, []);

  useEffect(() => {
    loadLogs();
    loadSummary();
  }, [loadLogs, loadSummary]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      default: return '📝';
    }
  };

  const getEntityTypeIcon = (entityType) => {
    switch (entityType) {
      case 'Part': return '🔧';
      case 'Supplier': return '🏢';
      default: return '📋';
    }
  };

  const filterOptions = [
    {
      key: 'entityType',
      label: 'Entity Type',
      type: 'select',
      value: filters.entityType,
      placeholder: 'All Types',
      options: [
        { value: 'Part', label: 'Part' },
        { value: 'Supplier', label: 'Supplier' }
      ]
    },
    {
      key: 'action',
      label: 'Action',
      type: 'select',
      value: filters.action,
      placeholder: 'All Actions',
      options: [
        { value: 'create', label: 'Create' },
        { value: 'update', label: 'Update' },
        { value: 'delete', label: 'Delete' }
      ]
    },
    {
      key: 'startDate',
      label: 'Start Date',
      type: 'date',
      value: filters.startDate
    },
    {
      key: 'endDate',
      label: 'End Date',
      type: 'date',
      value: filters.endDate
    }
  ];

  const headerActions = [
    {
      label: 'Refresh',
      icon: '🔄',
      onClick: () => {
        loadLogs();
        loadSummary();
      },
      variant: 'secondary'
    }
  ];

  if (loading && logs.length === 0) {
    return <LoadingSpinner message="Loading audit logs..." />;
  }

  return (
    <div className="bg-app min-h-screen">
      <div className="app-container">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title="Audit Logs"
            subtitle="Track all system changes and user activities"
            actions={headerActions}
          />

          <ErrorAlert 
            message={error} 
            onDismiss={() => setError('')} 
          />

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Logs"
                value={summary.totalLogs}
                icon="📊"
                color="primary"
              />
              {summary.entityTypeStats?.map(stat => (
                <StatsCard
                  key={stat._id}
                  title={stat._id}
                  value={stat.count}
                  icon={getEntityTypeIcon(stat._id)}
                  color="success"
                />
              ))}
            </div>
          )}

          {/* Filters */}
          <FilterBar
            filters={filterOptions}
            onFilterChange={handleFilterChange}
            className="mb-8"
          />

          {/* Audit Logs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {logs.map(log => (
              <div key={log._id} className="card card-hover">
                <div className="card-body">
                  {/* Action and Entity Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getActionIcon(log.action)}</span>
                      <div>
                        <StatusBadge status={log.action} />
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg">{getEntityTypeIcon(log.entityType)}</span>
                          <span className="text-sm text-primary font-medium">{log.entityType}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Entity ID */}
                  <div className="mb-3">
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Entity ID</span>
                    <div className="text-sm text-slate-300 font-mono">{log.entityId}</div>
                  </div>

                  {/* User Info */}
                  <div className="mb-3">
                    <span className="text-xs text-slate-400 uppercase tracking-wide">User</span>
                    <div className="text-sm text-slate-200 font-medium">
                      {log.userId?.name || 'Unknown User'}
                    </div>
                    <div className="text-xs text-slate-400">{log.userId?.email}</div>
                  </div>

                  {/* Timestamp */}
                  <div className="mb-4">
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Timestamp</span>
                    <div className="text-sm text-slate-300">{formatDate(log.createdAt)}</div>
                  </div>

                  {/* Expandable Details */}
                  <details className="group">
                    <summary className="cursor-pointer text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-2">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      View Changes
                    </summary>
                    <div className="mt-4 space-y-3">
                      {log.before && (
                        <div>
                          <div className="text-xs text-red-400 font-medium mb-1">BEFORE:</div>
                          <pre className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs overflow-auto max-h-32 text-red-300">
                            {JSON.stringify(log.before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.after && (
                        <div>
                          <div className="text-xs text-green-400 font-medium mb-1">AFTER:</div>
                          <pre className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs overflow-auto max-h-32 text-green-300">
                            {JSON.stringify(log.after, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            ))}

            {logs.length === 0 && !loading && (
              <div className="col-span-full">
                <div className="card text-center py-12">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No audit logs found</h3>
                  <p className="text-slate-400">Try adjusting your filters or check back later.</p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}