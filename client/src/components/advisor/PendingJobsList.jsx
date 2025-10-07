import React, { useState, useEffect } from 'react';
import { FaClock, FaCar, FaUser, FaCalendarAlt, FaPlay } from 'react-icons/fa';
import { inspectionApi } from '../../services/advisor/inspectionApi';

const PendingJobsList = ({ onJobSelect, selectedJob }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await inspectionApi.getPendingJobs();
        setJobs(response.jobs || []);
      } catch (err) {
        console.error('Error fetching pending jobs:', err);
        setError('Failed to load pending jobs');
        // Fallback to mock data for development
        setJobs([
          {
            id: '1',
            vehiclePlate: 'ABC-1234',
            customerName: 'John Smith',
            serviceType: 'Oil Change',
            date: '2024-01-15',
            timeSlot: '09:00 AM',
            priority: 'high',
            notes: 'Customer mentioned engine noise'
          },
          {
            id: '2',
            vehiclePlate: 'XYZ-5678',
            customerName: 'Sarah Johnson',
            serviceType: 'Brake Service',
            date: '2024-01-15',
            timeSlot: '10:30 AM',
            priority: 'medium',
            notes: 'Squeaking brakes'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingJobs();
  }, []);

  const handleStartJob = (job) => {
    if (onJobSelect) {
      onJobSelect(job);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Pending Jobs</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-700 h-20 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Pending Jobs</h2>
        <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm">
          {jobs.length} jobs
        </span>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="text-center py-8">
          <FaClock className="mx-auto text-4xl text-slate-400 mb-3" />
          <p className="text-slate-400">No pending jobs</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div 
              key={job.id} 
              className={`rounded-lg p-4 transition-colors cursor-pointer ${
                selectedJob?.id === job.id 
                  ? 'bg-blue-700 border-2 border-blue-500' 
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              onClick={() => handleStartJob(job)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FaCar className="text-blue-400" />
                    <span className="font-semibold text-white">{job.vehiclePlate}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`}>
                      {job.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-300 mb-2">
                    <div className="flex items-center gap-1">
                      <FaUser />
                      <span>{job.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt />
                      <span>{job.date} at {job.timeSlot}</span>
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-sm mb-2">
                    <strong>Service:</strong> {job.serviceType}
                  </p>
                  
                  {job.notes && (
                    <p className="text-slate-400 text-sm">
                      <strong>Notes:</strong> {job.notes}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartJob(job);
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    selectedJob?.id === job.id
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <FaPlay className="text-xs" />
                  {selectedJob?.id === job.id ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingJobsList;
