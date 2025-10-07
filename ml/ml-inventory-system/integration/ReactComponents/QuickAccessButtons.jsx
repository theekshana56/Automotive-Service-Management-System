/**
 * Quick Access Buttons Component
 * Provides easy navigation to different ML dashboard views
 */

import React from 'react';

const QuickAccessButtons = ({ onViewFullML, onViewSimpleML, onViewMain }) => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: '20px', 
      right: '20px', 
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Main Dashboard Button */}
      <button 
        onClick={onViewMain}
        style={{ 
          padding: '12px 16px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '160px'
        }}
        title="Go to Main Dashboard"
      >
        <span style={{ fontSize: '16px' }}>🏠</span>
        Main Dashboard
      </button>

      {/* Full ML Dashboard Button */}
      <button 
        onClick={onViewFullML}
        style={{ 
          padding: '12px 16px', 
          backgroundColor: '#28a745', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '160px'
        }}
        title="Open Full ML Dashboard"
      >
        <span style={{ fontSize: '16px' }}>🤖</span>
        Full ML Dashboard
      </button>

      {/* Simple ML Dashboard Button */}
      <button 
        onClick={onViewSimpleML}
        style={{ 
          padding: '12px 16px', 
          backgroundColor: '#6f42c1', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '160px'
        }}
        title="Open Simple ML View"
      >
        <span style={{ fontSize: '16px' }}>🔍</span>
        Simple ML View
      </button>

      {/* ML Widget Toggle Button */}
      <button 
        onClick={() => window.location.reload()}
        style={{ 
          padding: '12px 16px', 
          backgroundColor: '#dc3545', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '160px'
        }}
        title="Refresh ML Data"
      >
        <span style={{ fontSize: '16px' }}>🔄</span>
        Refresh ML Data
      </button>
    </div>
  );
};

export default QuickAccessButtons;
