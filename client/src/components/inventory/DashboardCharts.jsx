import React from 'react';
import { Bar } from 'react-chartjs-2';

export default function DashboardCharts({ 
  poStatusData, 
  topUsedData, 
  topUsed = [],
  onNavigate,
  className = '' 
}) {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 12 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { size: 12 } }
      }
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Purchase Orders Chart */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="card-title">Purchase Orders by Status</h3>
              <p className="card-subtitle">Current order distribution</p>
            </div>
          </div>
          <button 
            className="btn-ghost text-sm"
            onClick={() => onNavigate('/purchase-orders')}
          >
            View all →
          </button>
        </div>
        <div className="card-body">
          <div className="h-64">
            <Bar data={poStatusData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Top Used Parts Chart */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="card-title">Top Used Parts</h3>
              <p className="card-subtitle">Most consumed inventory</p>
            </div>
          </div>
          <button 
            className="btn-ghost text-sm"
            onClick={() => onNavigate('/parts')}
          >
            Go to parts →
          </button>
        </div>
        <div className="card-body">
          <div className="h-64">
            <Bar 
              data={{
                ...topUsedData,
                datasets: [{
                  ...topUsedData.datasets[0],
                  backgroundColor: 'rgba(79, 255, 176, 0.6)',
                  borderColor: 'rgba(79, 255, 176, 0.8)',
                  borderWidth: 1,
                  borderRadius: 4
                }]
              }} 
              options={chartOptions} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}