import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';

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
      page: 1 // Reset to first page when filters change
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

  if (loading && logs.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100%', 
        padding: '2rem',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>Audit Logs</h2>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      padding: '2rem',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ 
            color: '#1e293b', 
            margin: 0,
            fontSize: '1.875rem',
            fontWeight: '600'
          }}>Audit Logs</h2>
          <button 
            onClick={() => { loadLogs(); loadSummary(); }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem', 
            marginBottom: '2rem' 
          }}>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '1rem' }}>Total Logs</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {summary.totalLogs}
              </div>
            </div>
            
            {summary.entityTypeStats?.map(stat => (
              <div key={stat._id} style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '1rem' }}>
                  {getEntityTypeIcon(stat._id)} {stat._id}
                </h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                  {stat.count}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Entity Type</label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="">All Types</option>
                <option value="Part">Part</option>
                <option value="Supplier">Supplier</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Action</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            background: '#f8d7da', 
            color: '#721c24', 
            padding: '15px', 
            borderRadius: '4px', 
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
            <button 
              onClick={loadLogs}
              style={{
                marginLeft: '15px',
                padding: '5px 10px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Audit Logs Card Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}>
          {logs.map(log => (
            <div key={log._id} style={{
              background: '#fff',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid #e3e6ea',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '220px',
              position: 'relative',
            }}>
              {/* Action and Entity */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '1.5rem', marginRight: 10 }}>{getActionIcon(log.action)}</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize', marginRight: 16 }}>{log.action}</span>
                <span style={{ fontSize: '1.3rem', marginRight: 6 }}>{getEntityTypeIcon(log.entityType)}</span>
                <span style={{ color: '#007bff', fontWeight: 500 }}>{log.entityType}</span>
              </div>
              {/* Entity ID */}
              <div style={{ color: '#6c757d', fontSize: '0.95rem', marginBottom: 8 }}>
                <b>ID:</b> {log.entityId}
              </div>
              {/* User Info */}
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>{log.userId?.name || 'Unknown User'}</span>
                <br />
                <span style={{ color: '#6c757d', fontSize: '0.95rem' }}>{log.userId?.email}</span>
              </div>
              {/* Timestamp */}
              <div style={{ color: '#888', fontSize: '0.95rem', marginBottom: 8 }}>
                <span>{formatDate(log.createdAt)}</span>
              </div>
              {/* Expandable Details */}
              <details style={{ marginTop: 'auto' }}>
                <summary style={{ cursor: 'pointer', color: '#007bff', fontWeight: 500, fontSize: '1rem' }}>View Changes</summary>
                <div style={{ marginTop: 10, fontSize: '0.92rem' }}>
                  {log.before && (
                    <div style={{ marginBottom: 10 }}>
                      <strong style={{ color: '#dc3545' }}>Before:</strong>
                      <pre style={{
                        background: '#f8f9fa',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        overflow: 'auto',
                        maxHeight: '100px',
                      }}>{JSON.stringify(log.before, null, 2)}</pre>
                    </div>
                  )}
                  {log.after && (
                    <div>
                      <strong style={{ color: '#28a745' }}>After:</strong>
                      <pre style={{
                        background: '#f8f9fa',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        overflow: 'auto',
                        maxHeight: '100px',
                      }}>{JSON.stringify(log.after, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          ))}
          {logs.length === 0 && !loading && (
            <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: '#6c757d', background: '#fff', borderRadius: '10px', border: '1px solid #e3e6ea' }}>
              No audit logs found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '10px', 
            marginTop: '20px' 
          }}>
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
              style={{
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                background: filters.page <= 1 ? '#f8f9fa' : 'white',
                color: filters.page <= 1 ? '#6c757d' : '#007bff',
                borderRadius: '4px',
                cursor: filters.page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            
            <span style={{ padding: '8px 12px' }}>
              Page {filters.page} of {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= totalPages}
              style={{
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                background: filters.page >= totalPages ? '#f8f9fa' : 'white',
                color: filters.page >= totalPages ? '#6c757d' : '#007bff',
                borderRadius: '4px',
                cursor: filters.page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
