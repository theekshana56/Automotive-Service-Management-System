/**
 * Simple ML Dashboard Component - Ready to Use
 * Add this directly to your existing React app
 */

import React, { useState, useEffect } from 'react';

const SimpleMLDashboard = () => {
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
      
      // Try to fetch from your Express.js backend first
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
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>ML Inventory Dashboard</h2>
        <p>Loading ML data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>ML Inventory Dashboard</h2>
        <div style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '5px' }}>
          <strong>Error:</strong> {error}
        </div>
        <button onClick={fetchMLData} style={{ marginTop: '10px', padding: '10px 20px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!mlData) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>ML Inventory Dashboard</h2>
        <p>No ML data available. Please ensure the ML service is running.</p>
        <button onClick={fetchMLData} style={{ padding: '10px 20px' }}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>ML Inventory Forecasting Dashboard</h2>
        <button 
          onClick={fetchMLData} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Refresh Data
        </button>
      </div>

      {/* Health Status */}
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '5px',
        backgroundColor: mlData.health?.status === 'healthy' ? '#d4edda' : '#f8d7da'
      }}>
        <h3>ML Service Status</h3>
        <p><strong>Status:</strong> {mlData.health?.status || 'Unknown'}</p>
        <p><strong>Models Loaded:</strong> {mlData.health?.models_loaded || 0}</p>
        <p><strong>Available Parts:</strong> {mlData.health?.available_parts?.length || 0}</p>
        <p><strong>Last Updated:</strong> {new Date(mlData.health?.timestamp || Date.now()).toLocaleString()}</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', textAlign: 'center' }}>
          <h4>Total Parts</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
            {mlData.recommendations?.total_parts || 0}
          </p>
        </div>
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', textAlign: 'center' }}>
          <h4>High Priority</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
            {mlData.recommendations?.high_priority || 0}
          </p>
        </div>
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', textAlign: 'center' }}>
          <h4>Inventory Value</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            {formatCurrency(mlData.optimization?.total_inventory_value)}
          </p>
        </div>
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', textAlign: 'center' }}>
          <h4>Models Trained</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
            {mlData.modelStats?.total_models || 0}
          </p>
        </div>
      </div>

      {/* Reorder Recommendations */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Reorder Recommendations</h3>
        <div style={{ border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
          {mlData.recommendations?.recommendations?.length > 0 ? (
            mlData.recommendations.recommendations.map((rec, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '15px', 
                  borderBottom: index < mlData.recommendations.recommendations.length - 1 ? '1px solid #eee' : 'none',
                  backgroundColor: rec.priority === 'HIGH' ? '#fff5f5' : rec.priority === 'MEDIUM' ? '#fffbf0' : '#f0fff4'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>{rec.part_name}</h4>
                    <p style={{ margin: '0', color: '#666' }}>{rec.part_id}</p>
                  </div>
                  <div style={{ 
                    padding: '5px 10px', 
                    borderRadius: '15px', 
                    backgroundColor: rec.priority === 'HIGH' ? '#dc3545' : rec.priority === 'MEDIUM' ? '#ffc107' : '#28a745',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {rec.priority}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  <div>
                    <strong>Current Stock:</strong> {rec.current_stock}
                  </div>
                  <div>
                    <strong>Reorder Point:</strong> {rec.reorder_point}
                  </div>
                  <div>
                    <strong>Recommended Qty:</strong> {Math.round(rec.recommended_order_quantity)}
                  </div>
                  <div>
                    <strong>Days until reorder:</strong> {rec.days_until_reorder}
                  </div>
                  <div>
                    <strong>Unit Cost:</strong> {formatCurrency(rec.unit_cost)}
                  </div>
                  <div>
                    <strong>Lead Time:</strong> {rec.lead_time_days} days
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No reorder recommendations available
            </div>
          )}
        </div>
      </div>

      {/* Model Statistics */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Model Performance Statistics</h3>
        <div style={{ border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
          {mlData.modelStats?.models?.length > 0 ? (
            mlData.modelStats.models.map((model, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '15px', 
                  borderBottom: index < mlData.modelStats.models.length - 1 ? '1px solid #eee' : 'none'
                }}
              >
                <h4 style={{ margin: '0 0 10px 0' }}>{model.part_name}</h4>
                <p style={{ margin: '0 0 5px 0', color: '#666' }}>{model.part_id}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                  <div>
                    <strong>MAE:</strong> {model.mae.toFixed(2)}
                  </div>
                  <div>
                    <strong>RMSE:</strong> {model.rmse.toFixed(2)}
                  </div>
                  <div>
                    <strong>Avg Usage:</strong> {model.avg_usage.toFixed(1)}
                  </div>
                  <div>
                    <strong>Lead Time:</strong> {model.lead_time_days} days
                  </div>
                  <div>
                    <strong>Unit Cost:</strong> {formatCurrency(model.unit_cost)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No model statistics available
            </div>
          )}
        </div>
      </div>

      {/* Inventory Optimization */}
      <div>
        <h3>Inventory Optimization Insights</h3>
        <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Total Inventory Value:</strong><br />
              <span style={{ fontSize: '18px', color: '#28a745' }}>
                {formatCurrency(mlData.optimization?.total_inventory_value)}
              </span>
            </div>
            <div>
              <strong>Annual Holding Cost:</strong><br />
              <span style={{ fontSize: '18px', color: '#dc3545' }}>
                {formatCurrency(mlData.optimization?.total_holding_cost_annual)}
              </span>
            </div>
          </div>
        </div>
        
        <div style={{ border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
          {mlData.optimization?.optimization_insights?.length > 0 ? (
            mlData.optimization.optimization_insights.map((insight, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '15px', 
                  borderBottom: index < mlData.optimization.optimization_insights.length - 1 ? '1px solid #eee' : 'none'
                }}
              >
                <h4 style={{ margin: '0 0 10px 0' }}>{insight.part_name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <strong>Inventory Value:</strong> {formatCurrency(insight.inventory_value)}
                  </div>
                  <div>
                    <strong>Holding Cost:</strong> {formatCurrency(insight.holding_cost_annual)}
                  </div>
                  <div>
                    <strong>Ordering Cost:</strong> {formatCurrency(insight.ordering_cost_annual)}
                  </div>
                </div>
                {insight.insights.length > 0 && (
                  <div>
                    <strong>Optimization Suggestions:</strong>
                    <ul style={{ margin: '5px 0 0 20px' }}>
                      {insight.insights.map((tip, tipIndex) => (
                        <li key={tipIndex} style={{ color: '#666' }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No optimization insights available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleMLDashboard;
