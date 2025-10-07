import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { useNavigate, useParams } from "react-router-dom";
import FormField from "../../components/inventory/FormField";
import FormSection from "../../components/inventory/FormSection";
import ActionButtons from "../../components/inventory/ActionButtons";
import LoadingSpinner from "../../components/inventory/LoadingSpinner";
import ErrorAlert from "../../components/inventory/ErrorAlert";
import SuccessToast from "../../components/inventory/SuccessToast";

const empty = { 
  name: "", 
  email: "", 
  phone: "", 
  address: "", 
  contactPerson: "", 
  notes: "",
  companyName: "",
  displayName: "",
  businessRegistrationNo: "",
  website: "",
  primaryContact: {
    fullName: "",
    position: "",
    email: "",
    phone: "",
    mobile: ""
  },
  addresses: [
    {
      type: "HEAD_OFFICE",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: ""
    }
  ],
  paymentTerms: "",
  currency: "",
  bankDetails: {
    bankName: "",
    accountName: "",
    accountNumber: "",
    branch: ""
  },
  leadTimeDays: 0,
  isActive: true
};

const validationRules = {
  // Company Information
  companyName: { 
    required: true, 
    minLength: 2, 
    maxLength: 120, 
    pattern: /^[a-zA-Z0-9\s\-_.&()]+$/, 
    message: "Company name must be 2-120 characters, alphanumeric with spaces, hyphens, underscores, dots, ampersands, or parentheses" 
  },
  displayName: { 
    minLength: 2, 
    maxLength: 100, 
    pattern: /^[a-zA-Z0-9\s\-_.&()]+$/, 
    message: "Display name must be 2-100 characters, alphanumeric with spaces, hyphens, underscores, dots, ampersands, or parentheses" 
  },
  businessRegistrationNo: { 
    required: true, 
    minLength: 2, 
    maxLength: 60, 
    pattern: /^[A-Z0-9\-_]+$/, 
    message: "Business registration number must be 2-60 characters, uppercase letters, numbers, hyphens, or underscores" 
  },
  website: { 
    pattern: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/, 
    message: "Please enter a valid website URL (e.g., https://www.example.com)" 
  },
  
  // Contact Information
  "primaryContact.fullName": { 
    required: true, 
    minLength: 2, 
    maxLength: 100, 
    pattern: /^[a-zA-Z\s\-'.]+$/, 
    message: "Full name must be 2-100 characters, letters, spaces, hyphens, apostrophes, or dots" 
  },
  "primaryContact.position": { 
    maxLength: 100, 
    pattern: /^[a-zA-Z0-9\s\-_.&()]+$/, 
    message: "Position must contain only letters, numbers, spaces, hyphens, underscores, dots, ampersands, or parentheses" 
  },
  "primaryContact.email": { 
    required: true, 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
    message: "Please enter a valid email address" 
  },
  "primaryContact.phone": { 
    required: true, 
    pattern: /^[+]?[1-9][\d\s\-()]{7,15}$/, 
    message: "Please enter a valid phone number (7-15 digits with optional country code)" 
  },
  "primaryContact.mobile": { 
    pattern: /^[+]?[1-9][\d\s\-()]{7,15}$/, 
    message: "Please enter a valid mobile number (7-15 digits with optional country code)" 
  },
  
  // Address Information
  "addresses.*.line1": { 
    required: true, 
    minLength: 5, 
    maxLength: 200, 
    message: "Address line 1 must be 5-200 characters" 
  },
  "addresses.*.line2": { 
    maxLength: 200, 
    message: "Address line 2 must be less than 200 characters" 
  },
  "addresses.*.city": { 
    required: true, 
    minLength: 2, 
    maxLength: 100, 
    pattern: /^[a-zA-Z\s\-'.]+$/, 
    message: "City must be 2-100 characters, letters, spaces, hyphens, apostrophes, or dots" 
  },
  "addresses.*.state": { 
    maxLength: 100, 
    pattern: /^[a-zA-Z\s\-'.]+$/, 
    message: "State must contain only letters, spaces, hyphens, apostrophes, or dots" 
  },
  "addresses.*.postalCode": { 
    pattern: /^[A-Z0-9\s\-]{3,20}$/, 
    message: "Postal code must be 3-20 characters, letters, numbers, spaces, or hyphens" 
  },
  "addresses.*.country": { 
    required: true, 
    minLength: 2, 
    maxLength: 100, 
    pattern: /^[a-zA-Z\s\-'.]+$/, 
    message: "Country must be 2-100 characters, letters, spaces, hyphens, apostrophes, or dots" 
  },
  
  // Business Terms
  paymentTerms: { 
    required: true, 
    message: "Payment terms is required" 
  },
  currency: { 
    required: true, 
    message: "Currency is required" 
  },
  leadTimeDays: { 
    required: true, 
    pattern: /^\d+$/, 
    min: 0, 
    max: 365, 
    message: "Lead time days must be a number between 0 and 365" 
  },
  
  // Bank Details
  "bankDetails.bankName": { 
    maxLength: 100, 
    pattern: /^[a-zA-Z0-9\s\-_.&()]+$/, 
    message: "Bank name must contain only letters, numbers, spaces, hyphens, underscores, dots, ampersands, or parentheses" 
  },
  "bankDetails.accountName": { 
    maxLength: 100, 
    pattern: /^[a-zA-Z0-9\s\-_.&()]+$/, 
    message: "Account name must contain only letters, numbers, spaces, hyphens, underscores, dots, ampersands, or parentheses" 
  },
  "bankDetails.accountNumber": { 
    pattern: /^[0-9]{8,20}$/, 
    message: "Account number must be 8-20 digits" 
  },
  "bankDetails.branch": { 
    maxLength: 100, 
    pattern: /^[a-zA-Z0-9\s\-_.&()]+$/, 
    message: "Branch must contain only letters, numbers, spaces, hyphens, underscores, dots, ampersands, or parentheses" 
  },
  
  // Additional
  notes: { 
    maxLength: 1000, 
    message: "Notes must be less than 1000 characters" 
  }
};

export default function SupplierFormPage() {
  const { id } = useParams();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [emailExists, setEmailExists] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
    const { data } = await api.get(`/api/suppliers/${id}`);
    const mapped = {
      name: data.companyName || data.displayName || "",
      email: data.primaryContact?.email || "",
      phone: data.primaryContact?.phone || "",
      contactPerson: data.primaryContact?.fullName || "",
      address: Array.isArray(data.addresses) && data.addresses[0]
        ? [
            data.addresses[0].line1,
            data.addresses[0].line2,
            data.addresses[0].city,
            data.addresses[0].country,
          ].filter(Boolean).join(", ")
        : "",
      notes: data.notes || "",
      companyName: data.companyName || "",
      displayName: data.displayName || "",
      businessRegistrationNo: data.businessRegistrationNo || "",
      website: data.website || "",
      primaryContact: {
        fullName: data.primaryContact?.fullName || "",
        position: data.primaryContact?.position || "",
        email: data.primaryContact?.email || "",
        phone: data.primaryContact?.phone || "",
        mobile: data.primaryContact?.mobile || "",
      },
      addresses: Array.isArray(data.addresses) && data.addresses.length > 0
        ? data.addresses
        : empty.addresses,
      paymentTerms: data.paymentTerms || "",
      currency: data.currency || "",
      bankDetails: {
        bankName: data.bankDetails?.bankName || "",
        accountName: data.bankDetails?.accountName || "",
        accountNumber: data.bankDetails?.accountNumber || "",
        branch: data.bankDetails?.branch || "",
      },
      leadTimeDays: typeof data.leadTimeDays === 'number' ? data.leadTimeDays : 0,
      isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
    };
    setForm(mapped);
    } catch (err) {
      console.error('Failed to load supplier:', err);
      setErrors({ submit: "Failed to load supplier data" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [id, load]);

  const addAddress = () => {
    setForm(prev => ({
      ...prev,
      addresses: [...(prev.addresses || []), { type: 'HEAD_OFFICE', line1: '', line2: '', city: '', state: '', postalCode: '', country: '' }]
    }));
  };

  const removeAddress = (index) => {
    setForm(prev => ({
      ...prev,
      addresses: (prev.addresses || []).filter((_, i) => i !== index)
    }));
  };

  const updateAddressField = (index, field, value) => {
    setForm(prev => {
      const next = { ...prev, addresses: [...(prev.addresses || [])] };
      next.addresses[index] = { ...(next.addresses[index] || {}), [field]: value };
      return next;
    });

    // Validate the address field
    const fieldKey = `addresses.${index}.${field}`;
    const error = validateField(fieldKey, value);
    if (error) {
      setErrors(prev => ({ ...prev, [fieldKey]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const validateField = (name, value) => {
    // Handle nested field validation (e.g., addresses.0.line1, bankDetails.bankName)
    let rules = validationRules[name];
    
    // Check for wildcard patterns for nested fields
    if (!rules) {
      if (name.startsWith('addresses.') && name.includes('.line1')) {
        rules = validationRules['addresses.*.line1'];
      } else if (name.startsWith('addresses.') && name.includes('.line2')) {
        rules = validationRules['addresses.*.line2'];
      } else if (name.startsWith('addresses.') && name.includes('.city')) {
        rules = validationRules['addresses.*.city'];
      } else if (name.startsWith('addresses.') && name.includes('.state')) {
        rules = validationRules['addresses.*.state'];
      } else if (name.startsWith('addresses.') && name.includes('.postalCode')) {
        rules = validationRules['addresses.*.postalCode'];
      } else if (name.startsWith('addresses.') && name.includes('.country')) {
        rules = validationRules['addresses.*.country'];
      } else if (name.startsWith('bankDetails.')) {
        const fieldName = name.split('.').pop();
        rules = validationRules[`bankDetails.${fieldName}`];
      }
    }
    
    if (!rules) return "";

    const trimmedValue = value ? value.toString().trim() : "";
    const fieldDisplayName = name.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    // Required field validation
    if (rules.required && (!value || trimmedValue === "")) {
      return rules.message || `${fieldDisplayName} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || trimmedValue === "") return "";

    // Min length validation
    if (rules.minLength && trimmedValue.length < rules.minLength) {
      return rules.message || `${fieldDisplayName} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && trimmedValue.length > rules.maxLength) {
      return rules.message || `${fieldDisplayName} must be less than ${rules.maxLength} characters`;
    }

    // Min value validation (for numbers)
    if (rules.min !== undefined && Number(trimmedValue) < rules.min) {
      return rules.message || `${fieldDisplayName} must be at least ${rules.min}`;
    }

    // Max value validation (for numbers)
    if (rules.max !== undefined && Number(trimmedValue) > rules.max) {
      return rules.message || `${fieldDisplayName} must be at most ${rules.max}`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(trimmedValue)) {
      return rules.message || `${fieldDisplayName} format is invalid`;
    }

    return "";
  };

  const checkEmailExists = async (email) => {
    if (!email || id) return;
    try {
      const { data } = await api.get(`/api/suppliers?email=${email}`);
      const exists = data.items && data.items.length > 0;
      setEmailExists(exists);
      
      if (exists) {
        setErrors(prev => ({ 
          ...prev, 
          'primaryContact.email': 'This email address is already registered with another supplier' 
        }));
      }
    } catch (err) {
      console.error('Failed to check email:', err);
    }
  };

  const setFormPathValue = (path, value) => {
    const segments = path.split('.');
    setForm(prev => {
      const clone = { ...prev };
      let cursor = clone;
      for (let i = 0; i < segments.length - 1; i += 1) {
        const key = segments[i];
        cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...(cursor[key] || {}) };
        cursor = cursor[key];
      }
      cursor[segments[segments.length - 1]] = value;
      return clone;
    });
  };

  const onChange = (e) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? e.target.checked : e.target.value;
    
    // Clear previous errors for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
    setEmailExists(false);
    
    // Update form state
    if (name.includes('.')) {
      setFormPathValue(name, value);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }

    // Validate the field
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    // Special handling for email validation with debouncing
    if (name === "primaryContact.email") {
      const timeoutId = setTimeout(() => checkEmailExists(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Helper function to add error
    const addError = (fieldName, error) => {
      newErrors[fieldName] = error;
      isValid = false;
    };

    // Validate company information
    const companyFields = ['companyName', 'displayName', 'businessRegistrationNo', 'website'];
    companyFields.forEach(fieldName => {
      const value = form[fieldName];
      const error = validateField(fieldName, value);
      if (error) addError(fieldName, error);
    });

    // Validate primary contact information
    const pc = form.primaryContact || {};
    const contactFields = [
      'primaryContact.fullName',
      'primaryContact.position', 
      'primaryContact.email',
      'primaryContact.phone',
      'primaryContact.mobile'
    ];
    contactFields.forEach(fieldName => {
      const value = fieldName === 'primaryContact.fullName' ? pc.fullName :
                   fieldName === 'primaryContact.position' ? pc.position :
                   fieldName === 'primaryContact.email' ? pc.email :
                   fieldName === 'primaryContact.phone' ? pc.phone :
                   pc.mobile;
      const error = validateField(fieldName, value);
      if (error) addError(fieldName, error);
    });

    // Validate business terms
    const businessFields = ['paymentTerms', 'currency', 'leadTimeDays'];
    businessFields.forEach(fieldName => {
      const value = form[fieldName];
      const error = validateField(fieldName, value);
      if (error) addError(fieldName, error);
    });

    // Validate bank details (optional fields)
    const bankDetails = form.bankDetails || {};
    const bankFields = [
      'bankDetails.bankName',
      'bankDetails.accountName',
      'bankDetails.accountNumber',
      'bankDetails.branch'
    ];
    bankFields.forEach(fieldName => {
      const value = fieldName === 'bankDetails.bankName' ? bankDetails.bankName :
                   fieldName === 'bankDetails.accountName' ? bankDetails.accountName :
                   fieldName === 'bankDetails.accountNumber' ? bankDetails.accountNumber :
                   bankDetails.branch;
      const error = validateField(fieldName, value);
      if (error) addError(fieldName, error);
    });

    // Validate addresses
    if (Array.isArray(form.addresses)) {
      form.addresses.forEach((address, index) => {
        const addressFields = ['line1', 'line2', 'city', 'state', 'postalCode', 'country'];
        addressFields.forEach(fieldName => {
          const fieldKey = `addresses.${index}.${fieldName}`;
          const value = address[fieldName];
          const error = validateField(fieldKey, value);
          if (error) addError(fieldKey, error);
        });
      });
    }

    // Validate notes
    const notesError = validateField('notes', form.notes);
    if (notesError) addError('notes', notesError);

    // Check for email duplicates
    if (emailExists) {
      addError('primaryContact.email', 'This email address is already registered with another supplier');
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
      const payload = {
        companyName: form.companyName || form.name,
        displayName: form.displayName || form.name,
        businessRegistrationNo: form.businessRegistrationNo || "",
        website: form.website || "",
        primaryContact: {
          fullName: form.primaryContact?.fullName || form.contactPerson || "",
          position: form.primaryContact?.position || "",
          email: form.primaryContact?.email || form.email || "",
          phone: form.primaryContact?.phone || form.phone || "",
          mobile: form.primaryContact?.mobile || "",
        },
        addresses: (Array.isArray(form.addresses) && form.addresses.length > 0)
          ? form.addresses
          : [
              {
                type: "HEAD_OFFICE",
                line1: form.address || "",
                line2: "",
                city: "",
                state: "",
                postalCode: "",
                country: "",
              },
            ],
        paymentTerms: form.paymentTerms || "",
        currency: form.currency || "",
        bankDetails: {
          bankName: form.bankDetails?.bankName || "",
          accountName: form.bankDetails?.accountName || "",
          accountNumber: form.bankDetails?.accountNumber || "",
          branch: form.bankDetails?.branch || "",
        },
        leadTimeDays: Number(form.leadTimeDays) || 0,
        isActive: typeof form.isActive === 'boolean' ? form.isActive : true,
        notes: form.notes || "",
      };

      if (id) {
        await api.put(`/api/suppliers/${id}`, payload);
        setToast("Supplier updated successfully!");
      } else {
        await api.post("/api/suppliers", payload);
        setToast("Supplier created successfully!");
      }
      
      setTimeout(() => navigate("/suppliers"), 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to save supplier";
      setErrors({ submit: errorMessage });
      
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

  if (loading && id) {
    return <LoadingSpinner message="Loading supplier data..." />;
  }

  return (
    <div className="bg-app min-h-screen">
      <div className="app-container">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="section-title mb-2">
                {id ? "Edit Supplier" : "Add New Supplier"}
              </h1>
              <p className="text-slate-400">
                {id ? "Update supplier information and contact details" : "Create a new supplier profile"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/suppliers")}
              className="btn-secondary flex items-center gap-2"
            >
              <span>←</span>
              Back to Suppliers
            </button>
          </div>

          <ErrorAlert 
            message={errors.submit} 
            onDismiss={() => setErrors(prev => ({ ...prev, submit: null }))} 
          />

          {/* Validation Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <span>⚠️</span>
                <span className="font-medium">Please fix the following errors:</span>
              </div>
              <ul className="text-sm text-red-300 space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={submit} className="space-y-8">
            {/* Basic Company Information */}
            <FormSection title="Basic Company Information" icon="🏢">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Company Name"
                  name="companyName"
                  placeholder="e.g., Colombo Auto Parts Distributors"
                  value={form.companyName}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.companyName}
                  touched={touched.companyName}
                />

                <FormField
                  label="Display Name"
                  name="displayName"
                  placeholder="e.g., Colombo Auto"
                  value={form.displayName}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors.displayName}
                  touched={touched.displayName}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Business Registration No."
                  name="businessRegistrationNo"
                  placeholder="e.g., PV123456789"
                  value={form.businessRegistrationNo}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.businessRegistrationNo}
                  touched={touched.businessRegistrationNo}
                />

                <FormField
                  label="Website"
                  name="website"
                  type="url"
                  placeholder="e.g., https://www.colomboauto.lk"
                  value={form.website}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors.website}
                  touched={touched.website}
                  helpText="Enter the complete website URL including http:// or https://"
                />
              </div>
            </FormSection>

            {/* Primary Contact Information */}
            <FormSection title="Primary Contact Information" icon="📞">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Full Name"
                  name="primaryContact.fullName"
                  placeholder="e.g., Jane Perera"
                  value={form.primaryContact?.fullName}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors['primaryContact.fullName']}
                  touched={touched['primaryContact.fullName']}
                />

                <FormField
                  label="Position"
                  name="primaryContact.position"
                  placeholder="e.g., Procurement Manager"
                  value={form.primaryContact?.position}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['primaryContact.position']}
                  touched={touched['primaryContact.position']}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Email"
                  name="primaryContact.email"
                  type="email"
                  placeholder="e.g., jane@colomboauto.lk"
                  value={form.primaryContact?.email}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors['primaryContact.email']}
                  touched={touched['primaryContact.email']}
                />

                <FormField
                  label="Phone"
                  name="primaryContact.phone"
                  type="tel"
                  placeholder="e.g., +94 77 123 4567"
                  value={form.primaryContact?.phone}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors['primaryContact.phone']}
                  touched={touched['primaryContact.phone']}
                  helpText="Include country code if applicable"
                />

                <FormField
                  label="Mobile (optional)"
                  name="primaryContact.mobile"
                  type="tel"
                  placeholder="e.g., +94 71 234 5678"
                  value={form.primaryContact?.mobile}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['primaryContact.mobile']}
                  touched={touched['primaryContact.mobile']}
                  helpText="Include country code if applicable"
                />
              </div>
            </FormSection>

            {/* Address Information */}
            <FormSection title="Address Information" icon="📍">
              {form.addresses?.map((address, index) => (
                <div key={index} className="space-y-4 p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-slate-300">
                      {address.type === 'HEAD_OFFICE' ? 'Head Office' : 'Address'} {index + 1}
                    </h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="btn-secondary btn-icon text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Address Line 1"
                      name={`addresses.${index}.line1`}
                      placeholder="Street address"
                      value={address.line1}
                      onChange={(e) => updateAddressField(index, 'line1', e.target.value)}
                      required={index === 0}
                      error={errors[`addresses.${index}.line1`]}
                      touched={touched[`addresses.${index}.line1`]}
                    />

                    <FormField
                      label="Address Line 2"
                      name={`addresses.${index}.line2`}
                      placeholder="Apartment, suite, etc."
                      value={address.line2}
                      onChange={(e) => updateAddressField(index, 'line2', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      label="City"
                      name={`addresses.${index}.city`}
                      placeholder="City"
                      value={address.city}
                      onChange={(e) => updateAddressField(index, 'city', e.target.value)}
                      required={index === 0}
                      error={errors[`addresses.${index}.city`]}
                      touched={touched[`addresses.${index}.city`]}
                    />

                    <FormField
                      label="State"
                      name={`addresses.${index}.state`}
                      placeholder="State/Province"
                      value={address.state}
                      onChange={(e) => updateAddressField(index, 'state', e.target.value)}
                    />

                    <FormField
                      label="Postal Code"
                      name={`addresses.${index}.postalCode`}
                      placeholder="Postal code"
                      value={address.postalCode}
                      onChange={(e) => updateAddressField(index, 'postalCode', e.target.value)}
                    />

                    <FormField
                      label="Country"
                      name={`addresses.${index}.country`}
                      placeholder="Country"
                      value={address.country}
                      onChange={(e) => updateAddressField(index, 'country', e.target.value)}
                      required={index === 0}
                      error={errors[`addresses.${index}.country`]}
                      touched={touched[`addresses.${index}.country`]}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addAddress}
                className="btn-ghost flex items-center gap-2"
              >
                <span>+</span>
                Add Another Address
              </button>
            </FormSection>

            {/* Business Terms */}
            <FormSection title="Business Terms" icon="💼">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Payment Terms"
                  name="paymentTerms"
                  value={form.paymentTerms}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.paymentTerms}
                  touched={touched.paymentTerms}
                >
                  <select
                    name="paymentTerms"
                    value={form.paymentTerms}
                    onChange={onChange}
                    onBlur={onBlur}
                    required
                    className="select"
                  >
                    <option value="">Select payment terms</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Net 90">Net 90</option>
                    <option value="COD">Cash on Delivery</option>
                    <option value="Advance">Advance Payment</option>
                  </select>
                </FormField>

                <FormField
                  label="Currency"
                  name="currency"
                  value={form.currency}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.currency}
                  touched={touched.currency}
                >
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={onChange}
                    onBlur={onBlur}
                    required
                    className="select"
                  >
                    <option value="">Select currency</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </FormField>

                <FormField
                  label="Lead Time (Days)"
                  name="leadTimeDays"
                  type="number"
                  min="0"
                  placeholder="e.g., 7"
                  value={form.leadTimeDays}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.leadTimeDays}
                  touched={touched.leadTimeDays}
                  helpText="Average delivery time in days"
                />
              </div>
            </FormSection>

            {/* Bank Details */}
            <FormSection title="Bank Details (Optional)" icon="🏦">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Bank Name"
                  name="bankDetails.bankName"
                  placeholder="e.g., Commercial Bank of Ceylon"
                  value={form.bankDetails?.bankName}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['bankDetails.bankName']}
                  touched={touched['bankDetails.bankName']}
                />

                <FormField
                  label="Branch"
                  name="bankDetails.branch"
                  placeholder="e.g., Colombo Main Branch"
                  value={form.bankDetails?.branch}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['bankDetails.branch']}
                  touched={touched['bankDetails.branch']}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Account Name"
                  name="bankDetails.accountName"
                  placeholder="e.g., Colombo Auto Parts Distributors"
                  value={form.bankDetails?.accountName}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['bankDetails.accountName']}
                  touched={touched['bankDetails.accountName']}
                />

                <FormField
                  label="Account Number"
                  name="bankDetails.accountNumber"
                  type="text"
                  placeholder="e.g., 1234567890"
                  value={form.bankDetails?.accountNumber}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['bankDetails.accountNumber']}
                  touched={touched['bankDetails.accountNumber']}
                  helpText="8-20 digits only"
                />
              </div>
            </FormSection>

            {/* Additional Notes */}
            <FormSection title="Additional Notes" icon="📝">
              <FormField
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={onChange}
                onBlur={onBlur}
                error={errors.notes}
                touched={touched.notes}
                helpText="Any additional information about this supplier"
              >
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Enter any additional notes about this supplier..."
                  rows={4}
                  className="textarea"
                />
              </FormField>
            </FormSection>

            <ActionButtons
              onSave={submit}
              onCancel={() => navigate("/suppliers")}
              loading={loading}
              saveText={id ? "Update Supplier" : "Create Supplier"}
            />
          </form>
        </div>
      </div>

      <SuccessToast 
        message={toast} 
        onClose={() => setToast("")} 
      />
    </div>
  );
}