/**
 * ML Test Component - Simple test to verify ML data is working
 */

import React, { useState, useEffect } from 'react';

const MLTestComponent = () => {
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
      
      console.log('Fetching ML data from /api/ml/dashboard-data...');
      
      const response = await fetch('/api/ml/dashboard-data');
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('ML Data received:', data);
      
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>ML Test Component</h2>
        <p>Loading ML data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>ML Test Component</h2>
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
        <h2>ML Test Component</h2>
        <p>No ML data available.</p>
        <button onClick={fetchMLData} style={{ padding: '10px 20px' }}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>ML Test Component - Data Received!</h2>
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
        <p><strong>Models Loaded:</strong> {mlData.health?.total_models || 0}</p>
        <p><strong>Available Parts:</strong> {mlData.health?.available_parts?.length || 0}</p>
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
            ${mlData.optimization?.total_inventory_value || 0}
          </p>
        </div>
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', textAlign: 'center' }}>
          <h4>Models Trained</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
            {mlData.modelStats?.total_models || 0}
          </p>
        </div>
      </div>

      {/* Raw Data Display */}
      <div style={{ marginTop: '20px' }}>
        <h3>Raw ML Data (for debugging)</h3>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '5px',
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          {JSON.stringify(mlData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default MLTestComponent;
