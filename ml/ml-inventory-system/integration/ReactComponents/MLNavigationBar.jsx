/**
 * ML Navigation Bar Component
 * Provides navigation between different ML dashboard views
 */

import React from 'react';

const MLNavigationBar = ({ currentView, onViewChange }) => {
  const navItems = [
    {
      id: 'main',
      label: 'Main Dashboard',
      icon: '🏠',
      color: '#007bff'
    },
    {
      id: 'ml-simple',
      label: 'Simple ML View',
      icon: '🔍',
      color: '#6f42c1'
    },
    {
      id: 'ml-full',
      label: 'Full ML Dashboard',
      icon: '🤖',
      color: '#28a745'
    }
  ];

  return (
    <div style={{ 
      padding: '15px 20px', 
      backgroundColor: '#f8f9fa', 
      borderBottom: '2px solid #dee2e6',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Logo/Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          fontSize: '24px', 
          padding: '8px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          borderRadius: '8px' 
        }}>
          🤖
        </div>
        <div>
          <h1 style={{ margin: '0', fontSize: '20px', color: '#333' }}>
            ML Inventory Manager
          </h1>
          <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
            AI-Powered Inventory Management
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <div style={{ display: 'flex', gap: '5px' }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            style={{
              padding: '10px 16px',
              backgroundColor: currentView === item.id ? item.color : '#fff',
              color: currentView === item.id ? 'white' : '#333',
              border: `2px solid ${currentView === item.id ? item.color : '#dee2e6'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: currentView === item.id ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
            }}
            onMouseOver={(e) => {
              if (currentView !== item.id) {
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.borderColor = item.color;
              }
            }}
            onMouseOut={(e) => {
              if (currentView !== item.id) {
                e.target.style.backgroundColor = '#fff';
                e.target.style.borderColor = '#dee2e6';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Status Indicator */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: '#d4edda',
        color: '#155724',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        <div style={{ 
          width: '8px', 
          height: '8px', 
          backgroundColor: '#28a745', 
          borderRadius: '50%' 
        }}></div>
        ML Service Online
      </div>
    </div>
  );
};

export default MLNavigationBar;
