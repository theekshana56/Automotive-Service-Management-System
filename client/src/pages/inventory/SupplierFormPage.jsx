import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { useNavigate, useParams } from "react-router-dom";

const empty = { 
  name: "", 
  email: "", 
  phone: "", 
  address: "", 
  contactPerson: "", 
  notes: "" 
};

// Validation rules
const validationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_.&]+$/,
    message: "Name must be 2-100 characters, alphanumeric with spaces, hyphens, underscores, dots, or ampersands"
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address"
  },
  phone: {
    pattern: /^[+]?[1-9][\d]{0,15}$/,
    message: "Please enter a valid phone number"
  },
  contactPerson: {
    maxLength: 100,
    pattern: /^[a-zA-Z\s-]+$/,
    message: "Contact person name must contain only letters, spaces, hyphens, or dots"
  },
  address: {
    maxLength: 200,
    message: "Address must be less than 200 characters"
  },
  notes: {
    maxLength: 500,
    message: "Notes must be less than 500 characters"
  }
};

export default function SupplierFormPage() {
  const { id } = useParams();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [emailExists, setEmailExists] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
    const { data } = await api.get(`/api/suppliers/${id}`);
    setForm(data);
    } catch (err) {
      console.error('Failed to load supplier:', err);
      setErrors({ submit: "Failed to load supplier data" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [id, load]);

  // Real-time validation
  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return "";

    // Required validation
    if (rules.required && (!value || value.toString().trim() === "")) {
      return `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
    }

    // Skip other validations if empty and not required
    if (!value || value.toString().trim() === "") return "";

    // Min length validation
    if (rules.minLength && value.toString().length < rules.minLength) {
      return `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && value.toString().length > rules.maxLength) {
      return `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} must be less than ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value.toString())) {
      return rules.message || `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} format is invalid`;
    }

    return "";
  };

  // Check if email already exists (for new suppliers)
  const checkEmailExists = async (email) => {
    if (!email || id) return; // Skip if editing or no email
    try {
      const { data } = await api.get(`/api/suppliers?email=${email}`);
      setEmailExists(data.items && data.items.length > 0);
    } catch (err) {
      console.error('Failed to check email:', err);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    
    // Clear previous errors
    setErrors((prev) => ({ ...prev, [name]: null }));
    setEmailExists(false);
    
    // Update form
    setForm((f) => ({ ...f, [name]: value }));

    // Real-time validation
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    // Check email existence
    if (name === "email") {
      const timeoutId = setTimeout(() => checkEmailExists(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Validate on blur
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const value = form[fieldName];
      const error = validateField(fieldName, value);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    // Check email existence for new suppliers
    if (!id && form.email && emailExists) {
      newErrors.email = "This email address is already registered";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrors({ submit: "Please fix the validation errors above" });
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      if (id) {
        await api.put(`/api/suppliers/${id}`, form);
      } else {
        await api.post("/api/suppliers", form);
      }
      navigate("/suppliers");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to save supplier";
      setErrors({ submit: errorMessage });
      
      // Handle specific server-side validation errors
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach(error => {
          serverErrors[error.field] = error.message;
        });
        setErrors(prev => ({ ...prev, ...serverErrors }));
      }
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName) => {
    const hasError = errors[fieldName];
    const isTouched = touched[fieldName];
    
    return {
      width: '100%',
      padding: '0.75rem',
      border: hasError ? '2px solid #dc2626' : isTouched ? '2px solid #3b82f6' : '1px solid #d1d5db',
      borderRadius: '0.375rem',
      fontSize: '1rem',
      transition: 'border-color 0.2s ease-in-out',
      backgroundColor: hasError ? '#fef2f2' : 'white',
      outline: 'none'
    };
  };

  const getFieldError = (fieldName) => {
    return errors[fieldName] && touched[fieldName] ? errors[fieldName] : null;
  };

  if (loading && id) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#f8fafc',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div style={{ color: '#6b7280' }}>Loading supplier data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      padding: '2rem',
      backgroundColor: '#f8fafc',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: '600',
            color: '#1e293b',
            margin: 0
          }}>{id ? "Edit Supplier" : "Add New Supplier"}</h1>
          <button
            type="button"
            onClick={() => navigate("/suppliers")}
            style={{
              background: 'transparent',
              border: '1px solid #d1d5db',
              color: '#6b7280',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back to Suppliers
          </button>
        </div>

        {errors.submit && (
          <div style={{
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            {errors.submit}
          </div>
        )}

        <form style={{ display: 'grid', gap: '1.5rem' }} onSubmit={submit}>
          {/* Basic Information Section */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🏢 Basic Information
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Supplier Name *
                </label>
                <input 
                  style={getInputStyle('name')}
                  name="name" 
                  placeholder="Enter supplier name (e.g., Auto Parts Co., Best Motors Ltd.)" 
                  value={form.name} 
                  onChange={onChange}
                  onBlur={onBlur}
                  required 
                />
                {getFieldError('name') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('name')}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Email Address *
                </label>
                <input 
                  style={getInputStyle('email')}
                  name="email" 
                  type="email" 
                  placeholder="Enter email address (e.g., contact@autoparts.com)" 
                  value={form.email} 
                  onChange={onChange}
                  onBlur={onBlur}
                  required 
                />
                {getFieldError('email') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('email')}
                  </div>
                )}
                {emailExists && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    This email address is already registered
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📞 Contact Information
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Phone Number
                </label>
                <input 
                  style={getInputStyle('phone')}
                  name="phone" 
                  placeholder="Enter phone number (e.g., +1-555-123-4567)" 
                  value={form.phone || ""} 
                  onChange={onChange}
                  onBlur={onBlur}
                />
                {getFieldError('phone') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('phone')}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Contact Person
                </label>
                <input 
                  style={getInputStyle('contactPerson')}
                  name="contactPerson" 
                  placeholder="Enter contact person name (e.g., John Smith)" 
                  value={form.contactPerson || ""} 
                  onChange={onChange}
                  onBlur={onBlur}
                />
                {getFieldError('contactPerson') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('contactPerson')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📍 Address Information
            </h2>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Address
              </label>
              <input 
                style={getInputStyle('address')}
                name="address" 
                placeholder="Enter full address (e.g., 123 Main St, City, State, ZIP)" 
                value={form.address || ""} 
                onChange={onChange}
                onBlur={onBlur}
              />
              {getFieldError('address') && (
                <div style={{ 
                  color: '#dc2626', 
                  fontSize: '0.875rem', 
                  marginTop: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span>⚠️</span>
                  {getFieldError('address')}
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📝 Additional Notes
            </h2>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Notes
              </label>
              <textarea 
                style={{
                  ...getInputStyle('notes'),
                  minHeight: '100px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                name="notes" 
                placeholder="Enter any additional notes about this supplier (optional)" 
                value={form.notes || ""} 
                onChange={onChange}
                onBlur={onBlur}
              />
              {getFieldError('notes') && (
                <div style={{ 
                  color: '#dc2626', 
                  fontSize: '0.875rem', 
                  marginTop: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span>⚠️</span>
                  {getFieldError('notes')}
                </div>
              )}
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginTop: '0.25rem',
                textAlign: 'right'
              }}>
                {form.notes.length}/500 characters
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginTop: '1rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button 
              disabled={loading} 
              style={{
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                opacity: loading ? 0.7 : 1,
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                transition: 'all 0.2s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '120px',
                justifyContent: 'center'
              }}
              type="submit"
              aria-label={loading ? "Saving..." : "Save supplier"}
            >
              {loading ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  {id ? "Update Supplier" : "Save Supplier"}
                </>
              )}
            </button>
            <button 
              style={{
                background: 'transparent',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              type="button" 
              onClick={() => navigate("/suppliers")}
              aria-label="Cancel"
            >
              <span>❌</span>
              Cancel
            </button>
        </div>
      </form>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          input:focus, textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          input[style*="border: 2px solid #dc2626"]:focus {
            border-color: #dc2626;
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}
