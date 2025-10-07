import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../store/auth';
import React from 'react';
import Swal from 'sweetalert2';

export default function MyBookings(){
  const { user } = useAuth();
  const [items,setItems] = useState([]);
  const load = async ()=>{ const {data} = await api.get('/api/bookings/mine'); setItems(data.bookings); };
  useEffect(()=>{ load(); }, []);

  const cancelBooking = async (bookingId) => {
    try {
      await api.delete(`/api/bookings/${bookingId}`);
      await load(); // Reload the list
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to cancel booking',
        confirmButtonColor: '#3fa7ff',
        background: '#0f1724',
        color: '#dbeafe'
      });
    }
  };

  const completeService = async (bookingId) => {
    try {
      await api.post(`/api/bookings/${bookingId}/complete`);
      await load(); // Reload the list
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Service marked as completed!',
        confirmButtonColor: '#4fffb0',
        background: '#0f1724',
        color: '#dbeafe'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to complete service',
        confirmButtonColor: '#3fa7ff',
        background: '#0f1724',
        color: '#dbeafe'
      });
    }
  };

  const freeSlot = async (bookingId) => {
    try {
      await api.post(`/api/bookings/${bookingId}/free-slot`);
      await load(); // Reload the list
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Slot freed successfully!',
        confirmButtonColor: '#4fffb0',
        background: '#0f1724',
        color: '#dbeafe'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to free slot',
        confirmButtonColor: '#3fa7ff',
        background: '#0f1724',
        color: '#dbeafe'
      });
    }
  };

  const generateReport = async (bookingId) => {
    try {
      const response = await api.get(`/api/bookings/${bookingId}/report`);
      const report = response.data.report;
      
      // Create a formatted report text
      const reportText = `
AUTOMOTIVE SERVICE MANAGEMENT SYSTEM
====================================
BOOKING REPORT
====================================

Booking ID: ${report.bookingId}
Report Generated: ${new Date(report.reportGeneratedAt).toLocaleString()}

CUSTOMER INFORMATION:
--------------------
Name: ${report.customer.name}
Email: ${report.customer.email}
Phone: ${report.customer.phone}

SERVICE DETAILS:
----------------
Service Type: ${report.service.type}
Date: ${report.service.date}
Time Slot: ${report.service.timeSlot}
Status: ${report.service.status}
Estimated Duration: ${report.service.estimatedDuration} minutes

VEHICLE INFORMATION:
--------------------
Make: ${report.vehicle.make}
Model: ${report.vehicle.model}
Year: ${report.vehicle.year}
License Plate: ${report.vehicle.plate}

ADVISOR INFORMATION:
--------------------
${report.advisor ? `Name: ${report.advisor.name}
Email: ${report.advisor.email}
Phone: ${report.advisor.phone}` : 'Not assigned yet'}

TIMELINE:
---------
Booked At: ${new Date(report.timeline.bookedAt).toLocaleString()}
Can Modify Until: ${report.timeline.canModifyUntil ? new Date(report.timeline.canModifyUntil).toLocaleString() : 'N/A'}
${report.timeline.serviceStartTime ? `Service Start: ${new Date(report.timeline.serviceStartTime).toLocaleString()}` : ''}
${report.timeline.serviceEndTime ? `Service End: ${new Date(report.timeline.serviceEndTime).toLocaleString()}` : ''}
${report.timeline.queuePosition ? `Queue Position: #${report.timeline.queuePosition}` : ''}
${report.timeline.queueStartTime ? `Queue Start: ${new Date(report.timeline.queueStartTime).toLocaleString()}` : ''}
${report.timeline.estimatedServiceTime ? `Estimated Service: ${new Date(report.timeline.estimatedServiceTime).toLocaleString()}` : ''}

NOTES:
------
${report.notes || 'No additional notes'}

====================================
End of Report
====================================
      `;

      // Create and download the report as a text file
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-report-${report.bookingId}-${new Date().toISOString().split('T')[0]}.txt`;
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
      const response = await api.get(`/api/bookings/${bookingId}/report/pdf`, {
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

  const canCancel = (booking) => {
    if (booking.status === 'Cancelled') return false;
    return new Date() < new Date(booking.canModifyUntil);
  };

  const formatDeadline = (deadline) => {
    return new Date(deadline).toLocaleString();
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

  const formatEstimatedTime = (estimatedTime) => {
    if (!estimatedTime) return 'Not available';
    return new Date(estimatedTime).toLocaleString();
  };

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">My Bookings</h1>
      <ul className="divide-y">
        {items.map(b=>(
          <li key={b._id} className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-lg">{b.serviceType}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(b.status)}`}>
                  {b.status}
                </span>
                {b.status === 'Queued' && b.queuePosition && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-accent/20 text-accent border border-accent/30">
                    Queue #{b.queuePosition}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted mb-1">
                {b.date} • {b.timeSlot}
              </p>
              <p className="text-sm text-muted mb-1">
                {b.vehicle?.make} {b.vehicle?.model} ({b.vehicle?.plate})
              </p>
              
              {b.status === 'Queued' && (
                <div className="mt-2 p-3 bg-surface/30 rounded-lg border border-white/20">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-200">Queue Position:</span>
                      <span className="ml-2 text-accent">#{b.queuePosition}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">Estimated Service:</span>
                      <span className="ml-2 text-accent">{formatEstimatedTime(b.estimatedServiceTime)}</span>
                    </div>
                    {b.queueStartTime && (
                      <div className="col-span-2">
                        <span className="font-medium text-slate-200">Joined Queue:</span>
                        <span className="ml-2 text-accent">{new Date(b.queueStartTime).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-2">
                    💡 You'll be automatically assigned an advisor when one becomes available. 
                    You can cancel anytime before the service starts.
                  </p>
                </div>
              )}
              
              {b.advisor && (
                <p className="text-sm text-primary">👨‍🔧 Advisor: {b.advisor.name}</p>
              )}
              {b.status !== 'Cancelled' && b.status !== 'Queued' && (
                <p className="text-xs text-muted">
                  Can cancel until: {formatDeadline(b.canModifyUntil)}
                </p>
              )}
              {b.status === 'Queued' && (
                <p className="text-xs text-muted">
                  Can cancel anytime while in queue
                </p>
              )}
            </div>
            <div className="ml-4 flex flex-col gap-2 md:items-end">
              {/* Generate Report Buttons - Available for all bookings */}
              <div className="flex gap-2">
                <button 
                  onClick={() => generateReport(b._id)}
                  className="btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
                >
                  📄 Text Report
                </button>
                <button 
                  onClick={() => generatePDFReport(b._id)}
                  className="btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                >
                  📋 PDF Report
                </button>
              </div>
              
              {b.status !== 'Cancelled' && (canCancel(b) || b.status === 'Queued') && (
                <button 
                  onClick={() => cancelBooking(b._id)}
                  className={`btn px-3 py-1 text-sm ${
                    b.status === 'Queued' 
                      ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {b.status === 'Queued' ? 'Leave Queue' : 'Cancel'}
                </button>
              )}
              
              {/* Advisor/Manager actions */}
              {(user?.role === 'advisor' || user?.role === 'manager' || user?.role === 'admin') && 
               b.status === 'Confirmed' && (
                <button 
                  onClick={() => completeService(b._id)}
                  className="btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm"
                >
                  Complete Service
                </button>
              )}
              
              {(user?.role === 'advisor' || user?.role === 'manager' || user?.role === 'admin') && 
               b.status === 'In Progress' && (
                <button 
                  onClick={() => freeSlot(b._id)}
                  className="btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
                >
                  Free Slot
                </button>
              )}
              
              {b.status !== 'Cancelled' && b.status !== 'Queued' && !canCancel(b) && (
                <span className="text-xs text-gray-400">Past cancellation deadline</span>
              )}
            </div>
          </li>
        ))}
        {!items.length && <p className="text-muted py-8">No bookings yet.</p>}
      </ul>
    </div>
  );
}
