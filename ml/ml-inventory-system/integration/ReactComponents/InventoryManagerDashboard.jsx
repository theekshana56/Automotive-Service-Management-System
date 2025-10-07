/**
 * Main Inventory Manager Dashboard with ML Integration
 * This is the main dashboard that includes ML widgets and navigation
 */

import React, { useState } from 'react';
import MLDashboardWidget from './MLDashboardWidget';
import SimpleMLDashboard from './SimpleMLDashboard';
import InventoryDashboard from './InventoryDashboard';

const InventoryManagerDashboard = () => {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'ml-simple', 'ml-full'
  const [showMLWidget, setShowMLWidget] = useState(true);

  const handleViewFullML = () => {
    setCurrentView('ml-full');
  };

  const handleViewSimpleML = () => {
    setCurrentView('ml-simple');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
  };

  const toggleMLWidget = () => {
    setShowMLWidget(!showMLWidget);
  };

  // Main Dashboard View
  if (currentView === 'main') {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <div>
            <h1 style={{ margin: '0', color: '#333', fontSize: '28px' }}>
              📦 Inventory Manager Dashboard
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>
              Manage inventory with AI-powered insights
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={toggleMLWidget}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: showMLWidget ? '#dc3545' : '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {showMLWidget ? 'Hide ML Widget' : 'Show ML Widget'}
            </button>
            <button 
              onClick={handleViewFullML}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🤖 Full ML Dashboard
            </button>
            <button 
              onClick={handleViewSimpleML}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#6f42c1', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔍 Simple ML View
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: showMLWidget ? '2fr 1fr' : '1fr', 
          gap: '20px',
          minHeight: '600px'
        }}>
          {/* Main Inventory Content */}
          <div style={{ 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: '#fff'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
              📊 Inventory Overview
            </h2>
            
            {/* Quick Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px', 
              marginBottom: '30px' 
            }}>
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #dee2e6'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Total Parts</h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>1,247</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Active inventory items</div>
              </div>
              
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #dee2e6'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>In Stock</h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>1,156</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Items available</div>
              </div>
              
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #dee2e6'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Low Stock</h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>91</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Items need reorder</div>
              </div>
              
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #dee2e6'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#6f42c1' }}>Total Value</h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>$2.4M</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Inventory value</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📈 Recent Activity</h3>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '6px',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  <div>
                    <strong>Oil Filter - OF-001</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>Stock updated: 45 → 32 units</div>
                  </div>
                  <div style={{ 
                    padding: '4px 8px', 
                    backgroundColor: '#fff3cd', 
                    color: '#856404',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    LOW STOCK
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  <div>
                    <strong>Brake Pads - BP-002</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>New order received: 100 units</div>
                  </div>
                  <div style={{ 
                    padding: '4px 8px', 
                    backgroundColor: '#d4edda', 
                    color: '#155724',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    RECEIVED
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px 0'
                }}>
                  <div>
                    <strong>Air Filter - AF-003</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>Reorder point reached: 15 units</div>
                  </div>
                  <div style={{ 
                    padding: '4px 8px', 
                    backgroundColor: '#f8d7da', 
                    color: '#721c24',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    REORDER NEEDED
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ML Widget Sidebar */}
          {showMLWidget && (
            <div>
              <MLDashboardWidget 
                onViewFull={handleViewFullML}
                onViewSimple={handleViewSimpleML}
              />
            </div>
          )}
        </div>

        {/* Quick Access Buttons */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🚀 Quick Access</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px' 
          }}>
            <button 
              onClick={handleViewFullML}
              style={{ 
                padding: '15px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '5px' }}>🤖</div>
              <div>Full ML Dashboard</div>
              <div style={{ fontSize: '12px', opacity: '0.8' }}>Complete AI insights</div>
            </button>
            
            <button 
              onClick={handleViewSimpleML}
              style={{ 
                padding: '15px', 
                backgroundColor: '#6f42c1', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '5px' }}>🔍</div>
              <div>Simple ML View</div>
              <div style={{ fontSize: '12px', opacity: '0.8' }}>Quick ML overview</div>
            </button>
            
            <button 
              style={{ 
                padding: '15px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '5px' }}>📊</div>
              <div>Inventory Reports</div>
              <div style={{ fontSize: '12px', opacity: '0.8' }}>Generate reports</div>
            </button>
            
            <button 
              style={{ 
                padding: '15px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '5px' }}>⚠️</div>
              <div>Reorder Alerts</div>
              <div style={{ fontSize: '12px', opacity: '0.8' }}>View urgent items</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Simple ML Dashboard View
  if (currentView === 'ml-simple') {
    return (
      <div>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: '0', color: '#333' }}>🔍 Simple ML Dashboard</h2>
          <button 
            onClick={handleBackToMain}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Main Dashboard
          </button>
        </div>
        <SimpleMLDashboard />
      </div>
    );
  }

  // Full ML Dashboard View
  if (currentView === 'ml-full') {
    return (
      <div>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: '0', color: '#333' }}>🤖 Full ML Dashboard</h2>
          <button 
            onClick={handleBackToMain}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Main Dashboard
          </button>
        </div>
        <InventoryDashboard />
      </div>
    );
  }

  return null;
};

export default InventoryManagerDashboard;
