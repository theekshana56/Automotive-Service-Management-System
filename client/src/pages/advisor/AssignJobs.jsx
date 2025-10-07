import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { inspectionApi } from '../../services/advisor/inspectionApi';
import { FaCar, FaUser, FaCalendarAlt, FaPlay } from 'react-icons/fa';
import { useAuth } from '../../store/auth';

export default function AssignJobs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bookingId: '',
    vehiclePlate: '',
    jobType: '',
    instructions: '',
    notes: '',
    staffManagerId: ''
  });
  const [inspections, setInspections] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]); // { id, bookingId, plate, job }
  const [staffManagers, setStaffManagers] = useState([]);
  const bookingIdInputRef = React.useRef(null);

  useEffect(() => {
    const state = location.state || {};
    // Prefill from navigation after inspection creation/completion
    if (state.bookingId && state.vehiclePlate && state.jobType) {
      setSelectedItems([{ id: state.bookingId, bookingId: state.bookingId, plate: state.vehiclePlate, job: state.jobType }]);
      setForm(prev => ({
        ...prev,
        instructions: '',
        notes: state.notes || prev.notes,
      }));
    }
  }, [location.state]);

  useEffect(() => {
    const loadInspections = async () => {
      try {
        setListLoading(true);
        const data = await inspectionApi.getAdvisorInspections({ status: 'completed' });
        setInspections(data.items || data.inspections || []);
      } catch (e) {
        // fallback: do nothing if fails
      } finally {
        setListLoading(false);
      }
    };
    
    const loadStaffManagers = async () => {
      try {
        console.log('Loading staff managers...');
        console.log('Current user:', user);
        console.log('User role:', user?.role);
        console.log('User authenticated:', !!user);
        
        const response = await apiClient.get('/api/users/staff?role=staff_manager');
        console.log('Staff managers response:', response.data);
        setStaffManagers(response.data.staff || []);
        console.log('Staff managers loaded:', response.data.staff?.length || 0);
      } catch (e) {
        console.error('Failed to load staff managers:', e);
        console.error('Error details:', e.response?.data);
        console.error('Error status:', e.response?.status);
        console.error('Error message:', e.message);
        console.error('Full error object:', e);
      }
    };
    
    loadInspections();
    if (user) {
      loadStaffManagers();
    }
  }, [user]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const hasSelection = selectedItems.length > 0 || !!form.bookingId;
    if (!hasSelection || !form.instructions) {
      setMessage('Please select a completed inspection (or arrive from inspection) and enter instructions.');
      return;
    }
    if (!form.staffManagerId) {
      setMessage('Please select a staff manager to assign this job to.');
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      if (selectedItems.length > 0) {
        for (const item of selectedItems) {
          await apiClient.post('/api/staff/assignments', {
            bookingId: item.bookingId,
            instructions: form.instructions,
            jobType: item.job,
            vehiclePlate: item.plate,
            notes: form.notes,
            staffManagerId: form.staffManagerId
          });
        }
        setMessage(`Assigned ${selectedItems.length} job(s) successfully. Staff manager notified.`);
      } else {
        await apiClient.post('/api/staff/assignments', {
          bookingId: form.bookingId,
          instructions: form.instructions,
          jobType: form.jobType,
          vehiclePlate: form.vehiclePlate,
          notes: form.notes,
          staffManagerId: form.staffManagerId
        });
        setMessage('Assigned successfully. Staff manager notified.');
      }
      setTimeout(() => navigate('/advisor-dashboard'), 800);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to assign job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-slate-800 p-6 rounded-lg">
        <h1 className="text-2xl font-semibold text-white mb-4">Assign Job</h1>
          {/* Removed visible Selected banner per request */}
        {message && (
          <div className={`mb-4 p-3 rounded ${message.includes('successfully') ? 'bg-green-900/20 border border-green-500 text-green-400' : 'bg-blue-900/20 border border-blue-500 text-blue-400'}`}>
            {message}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          {selectedItems.length > 0 && (
            <div className="space-y-2">
              <label className="block text-white">Selected Vehicles ({selectedItems.length})</label>
              <div className="flex flex-wrap gap-2">
                {selectedItems.map(item => (
                  <span key={item.id} className="px-2 py-1 rounded bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
                    {item.plate}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-white mb-2">Assign to Staff Manager</label>
            <select 
              name="staffManagerId" 
              value={form.staffManagerId} 
              onChange={onChange} 
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600" 
              required
            >
              <option value="">Select a Staff Manager</option>
              {staffManagers.length === 0 ? (
                <option value="" disabled>Loading staff managers...</option>
              ) : (
                staffManagers.map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name} ({manager.email})
                  </option>
                ))
              )}
            </select>
            {staffManagers.length === 0 && (
              <p className="text-yellow-400 text-sm mt-1">No staff managers found. Please contact admin.</p>
            )}
          </div>
          
          <div>
            <label className="block text-white mb-2">Instructions for Staff</label>
            <textarea name="instructions" value={form.instructions} onChange={onChange} rows="4" className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600" placeholder="Describe the tasks to perform" required />
          </div>
          <div>
            <label className="block text-white mb-2">Notes</label>
            <textarea name="notes" value={form.notes} onChange={onChange} rows="3" className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || (!form.instructions) || (selectedItems.length === 0 && !form.bookingId)} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded">
              {loading ? 'Assigning…' : 'Assign'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded">Cancel</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}




