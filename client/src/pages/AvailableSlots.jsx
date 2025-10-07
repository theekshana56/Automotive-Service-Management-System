import React, { useState, useEffect } from 'react';
  import { Navigate } from 'react-router-dom';
  import api from '../api/client';
  import { useAuth } from '../store/auth';

  export default function AvailableSlots() {
    const { user, loading } = useAuth();
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [advisorCount, setAdvisorCount] = useState(0);
    const [loadingAdvisors, setLoadingAdvisors] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [queueInfo, setQueueInfo] = useState(null);
    const [loadingQueue, setLoadingQueue] = useState(false);

    // Set tomorrow's date as default (since today is blocked)
    useEffect(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().slice(0, 10));
    }, []);

 // Load advisor count on mount if user is authenticated
    useEffect(() => {
  if (user) {
    loadAdvisorCount();
  }
}, [user]);

    // Tomorrow's date
    function tomorrowStr() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    }

    // fixed date two weeks from today
    function twoWeeksFromTodayStr() {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return d.toISOString().slice(0, 10);
    }

    // Load available slots when date changes (only if user is authenticated)
    useEffect(() => {
      if (selectedDate && user) {
        loadAvailableSlots();
      } else if (!user && !loading) {
        // Clear slots when user logs out
        setAvailableSlots([]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, user, loading]);

        //advisor count load
  const loadAdvisorCount = async () => {
  setLoadingAdvisors(true);
  try {
    const response = await api.get('/api/users/advisors');
    const advisors = response.data.advisors || [];
    setAdvisorCount(advisors.length);
  } catch (error) {
    console.error('Failed to load advisor count:', error);
    setAdvisorCount(0);
  } finally {
    setLoadingAdvisors(false);
  }
};


    const loadAvailableSlots = async () => {
      if (!user) return; // Don't load if not authenticated

      setLoadingSlots(true);
      try {
        const { data } = await api.get(`/api/bookings/available-slots?date=${encodeURIComponent(selectedDate)}`);
        const slots = Array.isArray(data?.availableSlots) ? data.availableSlots : [];
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Failed to load available slots:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    const loadQueueInfo = async (timeSlot) => {
      if (!user || !selectedDate) return;

      setLoadingQueue(true);
      setQueueInfo(null); // clear stale data while loading
      try {
        const { data } = await api.get(
          `/api/bookings/queue-info?date=${encodeURIComponent(selectedDate)}&timeSlot=${encodeURIComponent(timeSlot)}`
        );
        setQueueInfo(data || null);
      } catch (error) {
        console.error('Failed to load queue info:', error);
        setQueueInfo(null);
      } finally {
        setLoadingQueue(false);
      }
    };

    const handleSlotClick = (slot) => {
      if (slot.queueLength > 0) {
        setSelectedSlot(slot);
        setQueueInfo(null);
        loadQueueInfo(slot.timeSlot);
      }
    };

    const getStatusText = (isAvailable, advisorsAvailable, queueLength) => {
      if (!isAvailable && queueLength > 0) return `Queue Available (${queueLength} people)`;
      if (!isAvailable) return 'All Advisors Busy';
      if (advisorsAvailable <= 5) return `Limited Availability (${advisorsAvailable} left)`;
      return `Available (${advisorsAvailable} advisors)`;
    };

    // Show loading while checking authentication
    if (loading) {
      return (
        <div className="card">
          <div className="text-center py-8">
            <div className="text-gray-600">Loading...</div>
          </div>
        </div>
      );
    }

    // Redirect to login if not authenticated
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return (
      <div className="card p-8">
        <h1 className="text-2xl font-semibold mb-6 section-title">Available Service Slots</h1>

        {/* Date Selector */}
        <div className="mb-8 glass-panel p-6">
          <label className="label mb-2">Select Date</label>
          <div className="relative w-full max-w-xs">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={tomorrowStr()}
              max={twoWeeksFromTodayStr()}
              className="input w-full pl-12 pr-4 py-2 rounded-xl bg-glass border border-white/10 shadow focus:border-primary/70 focus:ring-2 focus:ring-primary/30 transition-all duration-200 hover:border-primary/40 hover:shadow-lg"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3.75 7.5h16.5M4.5 21h15a.75.75 0 00.75-.75V6.75A2.25 2.25 0 0018 4.5H6A2.25 2.25 0 003.75 6.75v13.5c0 .414.336.75.75.75z"
                />
              </svg>
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loadingSlots && (
          <div className="text-center py-8">
            <div className="text-muted">Loading available slots...</div>
          </div>
        )}

        {/* Available Slots Grid */}
        {!loadingSlots && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {availableSlots.map((slot, index) => (
              <div
                key={index}
                className="relative p-4 rounded-2xl border border-white/10 bg-glass shadow-lg backdrop-blur-md transition-all duration-200 cursor-pointer group hover:scale-[1.03] hover:shadow-2xl hover:border-primary/60 hover:ring-2 hover:ring-primary/30"
                onClick={() => handleSlotClick(slot)}
              >
                <div className="text-center">
                  {/* Time Slot */}
                  <h3 className="font-semibold text-lg mb-2 text-primary drop-shadow">{slot.timeSlot}</h3>
                  {/* Status Badge (other statuses) */}
                  {!slot.isAvailable && (
                    <span className="px-4 py-2 rounded-full text-xs font-medium transition-colors duration-200 bg-orange-100 text-orange-800 group-hover:ring-2 group-hover:ring-accent2/60 whitespace-nowrap">
                      {getStatusText(slot.isAvailable, slot.advisorsAvailable, slot.queueLength)}
                    </span>
                  )}
                  {/* Advisors Info */}
                  <div className="mt-2 text-sm text-slate-200">
                    <p>
                      <strong>Advisors:</strong> {slot.advisorsAvailable}/{slot.totalAdvisors}
                    </p>
                    {slot.advisorsAssigned > 0 && (
                      <p className="text-xs mt-1 text-slate-300">
                        {slot.advisorsAssigned} advisor{slot.advisorsAssigned > 1 ? 's' : ''} assigned
                      </p>
                    )}
                    {slot.queueLength > 0 && (
                      <p className="text-xs mt-1 text-orange-500">{slot.queueLength} in queue</p>
                    )}
                  </div>
                  {/* Status Badge at bottom */}
                  {slot.isAvailable && slot.advisorsAvailable > 5 && (
                    <div className="flex justify-center mt-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white font-semibold shadow-sm text-sm whitespace-nowrap">
                        ✅ Ready for booking
                      </span>
                    </div>
                  )}
                  {slot.isAvailable && slot.advisorsAvailable <= 5 && (
                    <div className="flex justify-center mt-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-300 text-yellow-900 font-semibold shadow-sm text-sm whitespace-nowrap">
                        ⚠️ Limited availability ({slot.advisorsAvailable} left)
                      </span>
                    </div>
                  )}
                  {!slot.isAvailable && slot.queueLength > 0 && (
                    <div className="mt-2 text-sm text-green-400">
                      <p>📋 Join queue</p>
                    </div>
                  )}
                  {!slot.isAvailable && slot.queueLength === 0 && (
                    <div className="mt-2 text-sm text-red-400">
                      <p>❌ All advisors busy</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Queue Information Modal */}
        {selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="glass-panel p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold section-title">
                  Queue Information: {selectedSlot.timeSlot}
                </h3>
                <button
                  onClick={() => {
                    setSelectedSlot(null);
                    setQueueInfo(null);
                    setLoadingQueue(false);
                  }}
                  className="text-muted hover:text-slate-100 text-2xl"
                >
                  ×
                </button>
              </div>

              {loadingQueue ? (
                <div className="text-center py-8">
                  <div className="text-gray-600">Loading queue information...</div>
                </div>
              ) : queueInfo ? (
                <div className="space-y-4">
                  {/* Queue Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-surface/50 rounded border border-white/10">
                      <p className="text-sm text-muted">Queue Length</p>
                      <p className="text-lg font-semibold text-accent">{queueInfo.queueLength} people</p>
                    </div>
                    <div className="text-center p-3 bg-surface/50 rounded border border-white/10">
                      <p className="text-sm text-muted">Advisors Available</p>
                      <p className="text-lg font-semibold text-accent">
                        {queueInfo.advisorsAvailable}/{queueInfo.totalAdvisors}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-surface/50 rounded border border-white/10">
                      <p className="text-sm text-muted">Estimated Wait</p>
                      <p className="text-lg font-semibold text-accent">{queueInfo.estimatedWaitTime} minutes</p>
                    </div>
                    <div className="text-center p-3 bg-surface/50 rounded border border-white/10">
                      <p className="text-sm text-muted">Next Available</p>
                      <p className="text-lg font-semibold text-accent">{queueInfo.nextAvailableTime}</p>
                    </div>
                  </div>

                  {Array.isArray(queueInfo.queuedBookings) && queueInfo.queuedBookings.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-slate-100">Current Queue:</h4>
                      <div className="space-y-2">
                        {queueInfo.queuedBookings.map((booking) => (
                          <div key={booking.id} className="p-3 bg-surface/30 rounded border border-white/20">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-slate-200">
                                  #{booking.queuePosition} - {booking.userName}
                                </p>
                                <p className="text-sm text-muted">
                                  {booking.serviceType} - {booking.vehicle?.model}
                                </p>
                              </div>
                              <div className="text-right text-sm text-accent">
                                <p>Est: {new Date(booking.estimatedServiceTime).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-surface/30 rounded-lg border border-white/20">
                    <p className="text-sm text-slate-200">
                      <strong>How it works:</strong> When you join the queue, you'll be automatically assigned an
                      advisor as soon as one becomes available. The system processes the queue in order, so earlier
                      bookings get priority.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setSelectedSlot(null);
                        setQueueInfo(null);
                      }}
                      className="px-4 py-2 text-muted border border-white/20 rounded hover:bg-surface/50 hover:text-slate-200 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        const timeSlot = selectedSlot?.timeSlot;
                        setSelectedSlot(null);
                        setQueueInfo(null);
                        // Navigate to booking page with pre-filled time slot
                        window.location.href = `/book-appointment?date=${encodeURIComponent(
                          selectedDate
                        )}&timeSlot=${encodeURIComponent(timeSlot || '')}`;
                      }}
                      className="px-4 py-2 bg-accent text-bg rounded hover:bg-accent/90 transition-colors"
                    >
                      Join Queue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-red-400">
                  Failed to load queue information. Please try again.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {!loadingSlots && availableSlots.length > 0 && (
          <div className="mt-8 glass-panel p-6">
            <h3 className="font-semibold mb-2">Summary for {selectedDate}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="font-medium">Available Slots:</span>
                <span className="ml-2 text-green-600">
                  {availableSlots.filter((slot) => slot.isAvailable).length}
                </span>
              </div>
              <div>
                <span className="font-medium">Fully Booked:</span>
                <span className="ml-2 text-red-600">
                  {availableSlots.filter((slot) => !slot.isAvailable && slot.queueLength === 0).length}
                </span>
              </div>
              <div>
                <span className="font-medium">Limited Availability:</span>
                <span className="ml-2 text-yellow-600">
                  {availableSlots.filter((slot) => slot.isAvailable && slot.advisorsAvailable <= 5).length}
                </span>
              </div>
              <div>
                <span className="font-medium">Queue Available:</span>
                <span className="ml-2 text-orange-600">
                  {availableSlots.filter((slot) => !slot.isAvailable && slot.queueLength > 0).length}
                </span>
              </div>
              <div>
                <span className="font-medium">Total Advisors:</span>
                <span className="ml-2 text-blue-600">{loadingAdvisors ? '...' : advisorCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* No Slots Message */}
        {!loadingSlots && availableSlots.length === 0 && (
          <div className="text-center py-8 text-muted">No slots available for the selected date.</div>
        )}
      </div>
    );
  }
