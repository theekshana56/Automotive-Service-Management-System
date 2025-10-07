/**
 * ML Dashboard Widget - Integrated into existing Inventory Dashboard
 * Shows key ML insights as a widget
 */

import React, { useState, useEffect } from 'react';

const MLDashboardWidget = ({ onViewFull, onViewSimple }) => {
  const [mlData, setMlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMLData();
  }, []);

  const fetchMLData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ml/dashboard-data');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMlData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch ML data');
      }
    } catch (err) {
      console.error('ML Data Error:', err);
      setError(`Failed to fetch ML data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">ML Inventory Insights</h3>
              <p className="text-sm text-slate-400">AI-powered predictions and recommendations</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <svg className="w-6 h-6 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-slate-400">Loading ML data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-red-500/50 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">ML Service Error</h3>
              <p className="text-sm text-slate-400">Failed to connect to ML service</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-red-400 mb-4">
            <strong>Error:</strong> {error}
          </div>
          <button 
            onClick={fetchMLData} 
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!mlData) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">ML Inventory Insights</h3>
              <p className="text-sm text-slate-400">AI-powered predictions and recommendations</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-400 mb-4">
            No ML data available. Please ensure the ML service is running.
          </p>
          <button 
            onClick={fetchMLData} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">ML Inventory Insights</h3>
              <p className="text-sm text-slate-400">AI-powered predictions and recommendations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-bold ${
              mlData.health?.status === 'healthy' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {mlData.health?.status === 'healthy' ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-700/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {mlData.recommendations?.total_parts || 0}
            </div>
            <div className="text-sm text-slate-400">Total Parts</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {mlData.recommendations?.high_priority || 0}
            </div>
            <div className="text-sm text-slate-400">High Priority</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-green-400">
              {formatCurrency(mlData.optimization?.total_inventory_value)}
            </div>
            <div className="text-sm text-slate-400">Inventory Value</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {mlData.modelStats?.total_models || 0}
            </div>
            <div className="text-sm text-slate-400">Models Trained</div>
          </div>
        </div>

        {/* High Priority Items */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-red-400">🚨</span>
            High Priority Reorders
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {mlData.recommendations?.recommendations?.filter(rec => rec.priority === 'HIGH').slice(0, 3).map((rec, index) => (
              <div 
                key={index} 
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              >
                <div className="font-semibold text-red-300 text-sm">{rec.part_name}</div>
                <div className="text-xs text-slate-400">
                  Stock: {rec.current_stock} | Reorder: {rec.reorder_point} | Qty: {Math.round(rec.recommended_order_quantity)}
                </div>
              </div>
            ))}
            {(!mlData.recommendations?.recommendations?.filter(rec => rec.priority === 'HIGH').length) && (
              <div className="text-center text-slate-400 text-sm py-4">
                No high priority items
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={onViewFull}
            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
          >
            📊 Full ML Dashboard
          </button>
          <button 
            onClick={onViewSimple}
            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
          >
            🔍 Simple View
          </button>
          <button 
            onClick={fetchMLData}
            className="px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-semibold"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
};

export default MLDashboardWidget;
