import { useEffect, useState } from 'react';
import api from '../api/client';
import React from 'react';
import Swal from 'sweetalert2';

const BACKEND_URL = "";

export default function ManageUsers(){
  const [users,setUsers]=useState([]);
  const [roleFor,setRoleFor]=useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);

  const load=async()=>{ const {data}=await api.get('/users'); setUsers(data.users); };
  useEffect(()=>{ load(); }, []);

  const setRole=async(id,role)=>{
    await api.post('/users/set-role',{ userId:id, role });
    await load();
  };

  const viewUserStats = async (userId) => {
    try {
      const { data } = await api.get(`/users/${userId}/stats`);
      setUserStats(data);
      setSelectedUser(userId);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load user stats',
        confirmButtonColor: '#3fa7ff',
        background: '#0f1724',
        color: '#dbeafe'
      });
    }
  };

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">Manage Users</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 text-muted font-medium">Name</th>
              <th className="text-left p-3 text-muted font-medium">Email</th>
              <th className="text-left p-3 text-muted font-medium">Role</th>
              <th className="text-left p-3 text-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.avatarUrl || '/assets/logo.svg'} 
                      alt="User Avatar" 
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/logo.svg';
                      }}
                    />
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="p-3 text-muted">{user.email}</td>
                <td className="p-3">
                  <select 
                    value={user.role} 
                    onChange={(e) => setRole(user._id, e.target.value)}
                    className="px-2 py-1 rounded border border-white/10 bg-surface/60 text-slate-200 text-sm"
                  >
                    <option value="user">User</option>
                    <option value="advisor">Advisor</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-3">
                  <button 
                    onClick={() => viewUserStats(user._id)}
                    className="btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
                  >
                    View Stats
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {userStats && (
        <div className="mt-6 glass-panel p-6">
          <h2 className="text-lg font-semibold mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{userStats.totalBookings}</div>
              <div className="text-sm text-muted">Total Bookings</div>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent">{userStats.completedServices}</div>
              <div className="text-sm text-muted">Completed Services</div>
            </div>
            <div className="text-center p-4 bg-accent2/10 rounded-lg">
              <div className="text-2xl font-bold text-accent2">{userStats.cancelledBookings}</div>
              <div className="text-sm text-muted">Cancelled Bookings</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
