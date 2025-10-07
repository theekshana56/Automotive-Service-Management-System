import React, { useState } from 'react';
import { useAuth } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import { FaWrench, FaMapMarkerAlt, FaClock, FaDollarSign, FaCertificate, FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';
import api from '../api/client';
import Swal from 'sweetalert2';

const MechanicSignup = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Account Information (for non-logged-in users)
    password: '',
    confirmPassword: '',

    // Personal Information
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',

    // Professional Information
    licenseNumber: '',
    specialties: [],
    experience: '',
    hourlyRate: '',
    certifications: [],

    // Exact Location Information
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
      serviceRadius: '25', // miles
    },

    // Business Information
    businessName: '',
    businessAddress: '',
    taxId: '',
    insuranceProvider: '',

    // Availability
    availability: {
      monday: { start: '09:00', end: '17:00', isAvailable: true },
      tuesday: { start: '09:00', end: '17:00', isAvailable: true },
      wednesday: { start: '09:00', end: '17:00', isAvailable: true },
      thursday: { start: '09:00', end: '17:00', isAvailable: true },
      friday: { start: '09:00', end: '17:00', isAvailable: true },
      saturday: { start: '09:00', end: '15:00', isAvailable: true },
      sunday: { start: '10:00', end: '14:00', isAvailable: false }
    },

    // Additional Services
    emergencyService: false,
    mobileService: true,
    warrantyOffered: true,
    paymentMethods: ['cash', 'card', 'digital'],

    // References
    references: ['', '', ''],
    portfolioUrl: '',
    websiteUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const specialties = [
    'Engine Repair', 'Brake Service', 'Oil Change', 'Tire Service',
    'AC Repair', 'Transmission', 'Electrical', 'Diagnostics',
    'Suspension', 'Exhaust', 'Cooling System', 'Fuel System'
  ];

  const certifications = [
    'ASE Certified', 'Master Technician', 'Safety Certified',
    'Environmental Certified', 'Manufacturer Certified', 'State Licensed'
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

  const handleSpecialtyChange = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleCertificationChange = (cert) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: field === 'isAvailable' ? value === 'true' : value
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

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!user) {
          if (!formData.password || !formData.confirmPassword) {
            setError('Password and confirmation are required.');
            return false;
          }
          if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return false;
          }
          if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return false;
          }
        }
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      case 2:
        return formData.licenseNumber && formData.specialties.length > 0;
      case 3:
        return formData.location.latitude && formData.location.longitude &&
               formData.location.address.city && formData.location.address.state;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      setError('Please fill in all required fields for this step.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Declare mechanicData outside try block so it's accessible in catch block
    let mechanicData = null;

    try {
      let userId = user?._id || user?.id;

      // If user is not logged in, create account first (as user)
      if (!user) {
        const userData = {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password
        };

        const userResponse = await api.post('/api/auth/register', userData, { withCredentials: true });
        if (userResponse.status === 201) {
          // Login the newly created account (will have default role 'user')
          const loginResponse = await api.post('/api/auth/login', {
            email: formData.email,
            password: formData.password
          }, { withCredentials: true });

          if (loginResponse.status === 200) {
            console.log('✅ Initial login successful:', loginResponse.data.user);
            login(loginResponse.data.user); // user role remains 'user' for now
            userId = loginResponse.data.user.id; // Use 'id' instead of '_id' for consistency
            console.log('✅ User ID set for mechanic registration:', userId);
          } else {
            throw new Error('Failed to login after registration');
          }
        } else {
          throw new Error(userResponse.data?.message || 'Failed to create account');
        }
      } else {
        // If user is already logged in, use their existing ID
        console.log('✅ User already logged in:', user);
        userId = user.id;
        console.log('✅ Using existing user ID for mechanic registration:', userId);
      }

      // Now register as mechanic
      mechanicData = {
        userId,
        licenseNumber: formData.licenseNumber.trim(),
        specialties: formData.specialties,
        experience: Number(formData.experience),
        hourlyRate: Number(formData.hourlyRate),
        location: {
          ...formData.location,
          latitude: parseFloat(formData.location.latitude),
          longitude: parseFloat(formData.location.longitude)
        },
        availability: formData.availability,
        emergencyService: !!formData.emergencyService,
        mobileService: !!formData.mobileService,
        warrantyOffered: !!formData.warrantyOffered
      };

      console.log('🔧 Sending mechanic registration data:', mechanicData);
      
      // Validate required fields before sending
      if (!mechanicData.userId) {
        throw new Error('User ID is required');
      }
      if (!mechanicData.licenseNumber) {
        throw new Error('License number is required');
      }
      if (!mechanicData.location || isNaN(parseFloat(mechanicData.location.latitude)) || isNaN(parseFloat(mechanicData.location.longitude))) {
        throw new Error('Valid numeric latitude and longitude are required');
      }
      if (!Array.isArray(mechanicData.specialties) || mechanicData.specialties.length === 0) {
        throw new Error('At least one specialty is required');
      }
      if (isNaN(Number(mechanicData.experience))) {
        throw new Error('Experience must be a valid number');
      }
      if (isNaN(Number(mechanicData.hourlyRate))) {
        throw new Error('Hourly rate must be a valid number');
      }
      
      const response = await api.post('/api/mechanics/register', mechanicData, { withCredentials: true });

      if (response.status === 201 || response.data?.success) {
        // Logout user after successful registration
        try {
          console.log('🔄 Logging out user after successful mechanic registration...');
          logout(); // Logout the user
          console.log('✅ User logged out successfully');
        } catch (logoutError) {
          console.warn('❌ Failed to logout user:', logoutError);
        }

        await Swal.fire({
          title: 'Registration Complete!',
          text: 'Your mechanic account has been created successfully. Please login to access your mechanic dashboard.',
          icon: 'success',
          confirmButtonText: 'Go to Login',
          confirmButtonColor: '#10b981'
        });
        navigate('/login');
      } else {
        setError(response.data?.error || 'Mechanic registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Request data that failed:', mechanicData);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please try logging in first.');
      } else if (error.response?.status === 400) {
        // Show detailed 400 error information
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Bad Request - Invalid data provided';
        setError(`400 Error: ${errorMsg}. Check console for details.`);
      } else if (error.response?.status === 409) {
        setError('A mechanic account with this information already exists. Please check your details or contact support.');
      } else if (error.response?.status === 500) {
        setError('Server error occurred. Please try again later or contact support.');
      } else {
        setError(error.response?.data?.message || error.response?.data?.error || error.message || 'Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map(step => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 3 && (
            <div className={`w-12 h-1 mx-2 ${
              step < currentStep ? 'bg-primary' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FaWrench className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold">Become a Certified Mechanic</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Join Auto Elite's professional network and start earning by providing quality automotive services
          </p>
        </div>

        {renderStepIndicator()}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <FaUser className="h-6 w-6 text-primary mr-2" />
                Personal Information
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Password fields for non-logged-in users */}
                {!user && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Create a password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Professional Information */}
          {currentStep === 2 && (
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <FaCertificate className="h-6 w-6 text-primary mr-2" />
                Professional Information
              </h2>

              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">License Number *</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your mechanic license number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Years of Experience *</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    required
                    min="0"
                    max="50"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Years of experience"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hourly Rate ($) *</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your hourly rate"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Service Radius (miles)</label>
                  <input
                    type="number"
                    name="location.serviceRadius"
                    value={formData.location.serviceRadius}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Specialties *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {specialties.map(specialty => (
                    <label key={specialty} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={() => handleSpecialtyChange(specialty)}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Certifications</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {certifications.map(cert => (
                    <label key={cert} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={formData.certifications.includes(cert)}
                        onChange={() => handleCertificationChange(cert)}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{cert}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location Information */}
          {currentStep === 3 && (
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <FaMapMarkerAlt className="h-6 w-6 text-primary mr-2" />
                Service Location
              </h2>

              <div className="mb-6">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <FaMapMarkerAlt className="h-4 w-4" />
                  Use Current Location
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
                    onChange={handleInputChange}
                    step="any"
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="40.7128"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Longitude *</label>
                  <input
                    type="number"
                    name="location.longitude"
                    value={formData.location.longitude}
                    onChange={handleInputChange}
                    step="any"
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="-74.0060"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Street Address *</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.location.address.street}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.location.address.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">State *</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.location.address.state}
                    onChange={handleInputChange}
                    required
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
              {/* Submit button at the end of step 3 */}
              <div className="flex justify-end mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
              {error}
            </div>
          )}
        </form>
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-2 border border-border rounded-lg hover:bg-white/5 transition-colors"
            >
              Previous
            </button>
          )}
          {currentStep < 3 && (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors ml-auto"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MechanicSignup;
