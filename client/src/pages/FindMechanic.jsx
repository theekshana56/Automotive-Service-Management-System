import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaUser, FaPhone, FaTools, FaSearch, FaClock, FaCheckCircle } from 'react-icons/fa';
import api from '../api/client';
import FreeMap from '../components/FreeMap';

// Validation utilities
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15 && phoneRegex.test(cleanPhone);
};

const validateCoordinates = (lat, lng) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  return !isNaN(latNum) && !isNaN(lngNum) &&
         latNum >= -90 && latNum <= 90 &&
         lngNum >= -180 && lngNum <= 180;
};

const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s]+$/;
  return nameRegex.test(name.trim());
};

const FindMechanic = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Real-time validation state
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Get today's date in YYYY-MM-DD format for min/max attributes
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    // User Information
    name: '',
    phone: '',
    email: '',

    // Location Information
    location: {
      latitude: '',
      longitude: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      },
      serviceRadius: '10' // miles
    },

    // Service Information
    serviceType: '',
    problemDescription: '',
    urgency: 'normal', // normal, urgent, emergency
    preferredTime: '',
    additionalNotes: ''
  });

  const serviceTypes = [
    'Engine Issues',
    'Brake Problems',
    'Battery/Jump Start',
    'Tire Issues',
    'Overheating',
    'Electrical Problems',
    'Transmission Issues',
    'Oil Change',
    'Diagnostics',
    'Emergency Towing',
    'Other'
  ];

  const urgencyLevels = [
    { value: 'normal', label: 'Normal (Within 24 hours)', color: 'bg-blue-500' },
    { value: 'urgent', label: 'Urgent (Within 4 hours)', color: 'bg-yellow-500' },
    { value: 'emergency', label: 'Emergency (ASAP)', color: 'bg-red-500' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'address') {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: {
              ...prev.location.address,
              [child]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle location selection from map
  const handleLocationSelect = async (location) => {
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString()
      }
    }));

    // Try to reverse geocode using OpenStreetMap's Nominatim (free)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.address) {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: {
              street: data.address.house_number ? `${data.address.house_number} ${data.address.road || ''}`.trim() : (data.address.road || ''),
              city: data.address.city || data.address.town || data.address.village || '',
              state: data.address.state || '',
              zipCode: data.address.postcode || '',
              country: data.address.country || 'USA'
            }
          }
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Don't show error for geocoding failure, just use coordinates
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: latitude.toString(),
              longitude: longitude.toString()
            }
          }));

          setCurrentLocation({ latitude, longitude });

          // Try to reverse geocode the coordinates to get address
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();

            setFormData(prev => ({
              ...prev,
              location: {
                ...prev.location,
                address: {
                  street: data.localityInfo?.administrative?.[2]?.name || '',
                  city: data.city || '',
                  state: data.principalSubdivision || '',
                  zipCode: data.postcode || '',
                  country: data.countryName || 'USA'
                }
              }
            }));
          } catch (error) {
            console.error('Error reverse geocoding:', error);
            setError('Location detected but address lookup failed. Please enter address manually.');
          }

          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please enter it manually.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  // Real-time field validation
  const validateField = (fieldName, value) => {
    let error = '';

    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          error = 'Name is required';
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        } else if (!validateName(value)) {
          error = 'Name can only contain letters and spaces';
        }
        break;

      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (!validatePhone(value)) {
          error = 'Please enter a valid phone number';
        }
        break;

      case 'email':
        if (value && !validateEmail(value)) {
          error = 'Please enter a valid email address';
        }
        break;

      case 'location.latitude':
      case 'location.longitude':
        const lat = fieldName === 'location.latitude' ? value : formData.location.latitude;
        const lng = fieldName === 'location.longitude' ? value : formData.location.longitude;
        if (!lat || !lng) {
          error = 'Both latitude and longitude are required';
        } else if (!validateCoordinates(lat, lng)) {
          error = 'Please enter valid coordinates';
        }
        break;

      case 'serviceType':
        if (!value) {
          error = 'Please select a service type';
        }
        break;

      case 'problemDescription':
        if (!value.trim()) {
          error = 'Please describe your problem';
        } else if (value.trim().length < 10) {
          error = 'Please provide more details (at least 10 characters)';
        }
        break;

      case 'location.serviceRadius':
        const radius = parseInt(value);
        if (value && (isNaN(radius) || radius < 1 || radius > 50)) {
          error = 'Service radius must be between 1 and 50 miles';
        }
        break;

      default:
        break;
    }

    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    return error === '';
  };

  // Handle field blur for real-time validation
  const handleFieldBlur = (fieldName, value) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
    validateField(fieldName, value);
  };

  // Handle field change with validation
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    handleInputChange(e);

    // Validate on change if field has been touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const validateForm = () => {
    const requiredFields = ['name', 'phone', 'location.latitude', 'location.longitude', 'serviceType', 'problemDescription'];
    let isValid = true;

    for (const field of requiredFields) {
      let value = formData;
      const fieldPath = field.split('.');
      for (const path of fieldPath) {
        value = value?.[path];
      }

      if (!validateField(field, value)) {
        isValid = false;
        setTouched(prev => ({ ...prev, [field]: true }));
      }
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const serviceRequestData = {
        ...formData,
        location: {
          ...formData.location,
          latitude: parseFloat(formData.location.latitude),
          longitude: parseFloat(formData.location.longitude)
        }
      };

      const response = await api.post('/api/service-requests', serviceRequestData);

      if (response.status === 201) {
        // Navigate to waiting page with request ID
        navigate(`/waiting/${response.data.requestId}`);
      } else {
        setError('Failed to submit service request. Please try again.');
      }
    } catch (error) {
      console.error('Service request error:', error);
      setError(error.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FaSearch className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold">Find a Mechanic</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Get instant help from certified mechanics in your area
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaUser className="h-6 w-6 text-primary mr-2" />
              Personal Information
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('name', e.target.value)}
                  onKeyDown={(e) => {
                    // Allow backspace, delete, tab, escape, enter, space, and arrow keys
                    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' ||
                        e.key === 'Escape' || e.key === 'Enter' || e.key === 'ArrowLeft' ||
                        e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') {
                      return;
                    }
                    // Prevent input if it's not a letter
                    if (!/[a-zA-Z]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  required
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched.name && fieldErrors.name ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="Enter your full name"
                />
                {touched.name && fieldErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                  required
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched.phone && fieldErrors.phone ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="(555) 123-4567"
                />
                {touched.phone && fieldErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('email', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched.email && fieldErrors.email ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="your.email@example.com"
                />
                {touched.email && fieldErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaMapMarkerAlt className="h-6 w-6 text-primary mr-2" />
              Location Information
            </h2>

            <div className="mb-6">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FaMapMarkerAlt className="h-4 w-4" />
                {loading ? 'Getting Location...' : 'Use Current Location'}
              </button>
              <p className="text-sm text-muted mt-2">
                We'll automatically detect your coordinates and try to fill in your address
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Latitude *</label>
                <input
                  type="number"
                  name="location.latitude"
                  value={formData.location.latitude}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('location.latitude', e.target.value)}
                  step="any"
                  required
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched['location.latitude'] && fieldErrors['location.latitude'] ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="40.7128"
                />
                {touched['location.latitude'] && fieldErrors['location.latitude'] && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors['location.latitude']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Longitude *</label>
                <input
                  type="number"
                  name="location.longitude"
                  value={formData.location.longitude}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('location.longitude', e.target.value)}
                  step="any"
                  required
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched['location.longitude'] && fieldErrors['location.longitude'] ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="-74.0060"
                />
                {touched['location.longitude'] && fieldErrors['location.longitude'] && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors['location.longitude']}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.location.address.street}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.location.address.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="New York"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.location.address.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="NY"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code</label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.location.address.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="10001"
                />
              </div>
            </div>

            {/* Interactive Map */}
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Select Location on Map
              </label>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                Click on the map to select your exact location, or use the "Use Current Location" button above.
              </p>
              <div style={{
                height: '400px',
                width: '100%',
                backgroundColor: '#f0f0f0',
                border: '2px dashed #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.625rem' }}>🗺️</div>
                  <p style={{ color: '#666', marginBottom: '0.625rem' }}>Interactive Map</p>
                  <p style={{ color: '#999', fontSize: '0.875rem' }}>Click map to select location</p>
                  <button
                    type="button"
                    onClick={() => {
                      // Simple coordinate input for testing
                      const lat = prompt('Enter latitude (e.g., 40.7128):', '40.7128');
                      const lng = prompt('Enter longitude (e.g., -74.0060):', '-74.0060');
                      if (lat && lng) {
                        handleLocationSelect({
                          latitude: parseFloat(lat),
                          longitude: parseFloat(lng)
                        });
                      }
                    }}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  >
                    Enter Coordinates Manually
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaTools className="h-6 w-6 text-primary mr-2" />
              Service Information
            </h2>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Service Type *</label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('serviceType', e.target.value)}
                  required
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched.serviceType && fieldErrors.serviceType ? 'border-red-500' : 'border-border'
                  }`}
                >
                  <option value="">Select a service type</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {touched.serviceType && fieldErrors.serviceType && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.serviceType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Urgency Level</label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {urgencyLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Problem Description *</label>
              <textarea
                name="problemDescription"
                value={formData.problemDescription}
                onChange={handleFieldChange}
                onBlur={(e) => handleFieldBlur('problemDescription', e.target.value)}
                required
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  touched.problemDescription && fieldErrors.problemDescription ? 'border-red-500' : 'border-border'
                }`}
                placeholder="Please describe your vehicle's problem in detail..."
              />
              {touched.problemDescription && fieldErrors.problemDescription && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.problemDescription}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Time (Today Only)</label>
                <input
                  type="datetime-local"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                  min={getTodayDate() + "T00:00"}
                  max={getTodayDate() + "T23:59"}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted mt-1">You can only select today's date and time</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Service Radius (miles)</label>
                <input
                  type="number"
                  name="location.serviceRadius"
                  value={formData.location.serviceRadius}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('location.serviceRadius', e.target.value)}
                  min="1"
                  max="50"
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched['location.serviceRadius'] && fieldErrors['location.serviceRadius'] ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="10"
                />
                {touched['location.serviceRadius'] && fieldErrors['location.serviceRadius'] && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors['location.serviceRadius']}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Additional Notes</label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Any additional information or special requests..."
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
              {error}
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {loading ? (
                <>
                  <FaClock className="animate-spin h-5 w-5" />
                  Finding Mechanics...
                </>
              ) : (
                <>
                  <FaSearch className="h-5 w-5" />
                  Find Mechanic Now
                </>
              )}
            </button>
            <p className="text-sm text-muted mt-2">
              Your request will be sent to all available mechanics in your area
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FindMechanic;
