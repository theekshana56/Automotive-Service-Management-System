import { useState, useEffect } from 'react';
import api from '../api/client';
import Input from '../components/Input';
import React from 'react';
import Swal from 'sweetalert2';

export default function AdminDashboard() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('staff');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'advisor',
    specializations: [],
    isAvailable: true,
    maxConcurrentBookings: 1,
    department: '',
    permissions: []
  });
  const [message, setMessage] = useState('');

  const roles = ['advisor', 'manager', 'admin'];
  const specializations = ['General Service', 'Oil Change', 'Diagnostics', 'Body Work'];
  const permissions = ['manage_bookings', 'manage_users', 'view_reports', 'manage_inventory'];

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/staff');
      setStaff(response.data.staff || []);
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (editingStaff) {
        await api.put(`/api/users/staff/${editingStaff._id}`, form);
        setMessage('Staff member updated successfully!');
      } else {
        await api.post('/api/users/staff', form);
        setMessage('Staff member created successfully!');
      }
      
      setShowForm(false);
      setEditingStaff(null);
      resetForm();
      loadStaff();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to save staff member');
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setForm({
      name: staffMember.name,
      email: staffMember.email,
      password: '',
      role: staffMember.role,
      specializations: staffMember.specializations || [],
      isAvailable: staffMember.isAvailable,
      maxConcurrentBookings: staffMember.maxConcurrentBookings || 1,
      department: staffMember.department || '',
      permissions: staffMember.permissions || []
    });
    setShowForm(true);
  };

  const handleDelete = async (staffId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4fffb0',
      cancelButtonColor: '#3fa7ff',
      confirmButtonText: 'Yes, delete it!',
      background: '#0f1724',
      color: '#dbeafe'
    });
    
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/users/staff/${staffId}`);
        setMessage('Staff member deleted successfully!');
        loadStaff();
      } catch (error) {
        setMessage(error.response?.data?.message || 'Failed to delete staff member');
      }
    }
  };

  const toggleAvailability = async (staffId, currentStatus) => {
    try {
      await api.patch(`/api/users/staff/${staffId}/availability`, {
        isAvailable: !currentStatus
      });
      setMessage('Staff availability updated!');
      loadStaff();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update availability');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'advisor',
      specializations: [],
      isAvailable: true,
      maxConcurrentBookings: 1,
      department: '',
      permissions: []
    });
  };

  const toggleSpecialization = (spec) => {
    setForm(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const togglePermission = (permission) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-gray-600">Loading staff...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold section-title">Staff Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Add New Staff Member
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'staff'
              ? 'border-primary text-primary border-b-2'
              : 'text-muted hover:text-slate-100 hover:border-white/10'
          }`}
        >
          Staff Members
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'audit'
              ? 'border-primary text-primary border-b-2'
              : 'text-muted hover:text-slate-100 hover:border-white/10'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {activeTab === 'staff' && (
        <>
          {showForm && (
            <div className="glass-panel p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    required
                  />
                </div>
                
                {!editingStaff && (
                  <Input
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    required
                  />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({...form, role: e.target.value})}
                      className="input"
                    >
                      {roles.map(role => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) => setForm({...form, department: e.target.value})}
                      className="input"
                      placeholder="e.g., Service, Sales, Admin"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="label">Specializations</label>
                  <div className="flex flex-wrap gap-2">
                    {specializations.map(spec => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                          form.specializations.includes(spec)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-transparent text-muted border-white/20 hover:border-primary/40'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="label">Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {permissions.map(permission => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="mr-2"
                        />
                        <span className="text-sm">{permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Max Concurrent Bookings</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={form.maxConcurrentBookings}
                      onChange={(e) => setForm({...form, maxConcurrentBookings: parseInt(e.target.value)})}
                      className="input"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={form.isAvailable}
                      onChange={(e) => setForm({...form, isAvailable: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="isAvailable">Available for bookings</label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">
                    {editingStaff ? 'Update Staff Member' : 'Create Staff Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingStaff(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {staff.map(staffMember => (
              <div key={staffMember._id} className="glass-panel p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-1">{staffMember.name}</h3>
                    <p className="text-muted mb-2">{staffMember.email}</p>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg capitalize">
                        {staffMember.role}
                      </span>
                      {staffMember.department && (
                        <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-lg">
                          {staffMember.department}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {staffMember.specializations?.map(spec => (
                        <span key={spec} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg">
                          {spec}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted">
                      Max bookings: {staffMember.maxConcurrentBookings} • 
                      Status: <span className={staffMember.isAvailable ? 'text-green-400' : 'text-red-400'}>
                        {staffMember.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </p>
                    {staffMember.permissions && staffMember.permissions.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-muted">Permissions: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {staffMember.permissions.map(permission => (
                            <span key={permission} className="px-2 py-1 bg-accent2/20 text-accent2 text-xs rounded">
                              {permission.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(staffMember)}
                      className="btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleAvailability(staffMember._id, staffMember.isAvailable)}
                      className={`btn px-3 py-1 text-sm ${
                        staffMember.isAvailable 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {staffMember.isAvailable ? 'Set Unavailable' : 'Set Available'}
                    </button>
                    <button
                      onClick={() => handleDelete(staffMember._id)}
                      className="btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {staff.length === 0 && (
              <div className="text-center py-8 text-muted">
                No staff members found.
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'audit' && (
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-4">Recent System Activity</h2>
          <p className="text-muted">Audit logs and system activity monitoring will be displayed here.</p>
          {/* Add audit log functionality here */}
        </div>
      )}
    </div>
  );
}
