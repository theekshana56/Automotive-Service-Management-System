import React, { useState, useEffect } from 'react';
import { getPartUsageLogs, downloadPartUsageLogCSV } from '../../services/inventoty/api';
import api from '../../api/client';
import Pagination from '../../components/ui/Pagination';

export default function PartUsageLogReport() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parts, setParts] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ partId: '', usedBy: '', startDate: '', endDate: '', search: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    async function fetchPartsAndUsers() {
      try {
        const [partsRes, usersRes] = await Promise.all([
          api.get('/api/parts?isActive=true&limit=100'),
          api.get('/api/users?role=inventory_manager'), // Adjust as needed
        ]);
        setParts(partsRes.data.items || partsRes.data.parts || []);
        setUsers(usersRes.data.items || usersRes.data.users || []);
      } catch (err) {
        // ignore
      }
    }
    fetchPartsAndUsers();
  }, []);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError('');
      try {
        const params = { ...filters, page, limit: 20 };
        if (!params.partId) delete params.partId;
        if (!params.usedBy) delete params.usedBy;
        if (!params.startDate) delete params.startDate;
        if (!params.endDate) delete params.endDate;
        const data = await getPartUsageLogs(params);
        setLogs(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } catch (err) {
        setError('Failed to load usage logs');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [filters, page]);

  const handleFilterChange = (e) => {
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const handleDownloadCSV = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (!params.partId) delete params.partId;
      if (!params.usedBy) delete params.usedBy;
      if (!params.startDate) delete params.startDate;
      if (!params.endDate) delete params.endDate;
      const response = await downloadPartUsageLogCSV(params);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `parts-usage-log-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    // The useEffect will automatically trigger a refresh
  };

  return (
    <div className="min-h-screen w-full bg-app flex flex-col">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Parts Usage Log Report
            </h1>
            <p className="text-slate-400">
              Track and analyze parts usage across all jobs and activities
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <span>
              Total Logs: <strong className="text-slate-100">{total}</strong>
            </span>
            <span>
              Current Page: <strong className="text-slate-100">{page} of {pages}</strong>
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="card p-4 text-center hover:shadow-lg transition">
            <svg
              className="mx-auto w-6 h-6 text-blue-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div className="text-2xl font-bold text-blue-400 mb-1">{total}</div>
            <div className="text-sm text-slate-400">Total Usage Logs</div>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition">
            <svg
              className="mx-auto w-6 h-6 text-green-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {logs.reduce((sum, log) => sum + (log.quantityUsed || 0), 0)}
            </div>
            <div className="text-sm text-slate-400">Parts Used (Current Page)</div>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition">
            <svg
              className="mx-auto w-6 h-6 text-purple-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {new Set(logs.map(log => log.usedBy?._id).filter(Boolean)).size}
            </div>
            <div className="text-sm text-slate-400">Active Users</div>
          </div>
          <div className="card p-4 text-center hover:shadow-lg transition">
            <svg
              className="mx-auto w-6 h-6 text-yellow-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {new Set(logs.map(log => log.partId?._id).filter(Boolean)).size}
            </div>
            <div className="text-sm text-slate-400">Unique Parts Used</div>
          </div>
        </div>
      </div>
      {/* Enhanced Filters Section */}
      <div className="px-8 mt-6">
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-700">Filters & Search</h2>
            <button
              onClick={() => setFilters({ partId: '', usedBy: '', startDate: '', endDate: '', search: '' })}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Part Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Part
              </label>
              <select 
                name="partId" 
                value={filters.partId} 
                onChange={handleFilterChange} 
                className="select w-full"
              >
                <option value="">All Parts</option>
                {parts.map(part => (
                  <option key={part._id} value={part._id}>
                    {part.name} ({part.partCode})
                  </option>
                ))}
              </select>
            </div>

            {/* User Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                User
              </label>
              <select 
                name="usedBy" 
                value={filters.usedBy} 
                onChange={handleFilterChange} 
                className="select w-full"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Start Date
              </label>
              <input 
                type="date" 
                name="startDate" 
                value={filters.startDate} 
                onChange={handleFilterChange} 
                className="input w-full"
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                End Date
              </label>
              <input 
                type="date" 
                name="endDate" 
                value={filters.endDate} 
                onChange={handleFilterChange} 
                className="input w-full"
              />
            </div>

            {/* Search Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </label>
              <input 
                type="text" 
                name="search" 
                value={filters.search} 
                onChange={handleFilterChange} 
                className="input w-full" 
                placeholder="Search notes or job ID..." 
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.partId || filters.usedBy || filters.startDate || filters.endDate || filters.search) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm text-slate-600">Active filters:</span>
                {filters.partId && (
                  <span className="badge bg-blue-100 text-blue-800">
                    Part: {parts.find(p => p._id === filters.partId)?.name || 'Unknown'}
                  </span>
                )}
                {filters.usedBy && (
                  <span className="badge bg-green-100 text-green-800">
                    User: {users.find(u => u._id === filters.usedBy)?.name || 'Unknown'}
                  </span>
                )}
                {filters.startDate && (
                  <span className="badge bg-purple-100 text-purple-800">
                    From: {filters.startDate}
                  </span>
                )}
                {filters.endDate && (
                  <span className="badge bg-purple-100 text-purple-800">
                    To: {filters.endDate}
                  </span>
                )}
                {filters.search && (
                  <span className="badge bg-yellow-100 text-yellow-800">
                    Search: "{filters.search}"
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Error Display */}
      {error && (
        <div className="px-8 mb-4">
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div className="px-8 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Showing {logs.length} of {total} usage logs
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh} 
              className="btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button 
              onClick={handleDownloadCSV} 
              className="btn-primary flex items-center gap-2"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="flex-1 flex flex-col px-8">
        <div className="card mb-6 flex-1 flex flex-col overflow-hidden">
          <div className="card-body p-0 flex-1 flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-slate-500">Loading usage logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <svg
                  className="w-12 h-12 mb-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg font-medium mb-2">No usage logs found</p>
                <p className="text-sm">Try adjusting your filters to see more results</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Date & Time
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          Part Details
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Quantity
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Used By
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Job ID
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          Notes
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((log, index) => (
                      <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-100">
                              {log.usedAt ? new Date(log.usedAt).toLocaleDateString() : '-'}
                            </span>
                            <span className="text-slate-400 text-xs">
                              {log.usedAt ? new Date(log.usedAt).toLocaleTimeString() : ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-slate-100">
                              {log.partId?.name || 'Unknown Part'}
                            </div>
                            <div className="text-sm text-slate-400">
                              Code: {log.partId?.partCode || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {log.quantityUsed || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                          {log.usedBy?.name || 'Unknown User'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                          {log.jobId ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {log.jobId}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-200 max-w-xs">
                          <div className="truncate">
                            {log.note || (
                              <span className="text-slate-400 italic">No notes</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="border-t border-white/5 px-6 py-4 bg-white/5">
              <Pagination
                currentPage={page}
                totalPages={pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
