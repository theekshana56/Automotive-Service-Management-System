import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../store/auth';
import React from 'react';
import Swal from 'sweetalert2';

export default function BookingsManagement() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/all');
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/report`);
      const report = response.data.report;
      
      const reportText = `
AUTO ELITE - Service Booking Report
====================================

Report Generated: ${new Date().toLocaleString()}


CUSTOMER INFORMATION:
Name: ${report.customerName}
Email: ${report.customerEmail}
Phone: ${report.customerPhone}

SERVICE DETAILS:
Service Type: ${report.serviceType}
Date: ${report.date}
Time Slot: ${report.timeSlot}
Status: ${report.status}
Estimated Duration: ${report.estimatedDuration} minutes

VEHICLE INFORMATION:
Model: ${report.vehicleModel}
Year: ${report.vehicleYear}
License Plate: ${report.vehiclePlate}

ADVISOR INFORMATION:
${report.advisorName ? `Name: ${report.advisorName}\nEmail: ${report.advisorEmail}\nPhone: ${report.advisorPhone}` : 'Not assigned yet'}

TIMELINE:
Booked At: ${report.bookedAt}
${report.canModifyUntil ? `Can Modify Until: ${report.canModifyUntil}\n` : ''}${report.serviceStartTime ? `Service Start: ${report.serviceStartTime}\n` : ''}${report.serviceEndTime ? `Service End: ${report.serviceEndTime}\n` : ''}${report.queuePosition ? `Queue Position: #${report.queuePosition}\n` : ''}${report.queueStartTime ? `Queue Start: ${report.queueStartTime}\n` : ''}${report.estimatedServiceTime ? `Estimated Service: ${report.estimatedServiceTime}\n` : ''}
${report.notes ? `NOTES:\n${report.notes}` : ''}

Thank you for choosing AUTO ELITE for your automotive service needs.
Premium Service • Professional Care • Elite Experience
      `;

      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auto-elite-booking-report-${report.bookingId}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Report generated and downloaded successfully!',
        confirmButtonColor: '#4fffb0',
        background: '#0f1724',
        color: '#dbeafe'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to generate report',
        confirmButtonColor: '#3fa7ff',
        background: '#0f1724',
        color: '#dbeafe'
      });
    }
  };

  const generatePDFReport = async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/report/pdf`, {
        responseType: 'blob' // Important for PDF download
      });
      
      // Create and download the PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auto-elite-booking-report-${bookingId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'PDF report generated and downloaded successfully!',
        confirmButtonColor: '#4fffb0',
        background: '#0f1724',
        color: '#dbeafe'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to generate PDF report',
        confirmButtonColor: '#3fa7ff',
        background: '#0f1724',
        color: '#dbeafe'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Queued': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = searchTerm === '' || 
      booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.vehicle?.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.serviceType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-gray-600">Loading bookings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">Bookings Management</h1>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="input max-w-xs"
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Queued">Queued</option>
        </select>
        
        <input
          type="text"
          placeholder="Search by customer name, vehicle plate, or service type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input flex-1"
        />
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map(booking => (
          <div key={booking._id} className="glass-panel p-6 border border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-lg">{booking.serviceType}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                  {booking.status === 'Queued' && booking.queuePosition && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-200 text-purple-800">
                      Queue #{booking.queuePosition}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted mb-1">
                  {booking.user?.name} • {booking.date} • {booking.timeSlot}
                </p>
                <p className="text-sm text-muted">
                  {booking.vehicle?.model} ({booking.vehicle?.plate})
                </p>
                {booking.advisor && (
                  <p className="text-sm text-muted mt-1">
                    Advisor: {booking.advisor.name}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => generateReport(booking._id)}
                  className="btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
                >
                  📄 Text Report
                </button>
                <button 
                  onClick={() => generatePDFReport(booking._id)}
                  className="btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                >
                  📋 PDF Report
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredBookings.length === 0 && (
          <div className="text-center py-8 text-muted">
            No bookings found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
