import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { initSocket } from '../../services/socket';

export default function HRManagerDashboard(){
  const [form, setForm] = useState({ name: '', email: '', password: '', baseSalary: 4000 });
  const [adjust, setAdjust] = useState({ email: '', amount: 0 });
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [salaryByEmail, setSalaryByEmail] = useState({});
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [otForm, setOtForm] = useState({ email: '', rate: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  // Test HR manager login functionality
  const [testLogin, setTestLogin] = useState({ email: 'hr@autoelite.com', password: 'password123' });

  // Forum states
  const [forumQuestions, setForumQuestions] = useState([]);
  const [forumStats, setForumStats] = useState({ total: 0, pending: 0, answered: 0, highPriority: 0 });
  const [loadingForum, setLoadingForum] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [responseForm, setResponseForm] = useState({ response: '' });

  // Quick KPIs
  const totalStaff = Array.isArray(staff) ? staff.length : 0;
  const pendingCount = Array.isArray(pending) ? pending.length : 0;
  const avgBaseSalary = totalStaff > 0
    ? Math.round((staff.reduce((sum, s) => {
        const staffData = s.salarySummary?.staff || {};
        const regularPay = staffData.regularPay ?? staffData.baseSalary ?? s.salary?.basic ?? 0;
        return sum + Number(regularPay || 0);
      }, 0) / totalStaff) * 100) / 100
    : 0;

  const loadPending = async () => {
    try {
      const { data } = await api.get('/api/hr/attendance/pending');
      setPending(data.pending || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => { loadPending(); }, []);

  // Forum functions
  const loadForumQuestions = async () => {
    try {
      setLoadingForum(true);
      const { data } = await api.get('/api/contact/forum/questions?limit=50');
      if (data.success) {
        setForumQuestions(data.data.questions || []);
      }
    } catch (error) {
      console.error('Failed to load forum questions:', error);
    } finally {
      setLoadingForum(false);
    }
  };

  const loadForumStats = async () => {
    try {
      const { data } = await api.get('/api/contact/forum/stats');
      if (data.success) {
        setForumStats(data.data.overview || { total: 0, pending: 0, answered: 0, highPriority: 0 });
      }
    } catch (error) {
      console.error('Failed to load forum stats:', error);
    }
  };

  const handleQuestionResponse = async (questionId) => {
    try {
      const { data } = await api.put(`/api/contact/forum/questions/${questionId}/status`, {
        status: 'answered',
        response: responseForm.response
      });

      if (data.success) {
        setMessage('Response sent successfully!');
        setSelectedQuestion(null);
        setResponseForm({ response: '' });
        await loadForumQuestions();
        await loadForumStats();
      }
    } catch (error) {
      setMessage('Failed to send response');
      console.error('Error sending response:', error);
    }
  };

  const markQuestionInProgress = async (questionId) => {
    try {
      await api.put(`/api/contact/forum/questions/${questionId}/status`, {
        status: 'in-progress'
      });
      await loadForumQuestions();
      setMessage('Question marked as in progress');
    } catch (error) {
      console.error('Failed to update question status:', error);
    }
  };

  const reloadStaffAndSalary = async () => {
    try {
      setLoadingStaff(true);
      let list = [];
      let salaryData = {};

      // First, try to get all staff salary data in one call
      try {
        console.log('🔗 HR Manager loading all staff salary data...');
        console.log('🔗 Making API call to:', '/api/hr/staff/salary');
        console.log('🔗 User token exists:', !!localStorage.getItem('token'));

        const { data } = await api.get('/api/hr/staff/salary');
        console.log('✅ All staff salary data:', data);
        console.log('✅ Response status:', data ? 'success' : 'no data');
        salaryData = Array.isArray(data?.staff) ? data.staff : [];
        console.log('Parsed salary data:', salaryData);
      } catch (err) {
        console.error('Failed to load staff salary data from /api/hr/staff/salary', err);
        salaryData = [];
      }

      // Then get staff list from users
      try {
        const { data } = await api.get('/api/users');
        const all = Array.isArray(data?.users) ? data.users : [];
        list = all
          .filter(u => u.role === 'staff_manager')
          .map(u => {
            const normalizedEmail = u.email.toLowerCase().trim();
            const matchingSalary = salaryData.find(s => s.email.toLowerCase() === normalizedEmail) || {};
            console.log(`Matching ${u.email} with salary data:`, matchingSalary);
            return {
              _id: u._id,
              userId: u._id,
              name: u.name,
              email: u.email,
              role: u.role,
              salary: u.salary || {},
              // Add salary summary from the all staff salary data
              salarySummary: {
                staff: matchingSalary,
                currentMonth: matchingSalary
              }
            };
          });
      } catch (err) {
        console.error('Failed to load staff managers from /api/users', err);
        list = [];
      }

      // Fallback: if no data from users, try staff endpoint
      if (list.length === 0) {
        try {
          const { data } = await api.get('/api/staff');
          const staffArr = Array.isArray(data?.staff) ? data.staff : [];
          list = staffArr
            .filter(s => s.role === 'staff_manager')
            .map(s => ({
              _id: s.userId || s._id,
              userId: s.userId || s._id,
              name: s.name,
              email: s.email,
              role: 'staff_manager',
              salary: s.salary || {},
              salarySummary: {
                staff: salaryData.find(sd => sd.email.toLowerCase() === s.email.toLowerCase().trim()) || {},
                currentMonth: salaryData.find(sd => sd.email.toLowerCase() === s.email.toLowerCase().trim()) || {}
              }
            }));
        } catch (err) {
          console.error('Failed to load fallback staff managers', err);
        }
      }

      setStaff(list);
      console.log('Final staff list with salary data:', list);
    } catch (error) {
      console.error('Failed to load staff/salary data', error);
      setMessage('Failed to load staff information');
    } finally {
      setLoadingStaff(false);
      setLoadingSalary(false);
    }
  };

  useEffect(() => { (async () => { await reloadStaffAndSalary(); })(); }, []);

  // Load forum data on component mount
  useEffect(() => {
    loadForumQuestions();
    loadForumStats();
  }, []);

  useEffect(() => {
    let socket;
    (async () => {
      socket = await initSocket({ url: 'http://localhost:5000' });
      if (!socket) return;
      try { socket.off('hr:update'); } catch (_) {}
      socket.on('hr:update', async () => {
        await reloadStaffAndSalary();
      });
      socket.__hrDashHandler = true;
    })();
    return () => {
      try {
        if (socket && socket.__hrDashHandler) {
          socket.off('hr:update');
        }
      } catch (_) {}
    };
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const { data } = await api.post('/api/hr/staff', form);
      setMessage(`Created: ${data.user?.email}`);
      await reloadStaffAndSalary();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create staff');
    }
  };

  const onAdjust = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const { data } = await api.patch(`/api/hr/staff/${encodeURIComponent(adjust.email)}/pay`, { amount: Number(adjust.amount), operation: 'set' });
      setMessage(`Updated pay for ${data.email}: ${data.previous} -> ${data.current}`);
      await reloadStaffAndSalary();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update pay');
    }
  };

  const decide = async (email, date, decision) => {
    try {
      await api.post('/api/hr/attendance/decision', { email, date, decision });
      await loadPending();
    } catch (err) {
      // ignore
    }
  };

  const onSetOT = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const { data } = await api.patch(`/api/hr/staff/${encodeURIComponent(otForm.email)}/overtime-rate`, { rate: Number(otForm.rate) });
      setMessage(`OT rate updated for ${data.email}: ${data.overtimeRate}`);
      await reloadStaffAndSalary();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update OT rate');
    }
  };

  // Test HR Manager Login
  const testHRLogin = async () => {
    try {
      setMessage('Testing HR Manager login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: testLogin.email,
          password: testLogin.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Login successful! Welcome ${data.user?.name || 'HR Manager'}`);
        // Refresh the page to load with authenticated state
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const errorData = await response.json();
        setMessage(`❌ Login failed: ${errorData.message || 'Invalid credentials'}`);
      }
    } catch (error) {
      setMessage(`❌ Login error: ${error.message}`);
    }
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <div className="relative bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/90 text-white grid place-items-center text-2xl shadow">👔</div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-emerald-300 bg-clip-text text-transparent">
                HR Manager Dashboard
              </h1>
              <p className="text-white/80">Manage compensation, attendance approvals, and staff</p>
            </div>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white">
              <div className="text-xs text-white/70">Total Staff</div>
              <div className="text-xl font-semibold">{totalStaff}</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white">
              <div className="text-xs text-white/70">Pending Approvals</div>
              <div className="text-xl font-semibold">{pendingCount}</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white">
              <div className="text-xs text-white/70">Avg Base Salary</div>
              <div className="text-xl font-semibold">${avgBaseSalary}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto p-6">
       
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">
            {message}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-white text-lg font-semibold">Staff Manager Search</h2>
              <p className="text-white/70 text-sm">Filter staff managers by name or email</p>
            </div>
            <input
              className="w-full sm:w-64 border border-white/20 bg-white/5 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Search staff managers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Navigation to Finance Dashboard */}
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-lg font-semibold">Finance Integration</h2>
                <p className="text-white/70 text-sm">View staff salary data in Finance Manager Dashboard</p>
              </div>
              <button
                onClick={() => window.location.href = '/#/finance/salaries'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                View in Finance Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={onCreate} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow">
            <div className="flex items-center gap-2 mb-4 text-white">
              <span className="text-xl">➕</span>
              <h2 className="text-lg font-semibold">Add Staff Member</h2>
            </div>
            <label className="block text-sm text-white/80 mb-1">Name</label>
            <input className="w-full border border-white/20 bg-white/5 text-white p-2 rounded mb-3" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
            <label className="block text-sm text-white/80 mb-1">Email</label>
            <input className="w-full border border-white/20 bg-white/5 text-white p-2 rounded mb-3" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
            <label className="block text-sm text-white/80 mb-1">Password</label>
            <input className="w-full border border-white/20 bg-white/5 text-white p-2 rounded mb-3" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required />
            <label className="block text-sm text-white/80 mb-1">Base Salary</label>
            <input className="w-full border border-white/20 bg-white/5 text-white p-2 rounded mb-4" type="number" value={form.baseSalary} onChange={e=>setForm(f=>({...f,baseSalary:Number(e.target.value)}))} />
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">Create Staff</button>
          </form>

          <form onSubmit={onAdjust} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow">
            <div className="flex items-center gap-2 mb-4 text-white">
              <span className="text-xl">💼</span>
              <h2 className="text-lg font-semibold">Set Regular Pay</h2>
            </div>
            <label className="block text-sm text-white/80 mb-1">Staff Email</label>
            <input className="w-full border border-white/20 bg-white/5 text-white p-2 rounded mb-3" type="email" value={adjust.email} onChange={e=>setAdjust(s=>({...s,email:e.target.value}))} required />
            <label className="block text-sm text-white/80 mb-1">New Amount</label>
            <input className="w-full border border-white/20 bg-white/5 text-white p-2 rounded mb-4" type="number" inputMode="decimal" step="0.01" min="0" value={adjust.amount} onChange={e=>setAdjust(s=>({...s,amount:e.target.value}))} required />
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition">Save</button>
          </form>

          <form onSubmit={onSetOT} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow">
            <div className="flex items-center gap-2 mb-4 text-white">
              <span className="text-xl">⏱️</span>
              <h2 className="text-lg font-semibold">Set Overtime Rate</h2>
            </div>
            <label className="block text-sm text-white/80 mb-1">Staff Email</label>
            <input className="w-full border border-white/20 bg-white/5 text-white p-2 rounded mb-3" type="email" value={otForm.email} onChange={e=>setOtForm(s=>({...s,email:e.target.value}))} required />
            <label className="block text-sm text-white/80 mb-1">Overtime Rate (per hour)</label>
            <input className="w-full border border-white/20 bg-white/5 text-white p-2 rounded mb-4" type="number" min="0" value={otForm.rate} onChange={e=>setOtForm(s=>({...s,rate:Number(e.target.value)}))} required />
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition">Update OT Rate</button>
          </form>
        </div>

        {/* Pending approvals */}
        <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Pending Attendance Approvals</h2>
            <span className="text-white/70 text-sm">{pendingCount} pending</span>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-white/70">No pending requests</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pending.map((p, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white">
                  <div className="font-medium">{p.name} <span className="text-white/70">({p.email})</span></div>
                  <div className="text-sm text-white/70 mt-1">{new Date(p.date).toLocaleDateString()} • In: {p.checkInTime ? new Date(p.checkInTime).toLocaleTimeString() : '—'} • Out: {p.checkOutTime ? new Date(p.checkOutTime).toLocaleTimeString() : '—'} • Hours: {p.hoursWorked ?? 0}</div>
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={() => decide(p.email, p.date, 'approve')} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition">Approve</button>
                    <button type="button" onClick={() => decide(p.email, p.date, 'reject')} className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded transition">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forum Section */}
        <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white text-lg font-semibold">Customer Forum Questions</h2>
              <p className="text-white/70 text-sm">Manage and respond to customer inquiries</p>
            </div>
            <div className="flex gap-4">
              <div className="px-3 py-1 bg-white/10 text-white/70 rounded text-sm">
                {forumStats.total} total • {forumStats.pending} pending
              </div>
              <button
                onClick={() => { loadForumQuestions(); loadForumStats(); }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Forum Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-600/30">
              <div className="text-2xl font-bold text-white">{forumStats.total}</div>
              <div className="text-sm text-slate-400">Total Questions</div>
            </div>
            <div className="bg-amber-500/20 p-4 rounded-xl border border-amber-500/30">
              <div className="text-2xl font-bold text-amber-300">{forumStats.pending}</div>
              <div className="text-sm text-amber-400">Pending</div>
            </div>
            <div className="bg-emerald-500/20 p-4 rounded-xl border border-emerald-500/30">
              <div className="text-2xl font-bold text-emerald-300">{forumStats.answered}</div>
              <div className="text-sm text-emerald-400">Answered</div>
            </div>
            <div className="bg-red-500/20 p-4 rounded-xl border border-red-500/30">
              <div className="text-2xl font-bold text-red-300">{forumStats.highPriority}</div>
              <div className="text-sm text-red-400">High Priority</div>
            </div>
          </div>

          {loadingForum ? (
            <p className="text-sm text-white/70">Loading forum questions...</p>
          ) : forumQuestions.length === 0 ? (
            <p className="text-sm text-white/70">No forum questions found</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {forumQuestions.map((question) => (
                <div key={question._id} className="bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{question.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.status === 'answered' ? 'bg-emerald-500/20 text-emerald-400' :
                          question.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {question.status}
                        </span>
                        {question.priority === 'high' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                            High Priority
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{question.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>By: {question.name} ({question.email})</span>
                        <span>Category: {question.category}</span>
                        <span>{new Date(question.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {question.response && (
                    <div className="bg-slate-700/50 p-3 rounded-lg mb-3">
                      <p className="text-sm text-slate-300">
                        <strong>Response:</strong> {question.response}
                      </p>
                      {question.respondedAt && (
                        <p className="text-xs text-slate-400 mt-1">
                          Responded on {new Date(question.respondedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {question.status === 'pending' && (
                      <button
                        onClick={() => markQuestionInProgress(question._id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                      >
                        Mark In Progress
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedQuestion(question)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition"
                    >
                      {question.response ? 'Edit Response' : 'Respond'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Response Modal */}
        {selectedQuestion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Respond to Question</h3>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-4 bg-slate-700/50 rounded-lg">
                <h4 className="font-semibold text-white mb-2">{selectedQuestion.subject}</h4>
                <p className="text-slate-300 text-sm mb-2">{selectedQuestion.message}</p>
                <div className="text-xs text-slate-400">
                  From: {selectedQuestion.name} ({selectedQuestion.email}) • {new Date(selectedQuestion.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Your Response</label>
                <textarea
                  value={responseForm.response}
                  onChange={(e) => setResponseForm({ response: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type your response here..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleQuestionResponse(selectedQuestion._id)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                >
                  Send Response
                </button>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Staff table */}
        <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">All Staff Members</h2>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-white/10 text-white/70 rounded text-sm">
                {totalStaff} staff • Avg: ${avgBaseSalary.toFixed(2)}
              </div>
              <button
                onClick={async()=>{
                  try {
                    setMessage('Creating missing staff profiles...');
                    await api.post('/api/staff/create-missing-staff-profiles');
                    setMessage('✅ Missing staff profiles created successfully!');
                    await reloadStaffAndSalary();
                  } catch (error) {
                    setMessage('❌ Failed to create missing staff profiles');
                  }
                  setTimeout(() => setMessage(''), 3000);
                }}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                Create Missing Profiles
              </button>
              <button onClick={async()=>{ setMessage(''); await reloadStaffAndSalary(); }} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">Refresh</button>
            </div>
          </div>
          {loadingStaff ? (
            <p className="text-sm text-white/70">Loading staff and salary data...</p>
          ) : staff.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/70 mb-2">No staff managers found</p>
              <p className="text-sm text-white/50">Add staff members using the form above to see salary details here</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm text-white/90">
                <thead className="bg-white/10">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Regular Pay</th>
                    <th className="text-left p-3">OT Rate</th>
                    <th className="text-left p-3">Extra Hours</th>
                    <th className="text-left p-3">Extra Work Pay</th>
                    <th className="text-left p-3">Total Pay</th>
                    <th className="text-left p-3">Suggestions</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff
                    .filter((s) => {
                      if (!searchTerm.trim()) return true;
                      const term = searchTerm.trim().toLowerCase();
                      return (
                        (s.name || '').toLowerCase().includes(term) ||
                        (s.email || '').toLowerCase().includes(term)
                      );
                    })
                    .map((s, i) => (
                      <tr key={i} className="odd:bg-white/0 even:bg-white/5 border-t border-white/10">
                        <td className="p-3">{s.name}</td>
                        <td className="p-3">{s.email}</td>
                        {(() => {
                          const staffData = s.salarySummary?.staff || {};
                          console.log(`Rendering salary data for ${s.email}:`, { staffData, s });
                          const regularPay = staffData.regularPay ?? staffData.baseSalary ?? s.salary?.basic ?? 0;
                          const overtimeRate = staffData.otRate ?? staffData.overtimeRate ?? s.salary?.ot ?? 0;
                          const extraHours = staffData.extraWorkHours ?? 0;
                          const extraWorkPay = staffData.extraWorkPay ?? 0;
                          const totalPay = staffData.totalPay ?? (regularPay + extraWorkPay);
                          const fmt = (n) => typeof n === 'number' && !isNaN(n) ? `$${n.toFixed(2)}` : '-';
                          console.log(`Calculated values for ${s.email}:`, {
                            regularPay, overtimeRate, extraHours, extraWorkPay, totalPay
                          });
                          return (
                            <>
                              <td className="p-3">{fmt(regularPay)}</td>
                              <td className="p-3">{overtimeRate > 0 ? `$${Number(overtimeRate).toFixed(2)}/h` : '-'}</td>
                              <td className="p-3">{`${Number(extraHours || 0).toFixed(1)}h`}</td>
                              <td className="p-3">{fmt(extraWorkPay)}</td>
                              <td className="p-3 font-medium">{fmt(totalPay)}</td>
                            </>
                          );
                        })()}
                        <td className="p-3">{Array.isArray(s?.suggestions) ? s.suggestions.length : 0}</td>
                        <td className="p-3">
                          <button
                            onClick={async()=>{
                              try {
                                await api.delete(`/api/users/staff/${s.userId || s._id}`);
                                setMessage('Removed staff');
                                await reloadStaffAndSalary();
                              } catch (error) {
                                setMessage(error.response?.data?.message || 'Failed to remove');
                              }
                            }}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 rounded text-white"
                          >Remove</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {loadingSalary && <p className="text-xs text-white/60 mt-2 p-2">Loading salary summaries...</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
