import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../store/auth';
import { initSocket, rejoinSocketAuth } from '../services/socket';

export default function StaffManagerDashboard() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [performanceStats, setPerformanceStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [assignedJobs, setAssignedJobs] = useState([]);
  
  // StaffMng integration state
  const [currentScreen, setCurrentScreen] = useState('attendance');
  const [attendanceData, setAttendanceData] = useState([]);
  const [jobsData, setJobsData] = useState([]);
  const [extraWorkData, setExtraWorkData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [salaryData, setSalaryData] = useState(null);
  // Dashboard-only salary config (no overtime) - initialize to null to detect when data is loaded
  const [regularPay, setRegularPay] = useState(null);
  const [otRate, setOtRate] = useState(null);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    address: ''
  });
  const [formData, setFormData] = useState({
    extraTask: '',
    extraHours: '',
    extraDate: '', // Will be set when component mounts
    suggestText: ''
  });

  // Auto-hide messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    loadStaffData();
    loadPersonalData();
    if (user) {
      loadAssignedJobs();
    }
  }, [user]);

  // Initialize extra work form date when component mounts
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      extraDate: getTodayDate()
    }));
  }, []);

  // Socket: listen for compensation updates and show panel notifications
  const [notifList, setNotifList] = useState([]);
  const recentNotifKeys = useRef(new Set());
  useEffect(() => {
    let s;
    (async () => {
      s = await initSocket({ url: 'http://localhost:5000' });
      if (!s) return;
      try {
        const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (cachedUser?.email) {
          rejoinSocketAuth(cachedUser.email, cachedUser.role);
        }
      } catch (_) {}
      // Ensure we don't accumulate duplicate handlers after hot reloads or re-mounts
      try { s.off('compensation:update'); s.off('assignment:new'); s.off('hr:update'); } catch (_) {}
      const handler = (evt) => {
        try {
          if (!evt || !evt.email) return;
          if (user && user.email && evt.email.toLowerCase() === user.email.toLowerCase()) {
            const title = evt.type === 'pay' ? 'Regular pay updated' : 'Overtime rate updated';
            const desc = evt.type === 'pay' ? `Now ${evt.current}` : `Now ${evt.overtimeRate}/h`;
            // De-duplicate bursts: build a short-lived key
            const key = `${evt.type}:${evt.current ?? evt.overtimeRate}`;
            if (recentNotifKeys.current.has(key)) return;
            recentNotifKeys.current.add(key);
            // Keep only a few recent keys
            if (recentNotifKeys.current.size > 10) {
              const firstKey = recentNotifKeys.current.values().next().value;
              recentNotifKeys.current.delete(firstKey);
            }
            setNotifList((prev) => [{ title, desc, at: new Date().toISOString() }, ...prev].slice(0, 20));
            if (evt.type === 'ot' && typeof evt.overtimeRate === 'number') {
              setOtRate(evt.overtimeRate);
              setMessage(`Overtime rate updated to ${evt.overtimeRate}/h`);
              setTimeout(() => setMessage(''), 2000);
            }
            if (evt.type === 'pay' && typeof evt.current === 'number') {
              console.log('Updating regular pay from socket event:', evt.current);
              setRegularPay(evt.current);
              setMessage(`Regular pay updated to $${evt.current.toFixed(2)}`);
              setTimeout(() => setMessage(''), 2000);
            }
          }
        } catch (_) {}
      };
      const hrRefreshHandler = (evt) => {
        try {
          if ((evt?.type === 'regular' || evt?.type === 'pay') && evt?.email && user?.email && evt.email.toLowerCase() === user.email.toLowerCase()) {
            const newPay = evt.regularPay ?? evt.baseSalary ?? evt.current;
            console.log('HR refresh handler - updating regular pay:', newPay);
            if (typeof newPay === 'number') {
              setRegularPay(newPay);
              setMessage(`Regular pay updated to $${newPay.toFixed(2)}`);
              setNotifList((prev) => [{ title: 'Regular pay updated', desc: `Now $${newPay.toFixed(2)}`, at: new Date().toISOString() }, ...prev].slice(0, 20));
              setTimeout(() => setMessage(''), 2000);
            }
          }
          if ((evt?.type === 'overtime' || evt?.type === 'ot') && evt?.email && user?.email && evt.email.toLowerCase() === user.email.toLowerCase()) {
            setMessage(`Overtime rate updated to ${evt.overtimeRate}/h`);
            if (typeof evt.overtimeRate === 'number') {
              setOtRate(evt.overtimeRate);
            }
            setNotifList((prev) => [{ title: 'Overtime rate updated', desc: `Now ${evt.overtimeRate}/h`, at: new Date().toISOString() }, ...prev].slice(0, 20));
            setTimeout(() => setMessage(''), 2000);
          }
          if (evt.email && user?.email && evt.email.toLowerCase() === user.email.toLowerCase()) {
            const newPay = evt.regularPay ?? evt.baseSalary ?? evt.current;
            console.log('Updating current user salary from HR broadcast:', newPay);
            if (typeof newPay === 'number') setRegularPay(newPay);
            if (typeof evt.overtimeRate === 'number') setOtRate(evt.overtimeRate);
          }
          setTimeout(() => setMessage(''), 2000);
          setTimeout(() => {
            loadSalaryData();
          }, 300);
        } catch (error) {
          console.error('Failed to refresh salary list from HR update', error);
        }
      };
      const assignmentHandler = (evt) => {
        try {
          if (!evt) return;
          // server sends { email, userId, ... } with email for matching
          if (user && user.email && evt.email && evt.email.toLowerCase() === user.email.toLowerCase()) {
            const title = 'New Job Assigned';
            const desc = `${evt.jobType} • ${evt.vehiclePlate} • $${evt.estimatedCost}`;
            const key = `assign:${evt.bookingId}`;
            if (recentNotifKeys.current.has(key)) return;
            recentNotifKeys.current.add(key);
            if (recentNotifKeys.current.size > 10) {
              const firstKey = recentNotifKeys.current.values().next().value;
              recentNotifKeys.current.delete(firstKey);
            }
            setNotifList((prev) => [{ title, desc, at: new Date().toISOString() }, ...prev].slice(0, 20));
            // Reload assigned jobs list
            loadAssignedJobs();
          }
        } catch (_) {}
      };
      s.on('compensation:update', handler);
      s.on('assignment:new', assignmentHandler);
      s.on('hr:update', hrRefreshHandler);
      s.__compHandler = handler;
      s.__assignHandler = assignmentHandler;
      s.__hrHandler = hrRefreshHandler;
    })();
    return () => { try {
      if (s && s.__compHandler) s.off('compensation:update', s.__compHandler);
      if (s && s.__assignHandler) s.off('assignment:new', s.__assignHandler);
      if (s && s.__hrHandler) s.off('hr:update', s.__hrHandler);
    } catch (_) {} };
  }, [user]);

  // Reload salary details when switching to the Salary screen
  useEffect(() => {
    if (currentScreen === 'salary') {
      console.log('Loading salary data for screen switch');
      loadSalaryData();
    }
  }, [currentScreen]);

  // Debug effect for jobs data
  useEffect(() => {
    console.log('Jobs data updated:', jobsData);
  }, [jobsData]);

  // Debug effect for assigned jobs
  useEffect(() => {
    console.log('Assigned jobs updated:', assignedJobs);
    console.log('Assigned jobs count:', assignedJobs.length);
  }, [assignedJobs]);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      const staffResponse = await api.get('/api/staff/staff');
      const staffPayload = staffResponse?.data;
      const staffList = Array.isArray(staffPayload)
        ? staffPayload
        : (Array.isArray(staffPayload?.data) ? staffPayload.data : []);
      setStaff(staffList);
      
      const performanceResponse = await api.get('/api/staff/performance-stats');
      setPerformanceStats(performanceResponse.data || {});
    } catch (error) {
      console.error('Error loading staff data:', error);
      setMessage('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalData = async () => {
    if (!user?.email) return;
    try {
      console.log('Loading personal data...');
      
      // Use the current user's email instead of hardcoded email
      const userEmail = user.email;
      rejoinSocketAuth(userEmail);
      
      // Load attendance data
      const attendanceResponse = await api.get(`/api/staff/attendance/${encodeURIComponent(userEmail)}`);
      console.log('Attendance response:', attendanceResponse.data);
      setAttendanceData(attendanceResponse.data.attendance || []);
      
      // Load jobs data
      const jobsResponse = await api.get(`/api/staff/staff-jobs/${encodeURIComponent(userEmail)}`);
      console.log('Jobs response:', jobsResponse.data);
      setJobsData(jobsResponse.data.jobs || []);
      
      // Load extra work data
      const extraWorkResponse = await api.get(`/api/extrawork/${encodeURIComponent(userEmail)}`);
      setExtraWorkData(extraWorkResponse.data.extraWork || []);

      // Load suggestions
      const suggestionsResponse = await api.get(`/api/suggestions/${encodeURIComponent(userEmail)}`);
      setSuggestions(suggestionsResponse.data.suggestions || []);
      
      await loadSalaryData();
    } catch (error) {
      console.error('Error loading personal data:', error);

      // Handle different types of errors
      if (error?.response?.status) {
        const status = error.response.status;
        if (status === 404) {
          // Some endpoints might return 404 if staff profile doesn't exist
          console.log('Staff profile not found, but continuing with available data');
        } else if (status === 500) {
          setMessage('❌ Server error. Please try again later.');
          setTimeout(() => setMessage(''), 3000);
        } else if (status === 401) {
          console.log('Authentication error - user may need to log in again');
        }
      } else if (error?.code === 'ECONNREFUSED') {
        setMessage('❌ Cannot connect to server. Please check if the server is running.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to load personal data');
        setTimeout(() => setMessage(''), 2500);
      }
    }
  };

  // Initialize profile form once user/staff are loaded
  useEffect(() => {
    try {
      const isStaffArray = Array.isArray(staff);
      const userEmail = user?.email || 'staff@autoelite.com';
      const currentStaff = isStaffArray ? (staff.find(s => s?.email === userEmail) || {}) : {};
      const phone = user?.phone ?? currentStaff?.phone ?? '';
      const address = user?.address ?? currentStaff?.address ?? '';
      setProfileForm({ phone, address });
    } catch (_) {}
  }, [staff, user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/users/me', { phone: profileForm.phone, address: profileForm.address });
      setMessage('✅ Profile updated');
      await loadStaffData();
    } catch (err) {
      setMessage(err.response?.data?.message || '❌ Failed to update profile');
    }
  };

  const loadSalaryData = async () => {
    const userEmail = user?.email;
    if (!userEmail) return;
    try {
      console.log('🔗 Loading salary data for:', userEmail);
      console.log('🔗 Making API call to:', `/api/staff/salary/${userEmail}`);
      console.log('🔗 User token exists:', !!localStorage.getItem('token'));

      const response = await api.get(`/api/staff/salary/${encodeURIComponent(userEmail)}`);
      console.log('✅ Salary data response:', response.data);
      console.log('✅ Response status:', response.status);
      setSalaryData(response.data);
      const base = response?.data?.staff?.baseSalary || response?.data?.staff?.regularPay;
      const staffInfo = response?.data?.staff || {};
      console.log('Staff salary data from API:', {
        baseSalary: staffInfo.baseSalary,
        regularPay: staffInfo.regularPay,
        basic: staffInfo.salary?.basic,
        email: staffInfo.email,
        name: staffInfo.name
      });
      console.log('Resolved base salary:', base);

      if (typeof base === 'number' && !Number.isNaN(base) && base > 0) {
        console.log('Setting regular pay to:', base);
        setRegularPay(base);
      } else {
        console.log('No valid base salary found (base:', base, '), keeping current value:', regularPay);
        console.log('Staff object from API:', staffInfo);
        // Don't override with default values - keep null until valid data is loaded
        if (base === 0 || base === undefined || base === null) {
          // Don't change the current value if it's already set
          console.log('Keeping existing regular pay value');
        }
      }
      const otr = response?.data?.staff?.overtimeRate || response?.data?.staff?.otRate;
      if (typeof otr === 'number' && !Number.isNaN(otr)) {
        setOtRate(otr);
      }
    } catch (error) {
      console.error('Error loading salary data:', error);
      const status = error?.response?.status;
      if (status === 404) {
        // Staff member not found in database
        const responseData = error?.response?.data || {};
        if (responseData.error === "Staff profile not found" && responseData.userExists) {
          setMessage('⚠️ Your staff profile was auto-created. Please wait while your salary data loads...');
          setTimeout(() => setMessage(''), 3000);
          // Retry loading after a short delay
          setTimeout(() => {
            console.log('Retrying salary data load after auto-creation');
            loadSalaryData();
          }, 1000);
        } else if (responseData.userExists) {
          setMessage('⚠️ Your staff profile needs to be set up by HR Manager. Please contact HR to get your salary information configured.');
          setTimeout(() => setMessage(''), 5000);
        } else {
          setMessage('⚠️ You need to be added to the system by an HR Manager first. Please contact HR to get your account set up.');
          setTimeout(() => setMessage(''), 5000);
        }
        console.log('Staff member not found in database:', responseData);
      } else if (status !== 401) {
        setMessage('Failed to load salary data');
        setTimeout(() => setMessage(''), 2500);
      }
    }
  };



  const loadAssignedJobs = async () => {
    try {
      if (!user || !user.id) {
        console.log('No user or user.id found, cannot load advisor-assigned jobs');
        setAssignedJobs([]);
        return;
      }
      
      console.log('Loading advisor-assigned jobs for staff manager:', user.id, user.email);
      
      // Load real advisor-assigned jobs from notifications system
      const response = await api.get(`/api/staff/assignments/assigned/${user.id}`);
      console.log('Advisor-assigned jobs response:', response.data);
      
      if (response.data.success && response.data.jobs) {
        const advisorJobs = response.data.jobs;
        console.log('Found advisor-assigned jobs:', advisorJobs.length);
        
        // Map advisor jobs to the expected format for the table
        const allJobs = advisorJobs.map(job => ({
          _id: job._id,
          bookingId: job.bookingId,
          jobType: job.jobType || 'Service',
          instructions: job.instructions || job.notes || 'No instructions provided',
          vehiclePlate: job.vehiclePlate || 'N/A',
          estimatedCost: job.estimatedCost || 0,
          notes: job.notes || '',
          status: job.status || 'Pending',
          source: 'advisor',
          assignedAt: job.assignedAt || job.createdAt || new Date(),
          advisorId: job.advisorId
        }));
        
        setAssignedJobs(allJobs);
        console.log('Total advisor-assigned jobs loaded:', allJobs.length);
        console.log('All advisor jobs:', allJobs);
      } else {
        console.log('No advisor-assigned jobs found or invalid response');
        setAssignedJobs([]);
      }
    } catch (error) {
      console.error('Error loading advisor-assigned jobs:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // If no advisor-assigned jobs, show empty state
      setAssignedJobs([]);
      setMessage('No advisor-assigned jobs found');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckIn = async () => {
    try {
      const currentTime = new Date().toISOString();
      const userEmail = user?.email || 'staff@autoelite.com';
      await api.post('/api/attendance/checkin', {
        email: userEmail,
        checkInTime: currentTime
      });
      setMessage('✅ Checked in successfully!');
      loadPersonalData();
    } catch (error) {
      console.error('Check-in error:', error);
      setMessage('❌ Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      const currentTime = new Date().toISOString();
      const userEmail = user?.email || 'staff@autoelite.com';
      await api.post('/api/attendance/checkout', {
        email: userEmail,
        checkOutTime: currentTime
      });
      setMessage('✅ Checked out successfully!');
      loadPersonalData();
    } catch (error) {
      console.error('Check-out error:', error);
      setMessage('❌ Failed to check out');
    }
  };

  const handleExtraWork = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.extraTask.trim()) {
      setMessage('❌ Please enter a task description');
      return;
    }

    if (!formData.extraHours || parseFloat(formData.extraHours) <= 0) {
      setMessage('❌ Please enter valid hours worked (must be greater than 0)');
      return;
    }

    // Validate that the date is today
    const today = getTodayDate();
    if (formData.extraDate !== today) {
      setMessage('❌ You can only record extra work for today\'s date');
      return;
    }

    // Validate hours are reasonable (not more than 24 hours per day)
    if (parseFloat(formData.extraHours) > 24) {
      setMessage('❌ Hours worked cannot exceed 24 hours per day');
      return;
    }
    
    try {
      const userEmail = user?.email || 'staff@autoelite.com';
      console.log('📤 Submitting extra work for:', userEmail, {
        description: formData.extraTask,
        hours: parseFloat(formData.extraHours),
        date: formData.extraDate
      });

      const response = await api.post(`/api/extrawork/${encodeURIComponent(userEmail)}`, {
        description: formData.extraTask.trim(),
        hours: parseFloat(formData.extraHours),
        date: formData.extraDate
      });

      console.log('✅ Extra work recorded successfully:', response.data);
      setMessage('✅ Extra work recorded!');
      setFormData({ ...formData, extraTask: '', extraHours: '', extraDate: getTodayDate() });
      loadPersonalData();
    } catch (error) {
      console.error('❌ Extra work error details:', error);

      // Enhanced error handling for AxiosError
      if (error?.response?.status) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 404) {
          setMessage('❌ Staff profile not found. Please contact HR Manager.');
        } else if (status === 400) {
          setMessage(`❌ Invalid data: ${errorData?.error || 'Bad request'}`);
        } else if (status === 401) {
          setMessage('❌ Authentication required. Please log in again.');
        } else if (status === 500) {
          setMessage('❌ Server error. Please try again later.');
        } else {
          setMessage(`❌ Error ${status}: ${errorData?.error || 'Unknown error'}`);
        }
      } else if (error?.code === 'ECONNREFUSED') {
        setMessage('❌ Cannot connect to server. Please check if the server is running.');
      } else if (error?.message?.includes('Network Error')) {
        setMessage('❌ Network error. Please check your internet connection.');
      } else {
        setMessage('❌ Failed to record extra work. Please try again.');
      }

      // Log additional details for debugging
      console.error('Error response:', error?.response);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
    }
  };

  const handleSuggestion = async (e) => {
    e.preventDefault();
    try {
      const userEmail = user?.email || 'staff@autoelite.com';
      await api.post(`/api/suggestions/${userEmail}`, {
        text: formData.suggestText
      });
      setMessage('✅ Suggestion submitted!');
      setFormData({ ...formData, suggestText: '' });
      loadPersonalData();
    } catch (error) {
      console.error('Suggestion error:', error);
      setMessage('❌ Failed to submit suggestion');
    }
  };

  const handleJobStatusUpdate = async (jobIndex, newStatus) => {
    try {
      // Update the job status locally first for immediate UI feedback
      const updatedJobs = [...assignedJobs];
      updatedJobs[jobIndex].status = newStatus;
      setAssignedJobs(updatedJobs);
      
      // For advisor-assigned jobs, we'll just update locally since they're managed through notifications
      setMessage(`✅ Job marked as ${newStatus.toLowerCase()}`);
      
      // TODO: If needed, we could add an endpoint to update advisor-assigned job status
      // For now, we'll just update the local state
    } catch (error) {
      console.error('Error updating job status:', error);
      setMessage('❌ Failed to update job status');
    }
  };

  const generateAttendanceReport = async () => {
    try {
      const userEmail = user?.email || 'staff@autoelite.com';
      const response = await api.get(`/api/staff/attendance-report/${encodeURIComponent(userEmail)}`);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${userEmail}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setMessage('✅ Attendance report downloaded!');
    } catch (error) {
      console.error('Report generation error:', error);
      setMessage('❌ Failed to generate report');
    }
  };

  const generateSalaryReport = async () => {
    try {
      const userEmail = user?.email || 'staff@autoelite.com';
      const response = await api.get(`/api/staff/salary-report/${encodeURIComponent(userEmail)}`);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary-report-${userEmail}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setMessage('✅ Salary report downloaded!');
    } catch (error) {
      console.error('Salary report error:', error);
      setMessage('❌ Failed to generate salary report');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not set';
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleTimeString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatHours = (hours) => {
    if (!hours || isNaN(hours)) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getRoleColor = (role) => {
    const normalized = String(role || '').toLowerCase().trim();
    const colors = {
      'advisor': 'bg-blue-100 text-blue-800',
      'finance_manager': 'bg-green-100 text-green-800',
      'inventory_manager': 'bg-purple-100 text-purple-800',
      'staff_manager': 'bg-orange-100 text-orange-800',
      'staff member': 'bg-orange-100 text-orange-800',
      'staff_member': 'bg-orange-100 text-orange-800'
    };
    return colors[normalized] || 'bg-gray-100 text-gray-800';
  };

  const formatRoleLabel = (role) => {
    if (!role) return 'Staff';
    const key = String(role).toLowerCase().trim();
    const explicit = {
      'staff_manager': 'Staff Member',
      'staff member': 'Staff Member',
      'staff_member': 'Staff Member',
      'finance_manager': 'Finance Manager',
      'inventory_manager': 'Inventory Manager'
    };
    if (explicit[key]) return explicit[key];
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handlePerformanceReview = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      await api.post('/api/staff/performance-review', {
        staffId: selectedStaff._id,
        score: formData.get('score'),
        comments: formData.get('comments'),
        goals: formData.get('goals')
      });
      setMessage('Performance review submitted successfully');
      setShowPerformanceModal(false);
      setSelectedStaff(null);
      loadStaffData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit performance review');
    }
  };

  

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-green-600/20"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AE</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                    Staff Member Dashboard
                  </h1>
                  <p className="text-white/80 mt-1">Manage staff performance and operations</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{new Date().toLocaleDateString()}</div>
              <div className="text-white/80">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Navigation */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setCurrentScreen('profile')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentScreen === 'profile'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
              }`}
            >
              🧑‍🏫 Profile
            </button>
            <button
              onClick={() => setCurrentScreen('attendance')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentScreen === 'attendance'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
              }`}
            >
              📅 Attendance
            </button>
            <button
              onClick={() => setCurrentScreen('jobs')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentScreen === 'jobs'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
              }`}
            >
              💼 Assigned Jobs
            </button>
            <button
              onClick={() => setCurrentScreen('extrawork')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentScreen === 'extrawork'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
              }`}
            >
              ⏰ Extra Work
            </button>
            <button
              onClick={() => setCurrentScreen('suggest')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentScreen === 'suggest'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
              }`}
            >
              💡 Suggestions
            </button>
            <button
              onClick={() => setCurrentScreen('reports')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentScreen === 'reports'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
              }`}
            >
              📊 Reports
            </button>
            <button
              onClick={() => {
                setCurrentScreen('salary');
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentScreen === 'salary'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
              }`}
            >
              💰 Salary
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-400/50 text-green-300 rounded-lg backdrop-blur-md">
            {message}
          </div>
        )}

        {/* Notification Panel */}
        <div className="mb-6 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold">Notifications</h3>
            {notifList.length > 0 && (
              <button onClick={() => setNotifList([])} className="text-xs text-white/70 hover:text-white">Clear</button>
            )}
          </div>
          {notifList.length === 0 ? (
            <div className="text-white/70 text-sm">No notifications yet</div>
          ) : (
            <div className="space-y-2">
              {notifList.map((n, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <div>
                    <div className="text-white font-medium">{n.title}</div>
                    <div className="text-white/70 text-sm">{n.desc}</div>
                  </div>
                  <div className="text-white/60 text-xs">{new Date(n.at).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        

        {/* Profile Screen */}
        {currentScreen === 'profile' && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-6">
              🧑‍🏫 Staff Profile
            </h2>
            {(() => {
              try {
                const isStaffArray = Array.isArray(staff);
                const userEmail = user?.email || 'staff@autoelite.com';
                const currentStaff = isStaffArray ? (staff.find(s => s?.email === userEmail) || {}) : {};
                const safeName = user?.name || currentStaff.name || 'N/A';
                const safeEmail = user?.email || currentStaff.email || 'N/A';
                const joinedAt = user?.createdAt || currentStaff.createdAt;
                const joinedDate = joinedAt ? new Date(joinedAt).toLocaleDateString() : 'N/A';
                return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl flex items-center gap-4">
                    {(() => {
                      const displayName = safeName === 'N/A' ? 'Auto Elite' : safeName;
                      const avatar = user?.avatarUrl || currentStaff?.avatarUrl;
                      const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&size=96&bold=true`;
                      return (
                        <img
                          src={avatar || fallback}
                          alt={displayName}
                          className="w-16 h-16 rounded-full object-cover border border-white/40"
                          onError={(e) => { e.currentTarget.src = fallback; }}
                        />
                      );
                    })()}
                    <div>
                      <div className="text-xl font-semibold text-white">{safeName}</div>
                      <div className="text-white/80">{safeEmail}</div>
                      <div className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${getRoleColor(user?.role || currentStaff.role || '')}`}>
                        {formatRoleLabel(user?.role || currentStaff.role || 'staff')}
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-white mb-4">Employment</h3>
                      <div className="space-y-2 text-white/80">
                        <div className="flex justify-between">
                          <span>Status</span>
                          <span className="text-white">{currentStaff.status || 'Active'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Joined</span>
                          <span className="text-white">{joinedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                );
              } catch (err) {
                return (
                  <div className="text-white/90">Something went wrong loading the profile. Please refresh.</div>
                );
              }
            })()}
          </div>
        )}

        {/* Attendance Screen */}
        {currentScreen === 'attendance' && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-6">
              📅 Attendance Management
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-white mb-4">Check In/Out</h3>
                <div className="space-y-4">
                  <button
                    onClick={handleCheckIn}
                    className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    ✅ Check In
                  </button>
                  <button
                    onClick={handleCheckOut}
                    className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    ❌ Check Out
                  </button>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-white mb-4">Today's Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/80">Arrival Time:</span>
                    <span className="font-semibold text-white">{formatTime(attendanceData[0]?.checkInTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Departure Time:</span>
                    <span className="font-semibold text-white">{formatTime(attendanceData[0]?.checkOutTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Hours Worked:</span>
                    <span className="font-semibold text-green-400">{formatHours(attendanceData[0]?.hoursWorked)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Attendance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-2 text-white">Date</th>
                      <th className="text-left py-2 text-white">Check In</th>
                      <th className="text-left py-2 text-white">Check Out</th>
                      <th className="text-left py-2 text-white">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.slice(0, 5).map((record, index) => (
                      <tr key={index} className="border-b border-white/10">
                        <td className="py-2 text-white/80">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="py-2 text-white">{formatTime(record.checkInTime)}</td>
                        <td className="py-2 text-white">{formatTime(record.checkOutTime)}</td>
                        <td className="py-2 text-green-400 font-semibold">{formatHours(record.hoursWorked)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Screen */}
        {currentScreen === 'jobs' && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                💼 Assigned Jobs
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    loadPersonalData();
                    loadAssignedJobs();
                  }}
                  className="px-4 py-2 bg-blue-500/90 hover:bg-blue-600 text-white rounded-lg transition-colors border border-white/20"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-white/90">
                <thead className="bg-white/10">
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-6">#</th>
                    <th className="text-left py-3 px-6">Job Details</th>
                    <th className="text-left py-3 px-6">Vehicle</th>
                    <th className="text-left py-3 px-6">Type</th>
                    <th className="text-left py-3 px-6">Est. Cost</th>
                    <th className="text-left py-3 px-6">Source</th>
                    <th className="text-left py-3 px-6">Status</th>
                    <th className="text-left py-3 px-6">Assigned</th>
                    <th className="text-left py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-white/70">
                        No assigned jobs found
                      </td>
                    </tr>
                  ) : (
                    assignedJobs.map((job, idx) => (
                      <tr key={idx} className="border-t border-white/10 odd:bg-white/0 even:bg-white/5">
                        <td className="px-6 py-4 font-medium">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-white">{job.jobType}</div>
                            <div className="text-sm text-white/80 mt-1">{job.instructions}</div>
                            {job.notes && <div className="text-sm text-white/70 mt-1">Notes: {job.notes}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{job.vehiclePlate || 'N/A'}</td>
                        <td className="px-6 py-4 font-medium">{job.jobType || 'General'}</td>
                        <td className="px-6 py-4 font-medium text-emerald-300">${job.estimatedCost || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            job.source === 'advisor' ? 'bg-blue-500/20 text-blue-200 border-blue-400/30' : 
                            'bg-purple-500/20 text-purple-200 border-purple-400/30'
                          }`}>{job.source === 'advisor' ? 'Advisor' : 'Staff Mgmt'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                            job.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' : 
                            job.status === 'In Progress' ? 'bg-blue-500/20 text-blue-200 border-blue-400/30' :
                            'bg-orange-500/20 text-orange-200 border-orange-400/30'
                          }`}>{job.status}</span>
                        </td>
                        <td className="px-6 py-4 font-medium">{job.assignedAt ? new Date(job.assignedAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {job.status !== 'Completed' && (
                              <button
                                onClick={() => handleJobStatusUpdate(idx, 'In Progress')}
                                className="px-3 py-1 bg-blue-500/90 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm border border-white/20"
                              >
                                Start
                              </button>
                            )}
                            {job.status === 'In Progress' && (
                              <button
                                onClick={() => handleJobStatusUpdate(idx, 'Completed')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm border border-white/20"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Extra Work Screen */}
        {currentScreen === 'extrawork' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
              ⏰ Extra Work
            </h2>
            
            <form onSubmit={handleExtraWork} className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Task Description</label>
                  <input
                    type="text"
                    name="extraTask"
                    value={formData.extraTask}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-black/20 bg-black/5 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describe the extra work..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Hours Worked</label>
                  <input
                    type="number"
                    name="extraHours"
                    value={formData.extraHours}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 border border-black/20 bg-black/5 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Date</label>
                  <input
                    type="date"
                    name="extraDate"
                    value={getTodayDate()}
                    readOnly
                    className="w-full px-3 py-2 border border-black/20 bg-black/5 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-100 cursor-not-allowed"
                    required
                  />
                  <p className="text-sm text-black/70 mt-1">📅 Automatically set to today's date</p>
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200 transform hover:scale-105"
              >
                Record Extra Work
              </button>
            </form>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Extra Work</h3>
              <div className="space-y-3">
                {extraWorkData.slice(0, 5).map((work, index) => (
                  <div key={index} className="bg-emerald-200 p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{work.description}</p>
                        <p className="text-sm text-gray-600">{new Date(work.date).toLocaleDateString()}</p>
                      </div>
                      <span className="text-green-600 font-semibold">{work.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggestions Screen */}
        {currentScreen === 'suggest' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
              💡 Suggestions
            </h2>
            <form onSubmit={handleSuggestion} className="mb-6">
              <div className="mb-4">
                <label className="text-black block text-sm font-medium mb-1">Suggestion</label>
                <textarea
                  id="suggestText"
                  name="suggestText"
                  className="w-full px-3 py-2 border text-black border-black rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Your idea to improve the workshop..."
                  value={formData.suggestText}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Submit Suggestion
              </button>
            </form>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Suggestions</h3>
              <div className="space-y-3">
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-gray-800">{suggestion.text}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(suggestion.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports Screen */}
        {currentScreen === 'reports' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
              📊 Reports
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Attendance Report</h3>
                <p className="text-gray-600 mb-4">Download your attendance records as CSV</p>
                <button
                  onClick={generateAttendanceReport}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  📥 Download Attendance Report
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Salary Report</h3>
                <p className="text-gray-600 mb-4">Download your salary information as CSV</p>
                <button
                  onClick={generateSalaryReport}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  💰 Download Salary Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Salary Screen - Dashboard calculation with flat regular pay and extra work only */}
        {currentScreen === 'salary' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
              💰 Salary Information (Dashboard)
            </h2>
            {(() => {
              const totalRegularHours = attendanceData.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
              const totalExtraHours = extraWorkData.reduce((sum, w) => sum + (w.hours || 0), 0);
              const currentOtRate = typeof otRate === 'number' && !isNaN(otRate) ? otRate : 0;
              const currentRegularPay = typeof regularPay === 'number' && !isNaN(regularPay) ? regularPay : 0;
              const extraWorkPay = Math.round(totalExtraHours * currentOtRate * 100) / 100;
              const totalPay = Math.round((currentRegularPay + extraWorkPay) * 100) / 100;
              const currency = (n) => `$${n.toFixed(2)}`;
              return (
                <div>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Regular Pay Card */}
                    <div className="rounded-2xl p-8 bg-green-50 border border-green-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl">💼</div>
                        <div className="text-2xl font-semibold text-green-800">Regular Pay (Monthly)</div>
                      </div>
                      <div className="text-5xl font-extrabold text-green-700">
                        {currency(currentRegularPay)}
                      </div>
                      <div className="mt-2 text-sm text-green-700/80">Fixed monthly amount</div>
                      
                    </div>
                    {/* Extra Work Pay Card */}
                    <div className="rounded-2xl p-8 bg-blue-50 border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl">⚡</div>
                        <div className="text-2xl font-semibold text-blue-800">Extra Work Pay</div>
                      </div>
                      <div className="text-5xl font-extrabold text-blue-700">
                        {currency(extraWorkPay)}
                      </div>
                      <div className="mt-2 text-sm text-blue-700/80">
                        {totalExtraHours.toFixed(1)} hours
                      </div>
                      <div className="mt-1 text-xs text-blue-700/70">@ ${currentOtRate.toFixed(2)}/h</div>
                    </div>
                    {/* Total Pay Card */}
                    <div className="rounded-2xl p-8 bg-purple-50 border border-purple-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl">💰</div>
                        <div className="text-2xl font-semibold text-purple-800">Total Pay</div>
                      </div>
                      <div className="text-5xl font-extrabold text-purple-700">
                        {currency(totalPay)}
                      </div>
                      <div className="mt-2 text-sm text-purple-700/80">
                        {(totalRegularHours + totalExtraHours).toFixed(1)} total hours
                      </div>
                    </div>
                  </div>
                  {/* Total Salary Summary */}
                  <div className="mt-8">
                    <div className="rounded-2xl p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-purple-100 text-center">
                      <div className="text-xl font-semibold text-purple-800 mb-2">Total Salary (Regular + Extra Work)</div>
                      <div className="text-6xl font-extrabold text-purple-700">{currency(totalPay)}</div>
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>
        )}


        {/* Performance Review Modal */}
        {showPerformanceModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Performance Review - {selectedStaff.name}</h3>
              <form onSubmit={handlePerformanceReview}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Performance Score (0-100)</label>
                  <input
                    type="number"
                    name="score"
                    min="0"
                    max="100"
                    defaultValue={selectedStaff.performanceScore || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Comments</label>
                  <textarea
                    name="comments"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Performance comments..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Goals for Next Period</label>
                  <textarea
                    name="goals"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Goals and objectives..."
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPerformanceModal(false);
                      setSelectedStaff(null);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
