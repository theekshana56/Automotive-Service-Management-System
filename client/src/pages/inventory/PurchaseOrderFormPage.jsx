import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.jsx';
import api from '../../api/client';
import FormField from "../../components/inventory/FormField";
import FormSection from "../../components/inventory/FormSection";
import ActionButtons from "../../components/inventory/ActionButtons";
import LoadingSpinner from "../../components/inventory/LoadingSpinner";
import ErrorAlert from "../../components/inventory/ErrorAlert";
import SuccessToast from "../../components/inventory/SuccessToast";

const PurchaseOrderFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isInventoryManager = user?.role === 'inventory_manager' || user?.role === 'manager' || user?.role === 'admin';
  
  const [formData, setFormData] = useState({
    supplier: '',
    expectedDeliveryDate: '',
    notes: '',
    deliveryAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
    paymentTerms: 'Net 30',
    paymentMethod: 'credit',
    paymentDueDate: '',
    shippingInstructions: '',
    items: []
  });
  
  const [suppliers, setSuppliers] = useState([]);
  const [parts, setParts] = useState([]);
  const [newItem, setNewItem] = useState({ part: '', quantity: 1, unitPrice: 0 });
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);
  const [suppliersError, setSuppliersError] = useState(null);
  const [partsError, setPartsError] = useState(null);

  // Validation rules
  const validationRules = {
    // Basic Information
    supplier: { 
      required: true, 
      message: "Supplier is required" 
    },
    expectedDeliveryDate: { 
      required: true, 
      minDate: new Date().toISOString().split('T')[0],
      message: "Expected delivery date is required and must be in the future" 
    },
    
    // Payment Terms
    paymentTerms: { 
      required: true, 
      message: "Payment terms is required" 
    },
    paymentMethod: { 
      required: true, 
      message: "Payment method is required" 
    },
    paymentDueDate: { 
      minDate: new Date().toISOString().split('T')[0],
      message: "Payment due date must be in the future" 
    },
    
    // Delivery Address
    "deliveryAddress.street": { 
      required: true, 
      minLength: 5, 
      maxLength: 200, 
      message: "Street address is required (5-200 characters)" 
    },
    "deliveryAddress.city": { 
      required: true, 
      minLength: 2, 
      maxLength: 100, 
      pattern: /^[a-zA-Z\s\-'.]+$/, 
      message: "City is required (2-100 characters, letters only)" 
    },
    "deliveryAddress.state": { 
      maxLength: 100, 
      pattern: /^[a-zA-Z\s\-'.]+$/, 
      message: "State must contain only letters, spaces, hyphens, apostrophes, or dots" 
    },
    "deliveryAddress.zipCode": { 
      pattern: /^[A-Z0-9\s\-]{3,20}$/, 
      message: "ZIP code must be 3-20 characters, letters, numbers, spaces, or hyphens" 
    },
    "deliveryAddress.country": { 
      required: true, 
      minLength: 2, 
      maxLength: 100, 
      pattern: /^[a-zA-Z\s\-'.]+$/, 
      message: "Country is required (2-100 characters, letters only)" 
    },
    
    // Additional Information
    shippingInstructions: { 
      maxLength: 1000, 
      message: "Shipping instructions must be less than 1000 characters" 
    },
    notes: { 
      maxLength: 1000, 
      message: "Notes must be less than 1000 characters" 
    },
    
    // Order Items
    "items": {
      required: true,
      minItems: 1,
      message: "At least one item is required"
    },
    "newItem.part": {
      required: true,
      message: "Part selection is required"
    },
    "newItem.quantity": {
      required: true,
      min: 1,
      max: 10000,
      message: "Quantity must be between 1 and 10,000"
    },
    "newItem.unitPrice": {
      required: true,
      min: 0,
      max: 999999.99,
      message: "Unit price must be between $0 and $999,999.99"
    }
  };

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoadingSuppliers(true);
      setSuppliersError(null);
      console.log('🔍 Frontend: Fetching suppliers from /api/suppliers/public...');
      const response = await api.get('/api/suppliers/public');
      console.log('🔍 Frontend: Suppliers response:', response.data);
      
      const suppliersData = response.data.suppliers || response.data.items || [];
      console.log('🔍 Frontend: Processed suppliers:', suppliersData);
      setSuppliers(suppliersData);
      
      if (suppliersData.length === 0) {
        console.warn('⚠️ Frontend: No suppliers found in response');
        setSuppliersError('No suppliers found. Please add suppliers first.');
      }
    } catch (err) {
      console.error('❌ Frontend: Error fetching suppliers:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch suppliers';
      setSuppliersError(errorMessage);
      setError(`Suppliers error: ${errorMessage}`);
    } finally {
      setLoadingSuppliers(false);
    }
  }, []);

  const fetchParts = useCallback(async () => {
    try {
      setLoadingParts(true);
      setPartsError(null);
      const response = await api.get('/api/parts/public');
      setParts(response.data.parts || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch parts';
      setPartsError(errorMessage);
      setError(`Parts error: ${errorMessage}`);
    } finally {
      setLoadingParts(false);
    }
  }, []);

  // Validation functions
  const validateField = (name, value) => {
    const rules = validationRules[name];
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

    // Date validation
    if (rules.minDate && trimmedValue < rules.minDate) {
      return rules.message || `${fieldDisplayName} must be in the future`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(trimmedValue)) {
      return rules.message || `${fieldDisplayName} format is invalid`;
    }

    return "";
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Helper function to add error
    const addError = (fieldName, error) => {
      newErrors[fieldName] = error;
      isValid = false;
    };

    // Validate basic information
    const basicFields = ['supplier', 'expectedDeliveryDate'];
    basicFields.forEach(fieldName => {
      const value = formData[fieldName];
      const error = validateField(fieldName, value);
      if (error) addError(fieldName, error);
    });

    // Validate payment terms
    const paymentFields = ['paymentTerms', 'paymentMethod', 'paymentDueDate'];
    paymentFields.forEach(fieldName => {
      const value = formData[fieldName];
      const error = validateField(fieldName, value);
      if (error) addError(fieldName, error);
    });

    // Validate delivery address
    const addressFields = [
      'deliveryAddress.street',
      'deliveryAddress.city', 
      'deliveryAddress.state',
      'deliveryAddress.zipCode',
      'deliveryAddress.country'
    ];
    addressFields.forEach(fieldName => {
      const value = fieldName === 'deliveryAddress.street' ? formData.deliveryAddress.street :
                   fieldName === 'deliveryAddress.city' ? formData.deliveryAddress.city :
                   fieldName === 'deliveryAddress.state' ? formData.deliveryAddress.state :
                   fieldName === 'deliveryAddress.zipCode' ? formData.deliveryAddress.zipCode :
                   formData.deliveryAddress.country;
      const error = validateField(fieldName, value);
      if (error) addError(fieldName, error);
    });

    // Validate additional information
    const additionalFields = ['shippingInstructions', 'notes'];
    additionalFields.forEach(fieldName => {
      const value = formData[fieldName];
      const error = validateField(fieldName, value);
      if (error) addError(fieldName, error);
    });

    // Validate items
    if (!formData.items || formData.items.length === 0) {
      addError('items', 'At least one item is required');
    } else {
      // Check for duplicate parts
      const partIds = formData.items.map(item => item.part);
      const uniquePartIds = [...new Set(partIds)];
      if (partIds.length !== uniquePartIds.length) {
        addError('items', 'Duplicate parts are not allowed');
      }

      // Validate each item
      formData.items.forEach((item, index) => {
        if (!item.part) {
          addError(`items.${index}.part`, 'Part selection is required');
        }
        if (!item.quantity || item.quantity < 1) {
          addError(`items.${index}.quantity`, 'Quantity must be at least 1');
        }
        if (item.unitPrice < 0) {
          addError(`items.${index}.unitPrice`, 'Unit price cannot be negative');
        }
      });
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleFieldChange = (fieldName, value) => {
    // Clear previous errors for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });

    // Update form data
    if (fieldName.includes('.')) {
      const [parent, child] = fieldName.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    }

    // Validate the field
    const error = validateField(fieldName, value);
    if (error) {
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  const handleFieldBlur = (fieldName, value) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, value);
    if (error) {
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  const fetchPurchaseOrder = useCallback(async () => {
    try {
      if (!id || id === 'new') return;
      setLoading(true);
      const response = await api.get(`/api/purchase-orders/${id}`);
      const po = response.data?.purchaseOrder || response.data;
      if (po) {
        setFormData({
          supplier: po.supplier?._id || '',
          expectedDeliveryDate: po.expectedDeliveryDate?.slice(0,10) || '',
          notes: po.notes || '',
          deliveryAddress: po.deliveryAddress || { street: '', city: '', state: '', zipCode: '', country: '' },
          paymentTerms: po.paymentTerms || 'Net 30',
          paymentMethod: po.paymentMethod || 'credit',
          paymentDueDate: po.paymentDueDate?.slice(0,10) || '',
          shippingInstructions: po.shippingInstructions || '',
          items: (po.items || []).map(i => ({
            part: i.part?._id || i.part,
            quantity: i.quantity || 1,
            unitPrice: i.unitPrice || 0,
            totalPrice: i.totalPrice || (i.quantity || 0) * (i.unitPrice || 0)
          }))
        });
      }
    } catch (err) {
      console.error('❌ Error fetching purchase order:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch purchase order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSuppliers();
    fetchParts();
    fetchPurchaseOrder();
  }, [fetchSuppliers, fetchParts, fetchPurchaseOrder]);

  const addItem = () => {
    // Validate new item before adding
    const itemErrors = {};
    let isValid = true;

    if (!newItem.part) {
      itemErrors.part = "Part selection is required";
      isValid = false;
    }

    const quantity = Number(newItem.quantity) || 0;
    if (quantity < 1) {
      itemErrors.quantity = "Quantity must be at least 1";
      isValid = false;
    }

    const unitPrice = Number(newItem.unitPrice) || 0;
    if (unitPrice < 0) {
      itemErrors.unitPrice = "Unit price cannot be negative";
      isValid = false;
    }

    // Check for duplicate parts
    if (formData.items.some(item => item.part === newItem.part)) {
      itemErrors.part = "This part is already in the order";
      isValid = false;
    }

    if (!isValid) {
      setErrors(prev => ({ ...prev, ...itemErrors }));
      return;
    }

    const item = {
      part: newItem.part,
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: quantity * unitPrice
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, item] }));
    setNewItem({ part: '', quantity: 1, unitPrice: 0 });
    
    // Clear any previous item errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.part;
      delete newErrors.quantity;
      delete newErrors.unitPrice;
      return newErrors;
    });
  };

  const removeItem = (index) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateItemQuantity = (index, quantity) => {
    const newItems = [...formData.items];
    newItems[index].quantity = Number(quantity);
    newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const updateItemPrice = (index, unitPrice) => {
    const newItems = [...formData.items];
    newItems[index].unitPrice = Number(unitPrice);
    newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  const save = async () => {
    // Validate form before saving
    if (!validateForm()) {
      setError("Please fix the validation errors before saving");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = { ...formData };
      if (!id || id === 'new') {
        const response = await api.post('/api/purchase-orders', payload);
        const created = response.data?.purchaseOrder || response.data;
        setToast('Purchase Order created successfully!');
        setTimeout(() => navigate(`/purchase-orders/${created?._id || 'list'}`), 1500);
      } else {
        await api.put(`/api/purchase-orders/${id}`, payload);
        setToast('Purchase Order updated successfully!');
        setTimeout(() => navigate('/purchase-orders'), 1500);
      }
    } catch (err) {
      console.error('❌ Error saving purchase order:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save purchase order');
    } finally {
      setSaving(false);
    }
  };

  if (!isInventoryManager) {
    return (
      <div className="bg-app min-h-screen">
        <div className="app-container">
          <div className="card text-center p-8">
            <div className="text-red-400 text-xl mb-4">🚫</div>
            <h2 className="card-title mb-2">Access Denied</h2>
            <p className="text-slate-400">Only inventory managers can manage purchase orders.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading purchase order data..." />;
  }

  return (
    <div className="bg-app min-h-screen">
      <div className="app-container">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="section-title mb-2">
                {id && id !== 'new' ? 'Edit Purchase Order' : 'New Purchase Order'}
              </h1>
              <p className="text-slate-400">
                {id && id !== 'new' ? 'Update purchase order details and items' : 'Create a new purchase order for inventory'}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              {id && id !== 'new' && (
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `/api/purchase-orders/${id}/pdf`;
                    link.download = `PO-${id}.pdf`;
                    link.click();
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <span>📄</span>
                  Download PDF
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/purchase-orders')}
                className="btn-secondary flex items-center gap-2"
              >
                <span>←</span>
                Back to Purchase Orders
              </button>
            </div>
          </div>

          <ErrorAlert 
            message={error} 
            onDismiss={() => setError(null)} 
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

          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-8">
            {/* Supplier & Delivery */}
            <FormSection title="Supplier & Delivery Information" icon="🚚">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Supplier"
                  name="supplier"
                  required
                  error={errors.supplier || suppliersError}
                  touched={touched.supplier}
                >
                  <select
                    value={formData.supplier}
                    onChange={(e) => handleFieldChange('supplier', e.target.value)}
                    onBlur={(e) => handleFieldBlur('supplier', e.target.value)}
                    required
                    className="select"
                    disabled={loadingSuppliers}
                  >
                    <option value="">
                      {loadingSuppliers ? 'Loading suppliers...' : 'Select a supplier'}
                    </option>
                    {suppliers.length > 0 ? (
                      suppliers.map(supplier => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.companyName} - {supplier.primaryContact?.email}
                        </option>
                      ))
                    ) : (
                      !loadingSuppliers && (
                        <option disabled>
                          {suppliersError ? 'Error loading suppliers' : 'No suppliers available'}
                        </option>
                      )
                    )}
                  </select>
                  {loadingSuppliers && (
                    <div className="text-xs text-slate-400 mt-1">Loading suppliers...</div>
                  )}
                  {suppliersError && (
                    <div className="text-xs text-red-400 mt-1">{suppliersError}</div>
                  )}
                  {!loadingSuppliers && suppliers.length === 0 && !suppliersError && (
                    <div className="text-xs text-yellow-400 mt-1">
                      No suppliers found. Please add suppliers first.
                    </div>
                  )}
                </FormField>

                <FormField
                  label="Expected Delivery Date"
                  name="expectedDeliveryDate"
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => handleFieldChange('expectedDeliveryDate', e.target.value)}
                  onBlur={(e) => handleFieldBlur('expectedDeliveryDate', e.target.value)}
                  required
                  error={errors.expectedDeliveryDate}
                  touched={touched.expectedDeliveryDate}
                  min={new Date().toISOString().split('T')[0]}
                  helpText="Select a future date for expected delivery"
                />
              </div>
            </FormSection>

            {/* Payment Terms */}
            <FormSection title="Payment Terms" icon="💳">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Payment Terms"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => handleFieldChange('paymentTerms', e.target.value)}
                  onBlur={(e) => handleFieldBlur('paymentTerms', e.target.value)}
                  error={errors.paymentTerms}
                  touched={touched.paymentTerms}
                >
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => handleFieldChange('paymentTerms', e.target.value)}
                    onBlur={(e) => handleFieldBlur('paymentTerms', e.target.value)}
                    className="select"
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Net 90">Net 90</option>
                    <option value="Immediate">Immediate</option>
                  </select>
                </FormField>

                <FormField
                  label="Payment Method"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                  onBlur={(e) => handleFieldBlur('paymentMethod', e.target.value)}
                  error={errors.paymentMethod}
                  touched={touched.paymentMethod}
                >
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                    onBlur={(e) => handleFieldBlur('paymentMethod', e.target.value)}
                    className="select"
                  >
                    <option value="credit">Credit</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </FormField>

                <FormField
                  label="Payment Due Date"
                  name="paymentDueDate"
                  type="date"
                  value={formData.paymentDueDate}
                  onChange={(e) => handleFieldChange('paymentDueDate', e.target.value)}
                  onBlur={(e) => handleFieldBlur('paymentDueDate', e.target.value)}
                  error={errors.paymentDueDate}
                  touched={touched.paymentDueDate}
                  min={new Date().toISOString().split('T')[0]}
                  helpText="Optional: Select payment due date"
                />
              </div>
            </FormSection>

            {/* Delivery Address */}
            <FormSection title="Delivery Address" icon="📍">
              <div className="space-y-4">
                <FormField
                  label="Street Address"
                  name="deliveryAddress.street"
                  placeholder="Street Address"
                  value={formData.deliveryAddress.street}
                  onChange={(e) => handleFieldChange('deliveryAddress.street', e.target.value)}
                  onBlur={(e) => handleFieldBlur('deliveryAddress.street', e.target.value)}
                  required
                  error={errors['deliveryAddress.street']}
                  touched={touched['deliveryAddress.street']}
                  helpText="Enter the complete street address"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="City"
                    name="deliveryAddress.city"
                    placeholder="City"
                    value={formData.deliveryAddress.city}
                    onChange={(e) => handleFieldChange('deliveryAddress.city', e.target.value)}
                    onBlur={(e) => handleFieldBlur('deliveryAddress.city', e.target.value)}
                    required
                    error={errors['deliveryAddress.city']}
                    touched={touched['deliveryAddress.city']}
                  />

                  <FormField
                    label="State"
                    name="deliveryAddress.state"
                    placeholder="State"
                    value={formData.deliveryAddress.state}
                    onChange={(e) => handleFieldChange('deliveryAddress.state', e.target.value)}
                    onBlur={(e) => handleFieldBlur('deliveryAddress.state', e.target.value)}
                    error={errors['deliveryAddress.state']}
                    touched={touched['deliveryAddress.state']}
                  />

                  <FormField
                    label="ZIP Code"
                    name="deliveryAddress.zipCode"
                    placeholder="ZIP Code"
                    value={formData.deliveryAddress.zipCode}
                    onChange={(e) => handleFieldChange('deliveryAddress.zipCode', e.target.value)}
                    onBlur={(e) => handleFieldBlur('deliveryAddress.zipCode', e.target.value)}
                    error={errors['deliveryAddress.zipCode']}
                    touched={touched['deliveryAddress.zipCode']}
                  />
                </div>

                <FormField
                  label="Country"
                  name="deliveryAddress.country"
                  placeholder="Country"
                  value={formData.deliveryAddress.country}
                  onChange={(e) => handleFieldChange('deliveryAddress.country', e.target.value)}
                  onBlur={(e) => handleFieldBlur('deliveryAddress.country', e.target.value)}
                  required
                  error={errors['deliveryAddress.country']}
                  touched={touched['deliveryAddress.country']}
                />
              </div>
            </FormSection>

            {/* Order Items */}
            <FormSection title="Order Items" icon="📦">
              {/* Add New Item */}
              <div className="card bg-white/5 border-dashed border-white/20">
                <div className="card-body">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Add New Item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FormField
                      label="Part"
                      name="newItem.part"
                      error={errors.part || partsError}
                      touched={touched.part}
                    >
                      <select
                        value={newItem.part}
                        onChange={(e) => setNewItem(prev => ({ ...prev, part: e.target.value }))}
                        onBlur={(e) => {
                          setTouched(prev => ({ ...prev, part: true }));
                          const error = validateField('newItem.part', e.target.value);
                          if (error) {
                            setErrors(prev => ({ ...prev, part: error }));
                          } else {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.part;
                              return newErrors;
                            });
                          }
                        }}
                        className="select"
                      >
                        <option value="">Select a part</option>
                        {parts.map(part => (
                          <option key={part._id} value={part._id}>
                            {part.name} ({part.partCode})
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField
                      label="Quantity"
                      name="newItem.quantity"
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                      onBlur={(e) => {
                        setTouched(prev => ({ ...prev, quantity: true }));
                        const error = validateField('newItem.quantity', e.target.value);
                        if (error) {
                          setErrors(prev => ({ ...prev, quantity: error }));
                        } else {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.quantity;
                            return newErrors;
                          });
                        }
                      }}
                      error={errors.quantity}
                      touched={touched.quantity}
                    />

                    <FormField
                      label="Unit Price"
                      name="newItem.unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: e.target.value }))}
                      onBlur={(e) => {
                        setTouched(prev => ({ ...prev, unitPrice: true }));
                        const error = validateField('newItem.unitPrice', e.target.value);
                        if (error) {
                          setErrors(prev => ({ ...prev, unitPrice: error }));
                        } else {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.unitPrice;
                            return newErrors;
                          });
                        }
                      }}
                      error={errors.unitPrice}
                      touched={touched.unitPrice}
                    />

                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!newItem.part}
                      className="btn-primary disabled:opacity-50"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium text-slate-300">Part</th>
                          <th className="text-left p-4 text-sm font-medium text-slate-300">Quantity</th>
                          <th className="text-left p-4 text-sm font-medium text-slate-300">Unit Price</th>
                          <th className="text-left p-4 text-sm font-medium text-slate-300">Total</th>
                          <th className="text-center p-4 text-sm font-medium text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} className="border-t border-white/5">
                            <td className="p-4 text-sm text-slate-200">
                              {parts.find(p => p._id === item.part)?.name || 'Unknown Part'}
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, e.target.value)}
                                className="input w-20"
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateItemPrice(index, e.target.value)}
                                className="input w-24"
                              />
                            </td>
                            <td className="p-4 text-sm font-medium text-slate-200">
                              ${(item.totalPrice || 0).toFixed(2)}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="btn-secondary btn-icon text-red-400 hover:text-red-300"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total */}
                  <div className="border-t border-white/5 p-4 bg-white/5">
                    <div className="flex justify-end items-center gap-4">
                      <span className="text-lg font-medium text-slate-300">Total:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </FormSection>

            {/* Additional Information */}
            <FormSection title="Additional Information" icon="📝">
              <div className="space-y-6">
                <FormField
                  label="Shipping Instructions"
                  name="shippingInstructions"
                  value={formData.shippingInstructions}
                  onChange={(e) => handleFieldChange('shippingInstructions', e.target.value)}
                  onBlur={(e) => handleFieldBlur('shippingInstructions', e.target.value)}
                  error={errors.shippingInstructions}
                  touched={touched.shippingInstructions}
                  helpText="Special handling instructions, delivery preferences, etc."
                >
                  <textarea
                    value={formData.shippingInstructions}
                    onChange={(e) => handleFieldChange('shippingInstructions', e.target.value)}
                    onBlur={(e) => handleFieldBlur('shippingInstructions', e.target.value)}
                    placeholder="Special handling instructions, delivery preferences, etc."
                    rows={3}
                    className="textarea"
                  />
                </FormField>

                <FormField
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  onBlur={(e) => handleFieldBlur('notes', e.target.value)}
                  error={errors.notes}
                  touched={touched.notes}
                  helpText="Additional notes or comments about this purchase order"
                >
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    onBlur={(e) => handleFieldBlur('notes', e.target.value)}
                    placeholder="Additional notes or comments about this purchase order"
                    rows={3}
                    className="textarea"
                  />
                </FormField>
              </div>
            </FormSection>

            <ActionButtons
              onSave={save}
              onCancel={() => navigate('/purchase-orders')}
              loading={saving}
              saveText={id && id !== 'new' ? "Update Purchase Order" : "Create Purchase Order"}
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
};

export default PurchaseOrderFormPage;