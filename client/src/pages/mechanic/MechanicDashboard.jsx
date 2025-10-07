import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/auth';
import Swal from 'sweetalert2';
import api from '../../api/client';
import FreeMap from '../../components/FreeMap';
import {
  FaWrench,
  FaCalendarAlt,
  FaDollarSign,
  FaStar,
  FaClock,
  FaMapMarkerAlt,
  FaBell,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaRedo,
  FaPlay,
  FaTimes,
  FaSave,
  FaCheck,
  FaEdit
} from 'react-icons/fa';

const MechanicDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('messages'); // Start with messages tab
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    rating: 0,
    earnings: 0,
    activeJobs: 0,
    pendingRequests: 0
  });
  const [profileData, setProfileData] = useState({
    name: '',
    location: '',
    coordinates: null,
    hourlyRate: 0,
    rating: 0,
    specialties: [],
    experience: '',
    availability: {
      monday: { start: '08:00', end: '18:00', available: true },
      tuesday: { start: '08:00', end: '18:00', available: true },
      wednesday: { start: '08:00', end: '18:00', available: true },
      thursday: { start: '08:00', end: '18:00', available: true },
      friday: { start: '08:00', end: '18:00', available: true },
      saturday: { start: '09:00', end: '15:00', available: true },
      sunday: { start: '10:00', end: '14:00', available: false }
    }
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [error, setError] = useState(null);

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Fallback if user is not loaded
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl">Access denied. Please log in.</div>
        </div>
      </div>
    );
  }

  // Fetch data on component mount and set up polling
  useEffect(() => {
    fetchMechanicData();

    // Set up polling every 30 seconds to check for new requests
    const interval = setInterval(fetchMechanicData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle email action parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const requestId = urlParams.get('requestId');

    if (action && requestId) {
      // Clear URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Handle the action
      handleEmailAction(action, requestId);
    }
  }, []);

  const handleEmailAction = async (action, requestId) => {
    try {
      if (action === 'accept') {
        await handleRespondToRequest(requestId, 'accepted');
        Swal.fire({
          title: '✅ Job Accepted!',
          text: 'Job accepted successfully! The customer has been notified.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#10b981'
        });
      } else if (action === 'decline') {
        await handleRespondToRequest(requestId, 'declined');
        Swal.fire({
          title: '❌ Job Declined',
          text: 'Job declined. The system will notify other available mechanics.',
          icon: 'info',
          confirmButtonText: 'OK',
          confirmButtonColor: '#6b7280'
        });
      }
    } catch (error) {
      console.error('Error handling email action:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to process the action. Please try again from the dashboard.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const fetchMechanicData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch mechanic profile to get registered location and profile data
      const profileResponse = await api.get('/api/auth/me');
      const mechanicProfile = profileResponse.data.user;

      // Update profile data with real information
      setProfileData(prev => ({
        ...prev,
        name: mechanicProfile.name || '',
        specialties: mechanicProfile.specializations || [],
        hourlyRate: mechanicProfile.hourlyRate || 0,
        experience: mechanicProfile.experience || '',
        location: mechanicProfile.location?.address ?
          `${mechanicProfile.location.address.city}, ${mechanicProfile.location.address.state}` :
          'Location not set',
        coordinates: mechanicProfile.location?.coordinates || null,
        rating: mechanicProfile.rating || 0
      }));

      // Use mechanic's registered location instead of current GPS
      if (mechanicProfile.location?.coordinates) {
        const [longitude, latitude] = mechanicProfile.location.coordinates;

        try {
          const response = await api.get('/api/service-requests/nearby', {
            params: {
              latitude: latitude,
              longitude: longitude,
              maxDistance: 50 // 50 miles
            }
          });
          setPendingRequests(response.data.requests || []);
        } catch (error) {
          console.error('Error fetching pending requests:', error);
          setPendingRequests([]);
          setError('Failed to load nearby service requests');
        }
      } else {
        console.warn('Mechanic location not found in profile');
        setPendingRequests([]);
        setError('Location not set. Please update your profile.');
      }

      // Fetch assigned jobs
      try {
        const jobsResponse = await api.get('/api/service-requests/mechanic/requests');
        const jobs = jobsResponse.data.requests || [];
        setAssignedJobs(jobs);

        // Calculate real stats
        const completedJobs = jobs.filter(job => job.status === 'completed').length;
        const activeJobs = jobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status)).length;

        // Calculate real earnings based on completed jobs
        const totalEarnings = completedJobs * (mechanicProfile.hourlyRate || 50);

        setStats({
          totalJobs: jobs.length,
          completedJobs,
          rating: mechanicProfile.rating || 0,
          earnings: totalEarnings,
          activeJobs,
          pendingRequests: pendingRequests.length
        });
      } catch (error) {
        console.error('Error fetching assigned jobs:', error);
        setAssignedJobs([]);
        setError('Failed to load assigned jobs');
      }

    } catch (error) {
      console.error('Error fetching mechanic data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
      setPendingRequests([]);
      setAssignedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId, response) => {
    try {
      const result = await api.post(`/api/service-requests/${requestId}/respond`, {
        response,
        notes: response === 'declined' ? 'Not available at this time' : ''
      });

      if (result.data.assigned) {
        Swal.fire({
          title: '🎉 Congratulations!',
          text: 'You have been assigned this job!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#10b981'
        });
        fetchMechanicData(); // Refresh data
      } else if (response === 'accepted') {
        Swal.fire({
          title: 'Job Assigned to Another Mechanic',
          text: 'Sorry, this job was assigned to another mechanic.',
          icon: 'info',
          confirmButtonText: 'OK',
          confirmButtonColor: '#6b7280'
        });
        fetchMechanicData(); // Refresh data
      } else {
        Swal.fire({
          title: 'Request Declined',
          text: 'You have declined this service request.',
          icon: 'info',
          confirmButtonText: 'OK',
          confirmButtonColor: '#6b7280'
        });
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      }
    } catch (error) {
      console.error('Error responding to request:', error);

      // SILENTLY handle all errors - no popups
      // Just refresh the data to show current state
      fetchMechanicData();
    }
  };

  const handleUpdateJobStatus = async (requestId, status) => {
    try {
      await api.patch(`/api/service-requests/${requestId}/mechanic-status`, {
        status,
        notes: `Status updated to ${status} by mechanic`
      });

      Swal.fire({
        title: 'Status Updated!',
        text: `Job status updated to ${status.replace('_', ' ')}`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981'
      });
      fetchMechanicData(); // Refresh data
    } catch (error) {
      console.error('Error updating job status:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to update job status. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'text-blue-500 bg-blue-100';
      case 'in_progress': return 'text-yellow-500 bg-yellow-100';
      case 'completed': return 'text-green-500 bg-green-100';
      case 'cancelled': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <FaCalendarAlt className="w-4 h-4" />;
      case 'in_progress': return <FaClock className="w-4 h-4" />;
      case 'completed': return <FaCheckCircle className="w-4 h-4" />;
      case 'cancelled': return <FaTimesCircle className="w-4 h-4" />;
      default: return <FaExclamationTriangle className="w-4 h-4" />;
    }
  };

  const handleAvailabilityChange = (day, field, value) => {
    setProfileData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  const saveProfile = () => {
    // API call to save profile
    console.log('Saving profile:', profileData);
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Mechanic Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {profileData.name || user?.name || 'Mechanic'}</p>
              {profileData.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FaMapMarkerAlt className="h-3 w-3" />
                  Service Area: {profileData.location}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur border border-border/50 rounded-xl px-4 py-2">
                <FaStar className="text-yellow-500" />
                <span className="font-semibold">{stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A'}</span>
                <span className="text-sm text-muted-foreground">Rating</span>
              </div>
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur border border-border/50 rounded-xl px-4 py-2">
                <FaDollarSign className="text-green-500" />
                <span className="font-semibold">${profileData.hourlyRate || 0}</span>
                <span className="text-sm text-muted-foreground">/hour</span>
              </div>
              <button
                onClick={fetchMechanicData}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FaRedo className={loading ? 'animate-spin' : ''} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className="btn-primary flex items-center gap-2 relative"
              >
                <FaBell />
                Messages
                {(pendingRequests.length > 0 || assignedJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status)).length > 0) && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingRequests.length + assignedJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status)).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold text-primary">{stats.totalJobs}</p>
              </div>
              <FaWrench className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-500">{stats.completedJobs}</p>
              </div>
              <FaCheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold text-accent">{stats.activeJobs}</p>
              </div>
              <FaClock className="h-8 w-8 text-accent" />
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-accent">${stats.earnings.toLocaleString()}</p>
              </div>
              <FaDollarSign className="h-8 w-8 text-accent" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
              activeTab === 'messages'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Messages
            {(pendingRequests.length > 0 || assignedJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status)).length > 0) && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingRequests.length + assignedJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status)).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
              activeTab === 'notifications'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Notifications
            {(pendingRequests.length > 0 || assignedJobs.filter(job => job.status === 'assigned').length > 0) && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingRequests.length + assignedJobs.filter(job => job.status === 'assigned').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            My Jobs
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'availability'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Availability
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Profile
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Messages Header */}
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FaBell className="text-blue-500" />
                  Messages & Actions
                </h3>
                <button
                  onClick={fetchMechanicData}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <FaRedo className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                All your service requests and job notifications in one place. Review and respond to each message.
              </p>
            </div>

            {/* New Service Requests */}
            {pendingRequests.length > 0 && (
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
                <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <FaClock className="text-orange-500" />
                  New Service Requests ({pendingRequests.length})
                </h4>
                <div className="space-y-4">
                  {pendingRequests.map(request => (
                    <div key={request._id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                            <FaBell className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-orange-900">New Service Request</p>
                            <p className="text-sm text-orange-700">{request.serviceType} - {request.customerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            request.urgency === 'emergency' ? 'bg-red-100 text-red-600' :
                            request.urgency === 'urgent' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {request.urgency?.charAt(0).toUpperCase() + request.urgency?.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-orange-700 font-medium">Problem Description</p>
                          <p className="text-orange-600">{request.problemDescription}</p>
                        </div>
                        <div>
                          <p className="text-orange-700 font-medium">Location</p>
                          <p className="flex items-center gap-1 text-orange-600">
                            <FaMapMarkerAlt className="w-3 h-3" />
                            {request.location?.address?.city}, {request.location?.address?.state}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-orange-600">
                          <FaClock className="inline w-3 h-3 mr-1" />
                          {Math.floor((Date.now() - new Date(request.createdAt)) / (1000 * 60))} minutes ago
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespondToRequest(request._id, 'declined')}
                            className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <FaTimes className="w-4 h-4" />
                            Decline
                          </button>
                          <button
                            onClick={() => handleRespondToRequest(request._id, 'accepted')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                          >
                            <FaCheck className="w-4 h-4" />
                            Approve & Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Jobs Requiring Action */}
            {assignedJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status)).length > 0 && (
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
                <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <FaWrench className="text-green-500" />
                  Job Actions Required ({assignedJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status)).length})
                </h4>
                <div className="space-y-4">
                  {assignedJobs.filter(job => job.status === 'assigned' && job.assignedMechanic._id === user.id).map(job => (
                    <div key={job._id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                            <FaExclamationTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-yellow-900">Job Assigned to You - Ready to Start</p>
                            <p className="text-sm text-yellow-700">{job.serviceType} - {job.customerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-600">
                            Assigned to You
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-yellow-700 font-medium">Problem Description</p>
                          <p className="text-yellow-600">{job.problemDescription}</p>
                        </div>
                        <div>
                          <p className="text-yellow-700 font-medium">Location</p>
                          <p className="flex items-center gap-1 text-yellow-600">
                            <FaMapMarkerAlt className="w-3 h-3" />
                            {job.location?.address?.city}, {job.location?.address?.state}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-yellow-600">
                          <FaClock className="inline w-3 h-3 mr-1" />
                          Assigned {Math.floor((Date.now() - new Date(job.updatedAt || job.createdAt)) / (1000 * 60))} minutes ago
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateJobStatus(job._id, 'in_progress')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
                          >
                            <FaPlay className="w-3 h-3" />
                            Start Service
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {assignedJobs.filter(job => job.status === 'accepted').map(job => (
                    <div key={job._id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-100 text-green-600">
                            <FaCheckCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900">Job Accepted - Ready to Start</p>
                            <p className="text-sm text-green-700">{job.serviceType} - {job.customerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-600">
                            Ready to Start
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-green-700 font-medium">Problem Description</p>
                          <p className="text-green-600">{job.problemDescription}</p>
                        </div>
                        <div>
                          <p className="text-green-700 font-medium">Location</p>
                          <p className="flex items-center gap-1 text-green-600">
                            <FaMapMarkerAlt className="w-3 h-3" />
                            {job.location?.address?.city}, {job.location?.address?.state}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-green-600">
                          <FaClock className="inline w-3 h-3 mr-1" />
                          Accepted {Math.floor((Date.now() - new Date(job.updatedAt || job.createdAt)) / (1000 * 60))} minutes ago
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateJobStatus(job._id, 'in_progress')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
                          >
                            <FaPlay className="w-3 h-3" />
                            Start Service
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {assignedJobs.filter(job => job.status === 'in_progress').map(job => (
                    <div key={job._id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <FaClock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">Service In Progress</p>
                            <p className="text-sm text-blue-700">{job.serviceType} - {job.customerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-600">
                            In Progress
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-blue-700 font-medium">Problem Description</p>
                          <p className="text-blue-600">{job.problemDescription}</p>
                        </div>
                        <div>
                          <p className="text-blue-700 font-medium">Location</p>
                          <p className="flex items-center gap-1 text-blue-600">
                            <FaMapMarkerAlt className="w-3 h-3" />
                            {job.location?.address?.city}, {job.location?.address?.state}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-blue-600">
                          <FaClock className="inline w-3 h-3 mr-1" />
                          Started {Math.floor((Date.now() - new Date(job.updatedAt || job.createdAt)) / (1000 * 60))} minutes ago
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateJobStatus(job._id, 'completed')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
                          >
                            <FaCheck className="w-3 h-3" />
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Messages */}
            {pendingRequests.length === 0 && assignedJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status)).length === 0 && !loading && (
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
                <div className="text-center py-12">
                  <FaBell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No New Messages</h4>
                  <p className="text-muted-foreground mb-4">
                    You're all caught up! No pending requests or job actions at the moment.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    New service requests and job notifications will appear here automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Service Area Map */}
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Service Area Map</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View your service area, pending requests, and nearby mechanics
              </p>
              <FreeMap
                center={profileData.coordinates ? [
                  profileData.coordinates[1], // latitude
                  profileData.coordinates[0]  // longitude
                ] : [6.9271, 79.8612]} // Default to Colombo, Sri Lanka
                zoom={12}
                serviceRequests={pendingRequests}
                userLocation={profileData.coordinates ? {
                  latitude: profileData.coordinates[1],
                  longitude: profileData.coordinates[0]
                } : null}
                height="400px"
              />
            </div>

            {/* Recent Jobs */}
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
              <div className="space-y-4">
                {assignedJobs.slice(0, 3).map(job => (
                  <div key={job._id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                      </div>
                      <div>
                        <p className="font-medium">{job.serviceType}</p>
                        <p className="text-sm text-muted-foreground">{job.customerName} • {job.location?.address?.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${profileData.hourlyRate || 50}</p>
                      <p className="text-sm text-muted-foreground">{new Date(job.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {assignedJobs.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <FaWrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No jobs yet. Accept service requests to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Notifications Header */}
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FaBell className="text-blue-500" />
                  Messages & Notifications
                </h3>
                <button
                  onClick={fetchMechanicData}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <FaRedo className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                All your service requests and job notifications in one place. Review and respond to each message.
              </p>
            </div>

            {/* New Service Requests */}
            {pendingRequests.length > 0 && (
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
                <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <FaClock className="text-orange-500" />
                  New Service Requests ({pendingRequests.length})
                </h4>
                <div className="space-y-4">
                  {pendingRequests.map(request => (
                    <div key={request._id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                            <FaBell className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-orange-900">New Service Request</p>
                            <p className="text-sm text-orange-700">{request.serviceType} - {request.customerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            request.urgency === 'emergency' ? 'bg-red-100 text-red-600' :
                            request.urgency === 'urgent' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {request.urgency?.charAt(0).toUpperCase() + request.urgency?.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-orange-700 font-medium">Problem Description</p>
                          <p className="text-orange-600">{request.problemDescription}</p>
                        </div>
                        <div>
                          <p className="text-orange-700 font-medium">Location</p>
                          <p className="flex items-center gap-1 text-orange-600">
                            <FaMapMarkerAlt className="w-3 h-3" />
                            {request.location?.address?.city}, {request.location?.address?.state}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-orange-600">
                          <FaClock className="inline w-3 h-3 mr-1" />
                          {Math.floor((Date.now() - new Date(request.createdAt)) / (1000 * 60))} minutes ago
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespondToRequest(request._id, 'declined')}
                            className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <FaTimes className="w-4 h-4" />
                            Decline
                          </button>
                          <button
                            onClick={() => handleRespondToRequest(request._id, 'accepted')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                          >
                            <FaCheck className="w-4 h-4" />
                            Approve & Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Job Actions Required */}
            {assignedJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status)).length > 0 && (
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
                <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <FaWrench className="text-green-500" />
                  Job Actions Required ({assignedJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status)).length})
                </h4>
                <div className="space-y-4">
                  {assignedJobs.filter(job => job.status === 'assigned').map(job => (
                    <div key={job._id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                            <FaExclamationTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-yellow-900">Job Assigned - Action Required</p>
                            <p className="text-sm text-yellow-700">{job.serviceType} - {job.customerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-600">
                            Pending Action
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-yellow-700 font-medium">Problem Description</p>
                          <p className="text-yellow-600">{job.problemDescription}</p>
                        </div>
                        <div>
                          <p className="text-yellow-700 font-medium">Location</p>
                          <p className="flex items-center gap-1 text-yellow-600">
                            <FaMapMarkerAlt className="w-3 h-3" />
                            {job.location?.address?.city}, {job.location?.address?.state}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-yellow-600">
                          <FaClock className="inline w-3 h-3 mr-1" />
                          Assigned {Math.floor((Date.now() - new Date(job.updatedAt || job.createdAt)) / (1000 * 60))} minutes ago
                        </div>
                        <div className="flex gap-2">
                      <button
                        onClick={() => handleRespondToRequest(job._id, 'accepted')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Accept Job
                      </button>
                          <button
                            onClick={() => handleUpdateJobStatus(job._id, 'in_progress')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                          >
                            Start Service
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {assignedJobs.filter(job => job.status === 'accepted').map(job => (
                    <div key={job._id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-100 text-green-600">
                            <FaCheckCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900">Job Accepted - Ready to Start</p>
                            <p className="text-sm text-green-700">{job.serviceType} - {job.customerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-600">
                            Ready to Start
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-green-700 font-medium">Problem Description</p>
                          <p className="text-green-600">{job.problemDescription}</p>
                        </div>
                        <div>
                          <p className="text-green-700 font-medium">Location</p>
                          <p className="flex items-center gap-1 text-green-600">
                            <FaMapMarkerAlt className="w-3 h-3" />
                            {job.location?.address?.city}, {job.location?.address?.state}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-green-600">
                          <FaClock className="inline w-3 h-3 mr-1" />
                          Accepted {Math.floor((Date.now() - new Date(job.updatedAt || job.createdAt)) / (1000 * 60))} minutes ago
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateJobStatus(job._id, 'in_progress')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
                          >
                            <FaPlay className="w-3 h-3" />
                            Start Service
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {assignedJobs.filter(job => job.status === 'in_progress').map(job => (
                    <div key={job._id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <FaClock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">Service In Progress</p>
                            <p className="text-sm text-blue-700">{job.serviceType} - {job.customerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-600">
                            In Progress
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-blue-700 font-medium">Problem Description</p>
                          <p className="text-blue-600">{job.problemDescription}</p>
                        </div>
                        <div>
                          <p className="text-blue-700 font-medium">Location</p>
                          <p className="flex items-center gap-1 text-blue-600">
                            <FaMapMarkerAlt className="w-3 h-3" />
                            {job.location?.address?.city}, {job.location?.address?.state}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-blue-600">
                          <FaClock className="inline w-3 h-3 mr-1" />
                          Started {Math.floor((Date.now() - new Date(job.updatedAt || job.createdAt)) / (1000 * 60))} minutes ago
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateJobStatus(job._id, 'completed')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
                          >
                            <FaCheck className="w-3 h-3" />
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Messages */}
            {pendingRequests.length === 0 && assignedJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status)).length === 0 && !loading && (
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
                <div className="text-center py-12">
                  <FaBell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No New Messages</h4>
                  <p className="text-muted-foreground mb-4">
                    You're all caught up! No pending requests or job actions at the moment.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    New service requests and job notifications will appear here automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Pending Service Requests</h3>
            <div className="space-y-4">
              {pendingRequests.map(request => (
                <div key={request._id} className="p-4 bg-muted/30 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                        <FaClock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{request.serviceType}</p>
                        <p className="text-sm text-muted-foreground">{request.customerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.urgency === 'emergency' ? 'bg-red-100 text-red-600' :
                        request.urgency === 'urgent' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {request.urgency?.charAt(0).toUpperCase() + request.urgency?.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground">Problem Description</p>
                      <p className="text-sm">{request.problemDescription}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="flex items-center gap-1">
                        <FaMapMarkerAlt className="w-3 h-3" />
                        {request.location?.address?.city}, {request.location?.address?.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <FaClock className="inline w-3 h-3 mr-1" />
                      {Math.floor((Date.now() - new Date(request.createdAt)) / (1000 * 60))} minutes ago
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespondToRequest(request._id, 'declined')}
                        className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <FaTimes className="w-4 h-4" />
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(request._id, 'accepted')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <FaCheck className="w-4 h-4" />
                        Accept Job
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {pendingRequests.length === 0 && !loading && (
                <div className="text-center py-8">
                  <FaBell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending requests at the moment.</p>
                  <p className="text-sm text-muted-foreground mt-2">New requests will appear here automatically.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">My Jobs</h3>
            <div className="space-y-4">
              {assignedJobs.map(job => (
                <div key={job._id} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                      </div>
                      <div>
                        <p className="font-medium">{job.serviceType}</p>
                        <p className="text-sm text-muted-foreground">{job.customerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${profileData.hourlyRate || 50}</p>
                      <p className="text-sm text-muted-foreground">{new Date(job.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground">Problem Description</p>
                      <p className="text-sm">{job.problemDescription}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="flex items-center gap-1">
                        <FaMapMarkerAlt className="w-3 h-3" />
                        {job.location?.address?.city}, {job.location?.address?.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="text-sm font-medium">{job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}</p>
                    </div>
                  </div>

                  {job.status === 'assigned' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateJobStatus(job._id, 'accepted')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Accept Job
                      </button>
                      <button
                        onClick={() => handleUpdateJobStatus(job._id, 'in_progress')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Start Service
                      </button>
                    </div>
                  )}

                  {job.status === 'accepted' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateJobStatus(job._id, 'in_progress')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Start Service
                      </button>
                    </div>
                  )}

                  {job.status === 'in_progress' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateJobStatus(job._id, 'completed')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {assignedJobs.length === 0 && !loading && (
                <div className="text-center py-8">
                  <FaWrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No jobs assigned yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">Check the "Pending Requests" tab to accept new jobs.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Availability Settings</h3>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="btn-secondary flex items-center gap-2"
              >
                {isEditingProfile ? <FaTimes /> : <FaEdit />}
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(profileData.availability).map(([day, schedule]) => (
                <div key={day} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-24">
                      <p className="font-medium capitalize">{day}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={schedule.available}
                        onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                        disabled={!isEditingProfile}
                        className="rounded"
                      />
                      <span className="text-sm text-muted-foreground">Available</span>
                    </div>
                  </div>
                  {schedule.available && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={schedule.start}
                        onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                        disabled={!isEditingProfile}
                        className="px-3 py-1 border border-border rounded-lg bg-background"
                      />
                      <span className="text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={schedule.end}
                        onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                        disabled={!isEditingProfile}
                        className="px-3 py-1 border border-border rounded-lg bg-background"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {isEditingProfile && (
              <div className="flex justify-end mt-6">
                <button onClick={saveProfile} className="btn-primary flex items-center gap-2">
                  <FaSave />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Profile Management</h3>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="btn-secondary flex items-center gap-2"
              >
                {isEditingProfile ? <FaTimes /> : <FaEdit />}
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {profileData.specialties.map((specialty, index) => (
                    <span key={index} className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Hourly Rate</label>
                <p className="text-lg font-semibold">${profileData.hourlyRate}/hour</p>
              </div>

              <div>
                <label className="label">Experience</label>
                <p className="text-lg font-semibold">{profileData.experience}</p>
              </div>

              <div>
                <label className="label">Service Area</label>
                <p className="text-lg font-semibold">{profileData.location}</p>
              </div>
            </div>

            {isEditingProfile && (
              <div className="flex justify-end mt-6">
                <button onClick={saveProfile} className="btn-primary flex items-center gap-2">
                  <FaSave />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MechanicDashboard;
