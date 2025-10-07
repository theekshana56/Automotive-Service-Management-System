import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaCar, FaTools, FaDollarSign, FaFilter, FaDownload, FaSearch, FaHistory } from 'react-icons/fa';
import api from '../../api/client';
import { jobHistoryApi } from '../../services/advisor/jobHistoryApi';
import JobTimeline from '../../components/advisor/JobTimeline';
import JobStatusUpdate from '../../components/advisor/JobStatusUpdate';

const History = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    totalRevenue: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    serviceType: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/advisor/history', {
        params: {
          ...filters,
          search: searchTerm
        }
      });
      setBookings(response.data.bookings || []);
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      // Fallback to sample data
      setBookings([
        {
          _id: '1',
          serviceType: 'Oil Change',
          customer: { name: 'John Doe', phone: '+1234567890' },
          vehicle: { model: 'Toyota Camry', year: 2020, plate: 'ABC-123' },
          date: '2025-09-15',
          timeSlot: '09:00-10:00',
          status: 'completed',
          totalCost: 75.00,
          notes: 'Regular maintenance completed',
          createdAt: '2025-09-15T09:00:00Z'
        },
        {
          _id: '2',
          serviceType: 'Brake Repair',
          customer: { name: 'Jane Smith', phone: '+1234567891' },
          vehicle: { model: 'Honda Civic', year: 2019, plate: 'XYZ-456' },
          date: '2025-09-14',
          timeSlot: '14:00-16:00',
          status: 'completed',
          totalCost: 250.00,
          notes: 'Front brake pads and rotors replaced',
          createdAt: '2025-09-14T14:00:00Z'
        },
        {
          _id: '3',
          serviceType: 'Engine Diagnostic',
          customer: { name: 'Mike Johnson', phone: '+1234567892' },
          vehicle: { model: 'Ford Focus', year: 2018, plate: 'DEF-789' },
          date: '2025-09-13',
          timeSlot: '10:00-12:00',
          status: 'completed',
          totalCost: 120.00,
          notes: 'Engine check light diagnosed and resolved',
          createdAt: '2025-09-13T10:00:00Z'
        }
      ]);
      setStats({
        totalJobs: 45,
        completedJobs: 42,
        totalRevenue: 8750.00,
        averageRating: 4.8
      });
    } finally {
      setLoading(false);
    }
  };

  // Export a single booking as PDF using existing booking report endpoint
  const exportSingleBooking = async (bookingId) => {
    try {
      const response = await api.get(`/api/bookings/${bookingId}/report/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-${bookingId}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export booking PDF', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const exportHistory = async () => {
    try {
      setLoading(true);
      const response = await jobHistoryApi.generateJobHistoryPDF(filters);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-history-report-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTimeline = (booking) => {
    setSelectedBooking(booking);
    setShowTimeline(true);
  };

  const handleStatusUpdate = () => {
    // Refresh the history data
    fetchHistory();
    setShowTimeline(false);
    setSelectedBooking(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.serviceType.toLowerCase().includes(searchLower) ||
        booking.customer.name.toLowerCase().includes(searchLower) ||
        booking.vehicle.model.toLowerCase().includes(searchLower) ||
        booking.vehicle.plate.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Work History</h1>
          <p className="text-slate-400">Track your completed jobs and performance metrics</p>
        </header>

        {/* Stats: Keep only Total Jobs */}
        <section className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Jobs</p>
                <p className="text-2xl font-bold text-white">{stats.totalJobs}</p>
              </div>
              <FaTools className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </section>

        {/* Filters and Search */}
        <section className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <form onSubmit={handleSearch} className="flex-1 flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by service, customer, or vehicle..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </form>
            
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button
                onClick={exportHistory}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FaDownload className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </section>

        {/* History Table */}
        <section className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Job History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaCalendarAlt className="w-4 h-4 text-slate-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-white">{booking.date}</div>
                          <div className="text-sm text-slate-400 flex items-center">
                            <FaClock className="w-3 h-3 mr-1" />
                            {booking.timeSlot}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{booking.serviceType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaUser className="w-4 h-4 text-slate-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-white">{booking.customer.name}</div>
                          <div className="text-sm text-slate-400">{booking.customer.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaCar className="w-4 h-4 text-slate-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-white">{booking.vehicle.model}</div>
                          <div className="text-sm text-slate-400">{booking.vehicle.year} • {booking.vehicle.plate}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300 max-w-xs truncate">
                        {booking.notes || 'No notes'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewTimeline(booking)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                        >
                          <FaHistory className="w-3 h-3" />
                          Timeline
                        </button>
                        <JobStatusUpdate 
                          bookingId={booking._id} 
                          currentStatus={booking.status}
                          onStatusUpdate={handleStatusUpdate}
                        />
                        <button
                          onClick={() => exportSingleBooking(booking._id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                        >
                          <FaDownload className="w-3 h-3" />
                          Export
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBookings.length === 0 && (
              <div className="text-center py-12">
                <FaCalendarAlt className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No history records found</p>
                <p className="text-slate-500 text-sm">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Job Timeline Modal */}
      {showTimeline && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Job Timeline - {selectedBooking.vehicle?.plate || selectedBooking.vehicle?.model}
                </h2>
                <button
                  onClick={() => setShowTimeline(false)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <JobTimeline bookingId={selectedBooking._id} />
                
                <div className="bg-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Job Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400">Service:</span>
                      <span className="text-white ml-2">{selectedBooking.serviceType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Customer:</span>
                      <span className="text-white ml-2">{selectedBooking.customer?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Vehicle:</span>
                      <span className="text-white ml-2">
                        {selectedBooking.vehicle?.model} ({selectedBooking.vehicle?.year})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Date:</span>
                      <span className="text-white ml-2">{selectedBooking.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Cost:</span>
                      <span className="text-white ml-2">${selectedBooking.totalCost}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;




