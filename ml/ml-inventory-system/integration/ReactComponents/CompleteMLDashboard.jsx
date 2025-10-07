/**
 * Complete ML Dashboard with Navigation
 * This is the main component that combines everything
 */

import React, { useState } from 'react';
import MLNavigationBar from './MLNavigationBar';
import InventoryManagerDashboard from './InventoryManagerDashboard';
import SimpleMLDashboard from './SimpleMLDashboard';
import InventoryDashboard from './InventoryDashboard';
import QuickAccessButtons from './QuickAccessButtons';

const CompleteMLDashboard = () => {
  const [currentView, setCurrentView] = useState('main');

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleViewMain = () => {
    setCurrentView('main');
  };

  const handleViewFullML = () => {
    setCurrentView('ml-full');
  };

  const handleViewSimpleML = () => {
    setCurrentView('ml-simple');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Navigation Bar */}
      <MLNavigationBar 
        currentView={currentView} 
        onViewChange={handleViewChange} 
      />

      {/* Quick Access Buttons (Floating) */}
      <QuickAccessButtons 
        onViewMain={handleViewMain}
        onViewFullML={handleViewFullML}
        onViewSimpleML={handleViewSimpleML}
      />

      {/* Main Content */}
      <div style={{ padding: '0' }}>
        {currentView === 'main' && (
          <InventoryManagerDashboard 
            currentView={currentView}
            onViewChange={handleViewChange}
          />
        )}
        
        {currentView === 'ml-simple' && (
          <div style={{ padding: '20px' }}>
            <SimpleMLDashboard />
          </div>
        )}
        
        {currentView === 'ml-full' && (
          <div style={{ padding: '20px' }}>
            <InventoryDashboard />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '50px',
        padding: '20px', 
        backgroundColor: '#343a40', 
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>🤖 ML Inventory Management System</strong>
        </div>
        <div style={{ fontSize: '12px', opacity: '0.8' }}>
          Powered by AI • Predictive Analytics • Just-In-Time Inventory
        </div>
      </div>
    </div>
  );
};

export default CompleteMLDashboard;
