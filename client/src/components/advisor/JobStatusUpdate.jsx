import React, { useState } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import { jobHistoryApi } from '../../services/advisor/jobHistoryApi';

const JobStatusUpdate = ({ bookingId, currentStatus, onStatusUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newStatus: '',
    notes: ''
  });
  const [message, setMessage] = useState('');

  const statusOptions = [
    { value: 'Pending', label: 'Pending', color: 'text-yellow-400' },
    { value: 'Confirmed', label: 'Confirmed', color: 'text-blue-400' },
    { value: 'In Progress', label: 'In Progress', color: 'text-blue-400' },
    { value: 'Inspection Complete', label: 'Inspection Complete', color: 'text-green-400' },
    { value: 'Work In Progress', label: 'Work In Progress', color: 'text-orange-400' },
    { value: 'Completed', label: 'Completed', color: 'text-green-400' },
    { value: 'Cancelled', label: 'Cancelled', color: 'text-red-400' },
    { value: 'On Hold', label: 'On Hold', color: 'text-yellow-400' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.newStatus) {
      setMessage('Please select a new status');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const updateData = {
        newStatus: formData.newStatus,
        notes: formData.notes
      };

      await jobHistoryApi.updateJobStatus(bookingId, updateData);
      
      setMessage('Status updated successfully!');
      
      // Reset form
      setFormData({
        newStatus: '',
        notes: ''
      });
      
      // Close modal and notify parent
      setTimeout(() => {
        setIsOpen(false);
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error updating job status:', error);
      setMessage('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFormData({
      newStatus: '',
      notes: ''
    });
    setMessage('');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      await jobHistoryApi.deleteBooking(bookingId);
      
      setMessage('Booking deleted successfully!');
      
      // Close modal and notify parent
      setTimeout(() => {
        setIsOpen(false);
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error deleting booking:', error);
      setMessage('Failed to delete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <FaSave className="text-sm" />
        Update Status
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Update Job Status</h3>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.includes('successfully') 
              ? 'bg-green-900/20 border border-green-500 text-green-400' 
              : 'bg-red-900/20 border border-red-500 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2">Current Status</label>
            <div className="p-3 bg-slate-700 rounded text-slate-300">
              {currentStatus}
            </div>
          </div>

          <div>
            <label className="block text-white mb-2">New Status *</label>
            <select
              name="newStatus"
              value={formData.newStatus}
              onChange={handleInputChange}
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
              required
            >
              <option value="">Select new status</option>
              {statusOptions
                .filter(option => option.value !== currentStatus)
                .map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              }
            </select>
          </div>

          <div>
            <label className="block text-white mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
              placeholder="Add any notes about this status change..."
            />
          </div>


          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobStatusUpdate;
