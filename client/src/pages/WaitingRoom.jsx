import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaClock, FaPhone, FaUser, FaTools, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../api/client';
import FreeMap from '../components/FreeMap';

const WaitingRoom = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mechanics, setMechanics] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [assignedPopupShown, setAssignedPopupShown] = useState(false);

  useEffect(() => {
    setAssignedPopupShown(false); // Reset popup flag when requestId changes
    if (requestId) {
      fetchRequestDetails();
      // Start polling for updates every 5 seconds
      const interval = setInterval(fetchRequestDetails, 5000);
      setPollingInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      const response = await api.get(`/api/service-requests/${requestId}`);
      const requestData = response.data.request;

      setRequest(requestData);

      // If request is assigned, show success message but keep user on waiting page
      if (requestData.status === 'assigned' && !assignedPopupShown) {
        setAssignedPopupShown(true);
        Swal.fire({
          title: '🎉 Great News!',
          text: `${requestData.assignedMechanic?.name || 'A mechanic'} has accepted your request and will contact you soon!`,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#10b981',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      } else if (requestData.status === 'completed') {
        if (pollingInterval) clearInterval(pollingInterval);
        // Show completion message and redirect to home
        Swal.fire({
          title: '✅ Service Completed!',
          text: 'Your service request has been completed successfully!',
          icon: 'success',
          confirmButtonText: 'Go Home',
          confirmButtonColor: '#10b981'
        }).then(() => {
          navigate('/');
        });
      } else if (requestData.status === 'cancelled') {
        if (pollingInterval) clearInterval(pollingInterval);
        // Show cancellation message and redirect to home
        Swal.fire({
          title: '❌ Request Cancelled',
          text: 'Your service request has been cancelled.',
          icon: 'info',
          confirmButtonText: 'Go Home',
          confirmButtonColor: '#6b7280'
        }).then(() => {
          navigate('/');
        });
      }

      // Fetch nearby mechanics for map display
      if (requestData.location?.coordinates) {
        fetchNearbyMechanics(requestData.location.coordinates);
      }

    } catch (error) {
      console.error('Error fetching request details:', error);
      setError('Failed to load request details');
      
      // Show error with SweetAlert
      Swal.fire({
        title: 'Error Loading Request',
        text: 'Failed to load request details. Please try again.',
        icon: 'error',
        confirmButtonText: 'Go Home',
        confirmButtonColor: '#ef4444'
      }).then(() => {
        navigate('/');
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyMechanics = async (coordinates) => {
    try {
      const response = await api.get('/api/service-requests/mechanics/nearby', {
        params: {
          latitude: coordinates[1], // coordinates[1] is latitude
          longitude: coordinates[0], // coordinates[0] is longitude
          maxDistance: 25 // 25 miles radius
        }
      });

      setMechanics(response.data.mechanics || []);
    } catch (error) {
      console.error('Error fetching nearby mechanics:', error);
      // If API fails, show empty list instead of mock data
      setMechanics([]);
    }
  };

  const cancelRequest = async () => {
    const result = await Swal.fire({
      title: 'Cancel Service Request?',
      text: 'Are you sure you want to cancel this service request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await api.patch(`/api/service-requests/${requestId}/status`, {
        status: 'cancelled',
        notes: 'Cancelled by customer',
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone
      });

      Swal.fire({
        title: 'Request Cancelled',
        text: 'Your service request has been cancelled successfully.',
        icon: 'success',
        confirmButtonText: 'Go Home',
        confirmButtonColor: '#10b981'
      }).then(() => {
        navigate('/');
      });
    } catch (error) {
      // Enhanced error logging for debugging
      console.error('❌ Error cancelling request:', error);

      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
        console.error('❌ Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('❌ No response received:', error.request);
        console.error('❌ Request details:', {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        });
      } else {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }

      let errorMessage = 'Failed to cancel request. Please try again.';

      if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You can only cancel your own requests.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'assigned': return 'text-green-500';
      case 'accepted': return 'text-blue-500';
      case 'in_progress': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Finding Mechanics';
      case 'assigned': return 'Mechanic Assigned';
      case 'accepted': return 'Mechanic Accepted';
      case 'in_progress': return 'Service In Progress';
      case 'completed': return 'Service Completed';
      case 'cancelled': return 'Request Cancelled';
      default: return 'Unknown Status';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-xl">Loading your request...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FaTimesCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-red-500">{error || 'Request not found'}</p>
          <button
            onClick={async () => {
              const result = await Swal.fire({
                title: 'Go Home?',
                text: 'Are you sure you want to go back to the home page?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Yes, go home',
                cancelButtonText: 'Stay here'
              });
              
              if (result.isConfirmed) {
                navigate('/');
              }
            }}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Waiting for Mechanic</h1>
          <p className="text-muted-foreground">Your service request has been sent to nearby mechanics</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Request Details */}
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaTools className="h-5 w-5 text-primary mr-2" />
              Service Request Details
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={`font-medium ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Service Type:</span>
                <span className="font-medium">{request.serviceType}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Urgency:</span>
                <span className={`font-medium ${
                  request.urgency === 'emergency' ? 'text-red-500' :
                  request.urgency === 'urgent' ? 'text-yellow-500' : 'text-blue-500'
                }`}>
                  {request.urgency?.charAt(0).toUpperCase() + request.urgency?.slice(1)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Request Time:</span>
                <span className="font-medium">
                  {new Date(request.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Problem Description:</h3>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {request.problemDescription}
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Your Information:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FaUser className="h-4 w-4 text-muted-foreground" />
                    <span>{request.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPhone className="h-4 w-4 text-muted-foreground" />
                    <span>{request.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="h-4 w-4 text-muted-foreground" />
                    <span>{request.location?.address?.city}, {request.location?.address?.state}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={cancelRequest}
                className="flex-1 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                Cancel Request
              </button>
              <button
                onClick={async () => {
                  const result = await Swal.fire({
                    title: 'Leave Waiting Room?',
                    text: 'Are you sure you want to leave? You can come back anytime to check your request status.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#10b981',
                    cancelButtonColor: '#6b7280',
                    confirmButtonText: 'Yes, go home',
                    cancelButtonText: 'Stay here'
                  });
                  
                  if (result.isConfirmed) {
                    navigate('/');
                  }
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>

          {/* Map and Mechanics */}
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaMapMarkerAlt className="h-5 w-5 text-primary mr-2" />
              Nearby Mechanics
            </h2>

            {/* Interactive Map */}
            <div className="mb-4">
              <FreeMap
                center={[
                  request.location.coordinates[1],
                  request.location.coordinates[0]
                ]}
                zoom={13}
                serviceRequests={[request]}
                mechanics={mechanics}
                userLocation={{
                  latitude: request.location.coordinates[1],
                  longitude: request.location.coordinates[0]
                }}
                height="300px"
              />
            </div>

            {/* Mechanics List */}
            <div className="space-y-3">
              <h3 className="font-medium">Available Mechanics ({mechanics.length})</h3>

              {mechanics.map((mechanic) => (
                <div key={mechanic.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {mechanic.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{mechanic.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>⭐ {mechanic.rating}</span>
                        <span>•</span>
                        <span>{mechanic.distance}</span>
                        <span>•</span>
                        <span>{mechanic.eta} away</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              ))}

              {mechanics.length === 0 && (
                <div className="text-center py-8">
                  <FaClock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Searching for mechanics...</p>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600">
                <FaClock className="h-4 w-4" />
                <span className="text-sm font-medium">Finding the best mechanic for you...</span>
              </div>
              <p className="text-xs text-blue-500 mt-1">
                Your request has been sent to {request.notificationsSent ? request.notificationCount : 'multiple'} nearby mechanics
              </p>
            </div>
          </div>
        </div>

        {/* Status Updates */}
        <div className="mt-6 bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Request Timeline</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <FaCheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium">Request Submitted</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {request.notificationsSent && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Notifications Sent</p>
                  <p className="text-sm text-muted-foreground">
                    Sent to {request.notificationCount} nearby mechanics
                  </p>
                </div>
              </div>
            )}

            {request.status === 'assigned' && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Mechanic Assigned</p>
                  <p className="text-sm text-muted-foreground">
                    {request.assignedMechanic?.name} will contact you soon
                  </p>
                </div>
              </div>
            )}

            {request.status === 'pending' && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                  <FaClock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Waiting for Mechanic Response</p>
                  <p className="text-sm text-muted-foreground">
                    Mechanics in your area are reviewing your request
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
