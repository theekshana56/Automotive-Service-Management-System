/**
 * ML Quick Access Component - Floating buttons for ML dashboard access
 * Integrated into existing Inventory Dashboard
 */

import React, { useState } from 'react';

const MLQuickAccess = ({ onViewFullML, onViewSimpleML, onViewMain }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
        title="ML Quick Access"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>

      {/* Expanded Buttons */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-in slide-in-from-right-2 duration-200">
          {/* Main Dashboard */}
          <button 
            onClick={() => {
              onViewMain();
              setIsExpanded(false);
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-semibold transition-all duration-200 min-w-[160px]"
            title="Go to Main Dashboard"
          >
            <span>🏠</span>
            Main Dashboard
          </button>

          {/* Full ML Dashboard */}
          <button 
            onClick={() => {
              onViewFullML();
              setIsExpanded(false);
            }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-semibold transition-all duration-200 min-w-[160px]"
            title="Open Full ML Dashboard"
          >
            <span>🤖</span>
            Full ML Dashboard
          </button>

          {/* Simple ML View */}
          <button 
            onClick={() => {
              onViewSimpleML();
              setIsExpanded(false);
            }}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-semibold transition-all duration-200 min-w-[160px]"
            title="Open Simple ML View"
          >
            <span>🔍</span>
            Simple ML View
          </button>

          {/* Refresh ML Data */}
          <button 
            onClick={() => {
              window.location.reload();
              setIsExpanded(false);
            }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-semibold transition-all duration-200 min-w-[160px]"
            title="Refresh ML Data"
          >
            <span>🔄</span>
            Refresh ML Data
          </button>
        </div>
      )}
    </div>
  );
};

export default MLQuickAccess;
