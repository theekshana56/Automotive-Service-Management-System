import React, { useState, useEffect } from 'react';
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaPlay, FaPause, FaStop } from 'react-icons/fa';
import { jobHistoryApi } from '../../services/advisor/jobHistoryApi';

const JobTimeline = ({ bookingId }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await jobHistoryApi.getJobTimeline(bookingId);
        setTimeline(response.timeline || []);
      } catch (err) {
        console.error('Error fetching job timeline:', err);
        setError('Failed to load job timeline');
        // Fallback to mock data
        setTimeline([
          {
            id: '1',
            timestamp: new Date().toISOString(),
            status: 'Booking Created',
            description: 'Booking created for ABC-1234',
            type: 'booking'
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'Confirmed',
            description: 'Booking confirmed',
            type: 'status-change'
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            status: 'In Progress',
            description: 'Vehicle inspection started',
            type: 'status-change'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchTimeline();
    }
  }, [bookingId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Booking Created':
        return <FaClock className="text-blue-400" />;
      case 'Confirmed':
        return <FaCheckCircle className="text-green-400" />;
      case 'In Progress':
        return <FaPlay className="text-blue-400" />;
      case 'Inspection Complete':
        return <FaCheckCircle className="text-green-400" />;
      case 'Work In Progress':
        return <FaPlay className="text-orange-400" />;
      case 'Completed':
        return <FaCheckCircle className="text-green-400" />;
      case 'Cancelled':
        return <FaTimesCircle className="text-red-400" />;
      case 'On Hold':
        return <FaPause className="text-yellow-400" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Booking Created':
        return 'border-blue-500 bg-blue-900/20';
      case 'Confirmed':
        return 'border-green-500 bg-green-900/20';
      case 'In Progress':
        return 'border-blue-500 bg-blue-900/20';
      case 'Inspection Complete':
        return 'border-green-500 bg-green-900/20';
      case 'Work In Progress':
        return 'border-orange-500 bg-orange-900/20';
      case 'Completed':
        return 'border-green-500 bg-green-900/20';
      case 'Cancelled':
        return 'border-red-500 bg-red-900/20';
      case 'On Hold':
        return 'border-yellow-500 bg-yellow-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Job Timeline</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-700 h-16 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Job Timeline</h3>
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Job Timeline</h3>
      
      {timeline.length === 0 ? (
        <div className="text-center py-8">
          <FaClock className="mx-auto text-4xl text-slate-400 mb-3" />
          <p className="text-slate-400">No timeline data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {timeline.map((item, index) => (
            <div key={item.id} className="relative">
              {/* Timeline line */}
              {index < timeline.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-slate-600"></div>
              )}
              
              <div className={`flex items-start space-x-4 p-4 rounded-lg border ${getStatusColor(item.status)}`}>
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                  {getStatusIcon(item.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">{item.status}</h4>
                    <time className="text-xs text-slate-400">
                      {formatTimestamp(item.timestamp)}
                    </time>
                  </div>
                  
                  <p className="text-sm text-slate-300 mt-1">{item.description}</p>
                  
                  {item.notes && (
                    <p className="text-xs text-slate-400 mt-2 italic">{item.notes}</p>
                  )}
                  
                  <div className="flex items-center mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === 'booking' 
                        ? 'bg-blue-900/30 text-blue-300' 
                        : 'bg-green-900/30 text-green-300'
                    }`}>
                      {item.type === 'booking' ? 'Booking Event' : 'Status Change'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobTimeline;
