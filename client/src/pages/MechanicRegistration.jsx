import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import { FaWrench, FaMapMarkerAlt, FaClock, FaDollarSign, FaCertificate } from 'react-icons/fa';
import api from '../api/client';

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

const validateLicenseNumber = (license) => {
  return license.trim().length >= 5 && license.trim().length <= 20;
};

const validateCoordinates = (lat, lng) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  return !isNaN(latNum) && !isNaN(lngNum) &&
         latNum >= -90 && latNum <= 90 &&
         lngNum >= -180 && lngNum <= 180;
};

const validateHourlyRate = (rate) => {
  const rateNum = parseFloat(rate);
  return !isNaN(rateNum) && rateNum > 0 && rateNum <= 500;
};

const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s]+$/;
  return nameRegex.test(name.trim()) && name.trim().length > 0;
};

const MechanicRegistration = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    specialties: [],
    experience: '',
    hourlyRate: '',
    location: {
      latitude: '',
      longitude: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      }
    },
    availability: {
      monday: { start: '09:00', end: '17:00', isAvailable: true },
      tuesday: { start: '09:00', end: '17:00', isAvailable: true },
      wednesday: { start: '09:00', end: '17:00', isAvailable: true },
      thursday: { start: '09:00', end: '17:00', isAvailable: true },
      friday: { start: '09:00', end: '17:00', isAvailable: true },
      saturday: { start: '09:00', end: '15:00', isAvailable: true },
      sunday: { start: '10:00', end: '14:00', isAvailable: false }
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time validation state
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Ref for name input to have direct control
  const nameInputRef = useRef(null);

  const specialties = [
    'Engine Repair', 'Brake Service', 'Oil Change', 'Tire Service', 
    'AC Repair', 'Transmission', 'Electrical', 'Diagnostics'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSpecialtyChange = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: field === 'isAvailable' ? value === 'true' || value === true : value
        }
      }
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString()
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please enter it manually.');
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

      case 'licenseNumber':
        if (!value.trim()) {
          error = 'License number is required';
        } else if (!validateLicenseNumber(value)) {
          error = 'License number must be between 5 and 20 characters';
        }
        break;

      case 'experience':
        const expNum = parseInt(value);
        if (!value) {
          error = 'Years of experience is required';
        } else if (isNaN(expNum) || expNum < 0 || expNum > 50) {
          error = 'Please enter a valid number of years (0-50)';
        }
        break;

      case 'hourlyRate':
        if (!value) {
          error = 'Hourly rate is required';
        } else if (!validateHourlyRate(value)) {
          error = 'Please enter a valid hourly rate ($0.01 - $500)';
        }
        break;

      case 'location.latitude':
      case 'location.longitude':
        const lat = fieldName === 'location.latitude' ? value : formData.location.latitude;
        const lng = fieldName === 'location.longitude' ? value : formData.location.longitude;
        if ((lat && !lng) || (!lat && lng)) {
          error = 'Both latitude and longitude must be provided together';
        } else if (lat && lng && !validateCoordinates(lat, lng)) {
          error = 'Please enter valid coordinates';
        }
        break;

      case 'specialties':
        if (!value || value.length === 0) {
          error = 'Please select at least one specialty';
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

    // For name field, sanitize the value immediately
    if (name === 'name') {
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
      if (sanitized !== value) {
        // Force update the form data and input field
        setFormData(prev => ({
          ...prev,
          name: sanitized
        }));
        // Use setTimeout to ensure the input updates after React's state update
        setTimeout(() => {
          if (e.target) {
            e.target.value = sanitized;
          }
        }, 0);
      }

      // Validate on change if field has been touched
      if (touched[name]) {
        validateField(name, sanitized);
      }
      return;
    }

    handleInputChange(e);

    // Validate on change if field has been touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const validateForm = () => {
    const requiredFields = ['licenseNumber', 'experience', 'hourlyRate', 'specialties'];
    let isValid = true;

    for (const field of requiredFields) {
      let value = formData[field];

      if (!validateField(field, value)) {
        isValid = false;
        setTouched(prev => ({ ...prev, [field]: true }));
      }
    }

    // Validate coordinates if provided
    if (formData.location.latitude || formData.location.longitude) {
      if (!validateField('location.latitude', formData.location.latitude) ||
          !validateField('location.longitude', formData.location.longitude)) {
        isValid = false;
        setTouched(prev => ({
          ...prev,
          'location.latitude': true,
          'location.longitude': true
        }));
      }
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        userId: user?._id || user?.id,
        licenseNumber: formData.licenseNumber.trim(),
        specialties: formData.specialties,
        experience: Number(formData.experience),
        hourlyRate: Number(formData.hourlyRate),
        location: {
          ...formData.location,
          latitude: formData.location.latitude ? parseFloat(formData.location.latitude) : undefined,
          longitude: formData.location.longitude ? parseFloat(formData.location.longitude) : undefined
        },
        availability: formData.availability
      };

      const response = await api.post('/api/mechanics/register', payload, { withCredentials: true });

      if (response.data?.success || response.status === 201) {
        const updatedUser = { ...(user || {}), role: 'mechanic' };
        login(updatedUser);
        navigate('/mechanic/dashboard');
      } else {
        setError(response.data?.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const message = err.response?.data?.error || err.response?.data?.message || 'Network error. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FaWrench className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold">Join Auto Elite as a Mechanic</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Register to start earning by providing professional automotive services
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaCertificate className="h-6 w-6 text-primary mr-2" />
              Professional Information
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  pattern="[A-Za-z\s]+"
                  onKeyUp={(e) => {
                    // Sanitize after key release
                    let value = e.target.value;
                    const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
                    if (sanitized !== value) {
                      e.target.value = sanitized;
                      setFormData(prev => ({
                        ...prev,
                        name: sanitized
                      }));
                    }
                  }}
                  onInput={(e) => {
                    // Real-time sanitization
                    let value = e.target.value;
                    const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
                    if (sanitized !== value) {
                      e.target.value = sanitized;
                      setFormData(prev => ({
                        ...prev,
                        name: sanitized
                      }));
                    }
                  }}
                  onChange={(e) => {
                    // Final sanitization on change
                    const value = e.target.value;
                    const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
                    setFormData(prev => ({
                      ...prev,
                      name: sanitized
                    }));

                    if (touched.name) {
                      validateField('name', sanitized);
                    }
                  }}
                  onBlur={(e) => {
                    setTouched(prev => ({ ...prev, name: true }));
                    validateField('name', e.target.value);
                  }}
                  onPaste={(e) => {
                    // Handle paste with delay to allow browser processing
                    setTimeout(() => {
                      const input = e.target;
                      const value = input.value;
                      const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
                      input.value = sanitized;
                      setFormData(prev => ({
                        ...prev,
                        name: sanitized
                      }));
                    }, 10);
                  }}
                  required
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched.name && fieldErrors.name ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="Enter your full name (letters only)"
                />
                {touched.name && fieldErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">License Number *</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('licenseNumber', e.target.value)}
                  required
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched.licenseNumber && fieldErrors.licenseNumber ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="Enter your mechanic license number"
                />
                {touched.licenseNumber && fieldErrors.licenseNumber && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.licenseNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Years of Experience *</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('experience', e.target.value)}
                  required
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched.experience && fieldErrors.experience ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="Years of experience"
                />
                {touched.experience && fieldErrors.experience && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.experience}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hourly Rate ($) *</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('hourlyRate', e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched.hourlyRate && fieldErrors.hourlyRate ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="Your hourly rate"
                />
                {touched.hourlyRate && fieldErrors.hourlyRate && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.hourlyRate}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Specialties *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {specialties.map(specialty => (
                  <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={() => {
                        handleSpecialtyChange(specialty);
                        // Validate specialties after change
                        if (touched.specialties) {
                          validateField('specialties', formData.specialties.length === 0 ? [] : [...formData.specialties, specialty]);
                        }
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
              {touched.specialties && fieldErrors.specialties && (
                <p className="text-red-500 text-sm mt-2">{fieldErrors.specialties}</p>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaMapMarkerAlt className="h-6 w-6 text-primary mr-2" />
              Location Information
            </h2>
            
            <div className="mb-4">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Use Current Location
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Latitude</label>
                <input
                  type="number"
                  name="location.latitude"
                  value={formData.location.latitude}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('location.latitude', e.target.value)}
                  step="any"
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched['location.latitude'] && fieldErrors['location.latitude'] ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="Latitude"
                />
                {touched['location.latitude'] && fieldErrors['location.latitude'] && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors['location.latitude']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Longitude</label>
                <input
                  type="number"
                  name="location.longitude"
                  value={formData.location.longitude}
                  onChange={handleFieldChange}
                  onBlur={(e) => handleFieldBlur('location.longitude', e.target.value)}
                  step="any"
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    touched['location.longitude'] && fieldErrors['location.longitude'] ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="Longitude"
                />
                {touched['location.longitude'] && fieldErrors['location.longitude'] && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors['location.longitude']}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Street Address</label>
                <input
                  type="text"
                  name="location.address.street"
                  value={formData.location.address.street}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Street address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  name="location.address.city"
                  value={formData.location.address.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="City"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <input
                  type="text"
                  name="location.address.state"
                  value={formData.location.address.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="State"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code</label>
                <input
                  type="text"
                  name="location.address.zipCode"
                  value={formData.location.address.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ZIP code"
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaClock className="h-6 w-6 text-primary mr-2" />
              Availability Schedule
            </h2>
            
            <div className="space-y-4">
              {Object.keys(formData.availability).map(day => (
                <div key={day} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                  <div className="w-24">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.availability[day].isAvailable}
                        onChange={(e) => handleAvailabilityChange(day, 'isAvailable', e.target.checked)}
                        className="rounded border-border"
                      />
                      <span className="capitalize font-medium">{day}</span>
                    </label>
                  </div>
                  
                  {formData.availability[day].isAvailable && (
                    <>
                      <div>
                        <label className="block text-sm text-muted-foreground">Start Time</label>
                        <input
                          type="time"
                          value={formData.availability[day].start}
                          onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                          className="px-3 py-1 border border-border rounded bg-background text-foreground"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-muted-foreground">End Time</label>
                        <input
                          type="time"
                          value={formData.availability[day].end}
                          onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                          className="px-3 py-1 border border-border rounded bg-background text-foreground"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
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
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register as Mechanic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MechanicRegistration;
