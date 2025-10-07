/**
 * React Dashboard Component for ML Inventory Predictions
 * Fixed version with standard HTML and Tailwind CSS
 */

import React, { useState, useEffect } from 'react';

const InventoryDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [activeTab, setActiveTab] = useState('recommendations');

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ml/dashboard-data');
      const data = await response.json();
      
      if (data.success) {
        // Handle nested data structure from API
        const actualData = data.data.data || data.data;
        setDashboardData(actualData);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async (partId) => {
    try {
      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partIds: [partId],
          days: 30
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.data[0]);
        setSelectedPart(partId);
      }
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 text-red-500">❌</div>
        <span className="ml-2 text-red-500">{error}</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm border">
        <h1 className="text-3xl font-bold text-gray-900">ML Inventory Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            dashboardData.health?.status === 'healthy' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {dashboardData.health?.status === 'healthy' ? "ML Service Online" : "ML Service Offline"}
          </span>
          <button 
            onClick={fetchDashboardData} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Total Parts</h3>
            <div className="h-4 w-4 text-gray-400">📦</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {dashboardData.recommendations?.total_parts || 0}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">High Priority</h3>
            <div className="h-4 w-4 text-red-500">⚠️</div>
          </div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            {dashboardData.recommendations?.high_priority || 0}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Inventory Value</h3>
            <div className="h-4 w-4 text-gray-400">💰</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(dashboardData.optimization?.total_inventory_value || 0)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Models Trained</h3>
            <div className="h-4 w-4 text-gray-400">📈</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {dashboardData.modelStats?.total_models || 0}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recommendations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reorder Recommendations
            </button>
            <button
              onClick={() => setActiveTab('optimization')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'optimization'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Inventory Optimization
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'predictions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Usage Predictions
            </button>
            <button
              onClick={() => setActiveTab('model-stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'model-stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Model Statistics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Reorder Recommendations</h2>
              <div className="space-y-4">
                {dashboardData.recommendations?.recommendations?.map((rec) => (
                  <div
                    key={rec.part_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => fetchPredictions(rec.part_id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{rec.part_name}</h3>
                        <p className="text-sm text-gray-600">{rec.part_id}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Current: {rec.current_stock} | Reorder: {rec.reorder_point}
                      </div>
                      <div className="text-sm text-gray-600">
                        Recommended Qty: {Math.round(rec.recommended_order_quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Inventory Optimization</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg bg-white">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(dashboardData.optimization?.total_inventory_value || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Inventory Value</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-white">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(dashboardData.optimization?.total_holding_cost_annual || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Annual Holding Cost</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Optimization Insights</h3>
                  {dashboardData.optimization?.optimization_insights?.map((insight) => (
                    <div key={insight.part_id} className="p-3 border rounded-lg bg-white">
                      <div className="font-medium text-gray-900">{insight.part_name}</div>
                      <div className="text-sm text-gray-600">
                        Value: {formatCurrency(insight.inventory_value)} | 
                        Holding Cost: {formatCurrency(insight.holding_cost_annual)}
                      </div>
                      {insight.insights.length > 0 && (
                        <div className="mt-2">
                          {insight.insights.map((tip, index) => (
                            <span key={index} className="inline-block px-2 py-1 mr-2 mb-1 text-xs bg-gray-100 text-gray-700 rounded border">
                              {tip}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Usage Predictions</h2>
              {selectedPart && predictions ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{predictions.part_name}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{predictions.part_id}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg bg-white">
                      <div className="text-sm text-gray-600">Reorder Point</div>
                      <div className="text-xl font-bold text-gray-900">{predictions.reorder_info?.reorder_point || 'N/A'}</div>
                    </div>
                    <div className="p-4 border rounded-lg bg-white">
                      <div className="text-sm text-gray-600">Safety Stock</div>
                      <div className="text-xl font-bold text-gray-900">{predictions.reorder_info?.safety_stock || 'N/A'}</div>
                    </div>
                    <div className="p-4 border rounded-lg bg-white">
                      <div className="text-sm text-gray-600">EOQ</div>
                      <div className="text-xl font-bold text-gray-900">{Math.round(predictions.eoq_info?.eoq || 0)}</div>
                    </div>
                    <div className="p-4 border rounded-lg bg-white">
                      <div className="text-sm text-gray-600">Lead Time</div>
                      <div className="text-xl font-bold text-gray-900">{predictions.reorder_info?.lead_time_days || 'N/A'} days</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900">Next 30 Days Predictions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {predictions.predictions?.map((pred, index) => (
                        <div key={index} className="p-2 border rounded text-sm bg-white">
                          <div className="font-medium text-gray-900">{pred.date}</div>
                          <div className="text-gray-600">{pred.predicted_usage} units</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Select a part from recommendations to view predictions</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'model-stats' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Model Statistics</h2>
              <div className="space-y-4">
                {dashboardData.modelStats?.models?.map((model) => (
                  <div key={model.part_id} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{model.part_name}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm border">{model.part_id}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">MAE</div>
                        <div className="font-medium text-gray-900">{model.mae?.toFixed(2) || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">RMSE</div>
                        <div className="font-medium text-gray-900">{model.rmse?.toFixed(2) || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Avg Usage</div>
                        <div className="font-medium text-gray-900">{model.avg_usage?.toFixed(1) || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Unit Cost</div>
                        <div className="font-medium text-gray-900">{formatCurrency(model.unit_cost || 0)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
