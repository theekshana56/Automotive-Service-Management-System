/**
 * ML Dashboard Widget - Compact version for main dashboard
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
      <div style={{ 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🤖 ML Inventory Insights</h3>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ 
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid #007bff',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ margin: '10px 0 0 0', color: '#666' }}>Loading ML data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        border: '1px solid #dc3545', 
        borderRadius: '8px',
        backgroundColor: '#f8d7da'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#721c24' }}>🤖 ML Inventory Insights</h3>
        <div style={{ color: '#721c24', marginBottom: '15px' }}>
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={fetchMLData} 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!mlData) {
    return (
      <div style={{ 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🤖 ML Inventory Insights</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          No ML data available. Please ensure the ML service is running.
        </p>
        <button 
          onClick={fetchMLData} 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ margin: '0', color: '#333' }}>🤖 ML Inventory Insights</h3>
        <div style={{ 
          padding: '4px 8px', 
          borderRadius: '12px', 
          backgroundColor: mlData.health?.status === 'healthy' ? '#d4edda' : '#f8d7da',
          color: mlData.health?.status === 'healthy' ? '#155724' : '#721c24',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {mlData.health?.status === 'healthy' ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '15px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
            {mlData.recommendations?.total_parts || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Total Parts</div>
        </div>
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc3545' }}>
            {mlData.recommendations?.high_priority || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>High Priority</div>
        </div>
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
            {formatCurrency(mlData.optimization?.total_inventory_value)}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Inventory Value</div>
        </div>
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#6f42c1' }}>
            {mlData.modelStats?.total_models || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Models Trained</div>
        </div>
      </div>

      {/* Top Priority Items */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>
          🚨 High Priority Reorders
        </h4>
        <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
          {mlData.recommendations?.recommendations?.filter(rec => rec.priority === 'HIGH').slice(0, 3).map((rec, index) => (
            <div 
              key={index} 
              style={{ 
                padding: '8px', 
                marginBottom: '5px', 
                backgroundColor: '#fff5f5', 
                border: '1px solid #fecaca',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#dc2626' }}>{rec.part_name}</div>
              <div style={{ color: '#666' }}>
                Stock: {rec.current_stock} | Reorder: {rec.reorder_point} | Qty: {Math.round(rec.recommended_order_quantity)}
              </div>
            </div>
          ))}
          {(!mlData.recommendations?.recommendations?.filter(rec => rec.priority === 'HIGH').length) && (
            <div style={{ 
              padding: '10px', 
              textAlign: 'center', 
              color: '#666', 
              fontSize: '12px',
              fontStyle: 'italic'
            }}>
              No high priority items
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'center' 
      }}>
        <button 
          onClick={onViewFull}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          📊 Full Dashboard
        </button>
        <button 
          onClick={onViewSimple}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🔍 Simple View
        </button>
        <button 
          onClick={fetchMLData}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default MLDashboardWidget;
