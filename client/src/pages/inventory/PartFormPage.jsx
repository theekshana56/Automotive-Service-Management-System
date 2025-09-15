import React, { useEffect, useState, useCallback } from "react";
import { useRef } from "react";
import api from "../../api/client";
import { useNavigate, useParams } from "react-router-dom";

const empty = {
  name: "",
  partCode: "",
  categoryId: "",
  brandId: "",
  compatibleModels: [],
  compatibleVehicles: "",
  unit: "pcs",
  stock: { onHand: 0, minLevel: 0, maxLevel: 0, reorderLevel: 0 },
  cost: { lastPurchasePrice: 0, currency: "USD" },
  notes: "",
  specifications: {},
  suppliers: [],
};

export default function PartFormPage() {
  const toastRef = useRef();
  const [toast, setToast] = useState("");
  const [specKeys, setSpecKeys] = useState([""]);
  const [specErrors, setSpecErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  console.log('🔍 Current suppliers state:', suppliers);
  const { id } = useParams();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [partCodeExists, setPartCodeExists] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/api/parts/${id}`);
      setForm((prev) => ({
        ...empty,
        ...data,
        suppliers: Array.isArray(data.suppliers) ? data.suppliers.map(String) : [],
        // Temporarily set categoryId to the server string; we'll map on submit
        categoryId: data.category || "",
      }));
    } catch (err) {
      console.error('Failed to load part:', err);
      setErrors({ submit: "Failed to load part data" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [id, load]);
  useEffect(() => {
    if (form.specifications && Object.keys(form.specifications).length > 0) {
      setSpecKeys(Object.keys(form.specifications));
    }
  }, [form.specifications]);

  useEffect(() => {
    // Load dropdown data
    (async () => {
      try {
        const [catRes, brandRes, vmRes] = await Promise.all([
          api.get('/api/categories'),
          api.get('/api/brands'),
          api.get('/api/vehicle-models')
        ]);
        const catData = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.items || []);
        const brandData = Array.isArray(brandRes.data) ? brandRes.data : (brandRes.data?.items || []);
        const vmData = Array.isArray(vmRes.data) ? vmRes.data : (vmRes.data?.items || []);

        // Fallback examples if API empty
        const exampleCategories = [
          { _id: 'cat-engines', name: 'Engines' },
          { _id: 'cat-filters', name: 'Filters' },
          { _id: 'cat-brakes', name: 'Brakes' },
          { _id: 'cat-electrical', name: 'Electrical' },
        ];
        const exampleBrands = [
          { _id: 'brd-bosch', name: 'Bosch' },
          { _id: 'brd-denso', name: 'Denso' },
          { _id: 'brd-ngk', name: 'NGK' },
          { _id: 'brd-mobil', name: 'Mobil' },
        ];
        const exampleVehicleModels = [
          { _id: 'vm-corolla-18', make: 'Toyota', model: 'Corolla', yearFrom: 2015, yearTo: 2018, engineType: '1.8L' },
          { _id: 'vm-civic-15', make: 'Honda', model: 'Civic', yearFrom: 2012, yearTo: 2015, engineType: '1.5L' },
          { _id: 'vm-focus-20', make: 'Ford', model: 'Focus', yearFrom: 2016, yearTo: 2020, engineType: '2.0L' },
          { _id: 'vm-3-20', make: 'Mazda', model: '3', yearFrom: 2014, yearTo: 2020, engineType: '2.0L' }
        ];

        setCategories(catData.length ? catData : exampleCategories);
        setBrands(brandData.length ? brandData : exampleBrands);
        setVehicleModels(vmData.length ? vmData : exampleVehicleModels);

        // Load suppliers list (public endpoint if available)
        try {
          const supRes = await api.get('/api/suppliers/public');
          console.log('🔍 Suppliers API Response:', supRes.data);
          const supData = supRes.data?.items || [];
          console.log('🔍 Extracted suppliers data:', supData);
          const exampleSuppliers = [
            { _id: 'sup-01', name: 'Auto Parts Co.' },
            { _id: 'sup-02', name: 'Best Motors Ltd.' },
            { _id: 'sup-03', name: 'Prime Spares' },
          ];
          const finalSuppliers = supData.length ? supData : exampleSuppliers;
          console.log('🔍 Final suppliers to set:', finalSuppliers);
          setSuppliers(finalSuppliers);
        } catch (err) {
          console.error('❌ Failed to load suppliers:', err);
          setSuppliers([
            { _id: 'sup-01', name: 'Auto Parts Co.' },
            { _id: 'sup-02', name: 'Best Motors Ltd.' },
            { _id: 'sup-03', name: 'Prime Spares' },
          ]);
        }
      } catch (e) {
        console.warn('Failed to load reference data (categories/brands/models). Using examples.');
        setCategories([
          { _id: 'cat-engines', name: 'Engines' },
          { _id: 'cat-filters', name: 'Filters' },
          { _id: 'cat-brakes', name: 'Brakes' },
          { _id: 'cat-electrical', name: 'Electrical' },
        ]);
        setBrands([
          { _id: 'brd-bosch', name: 'Bosch' },
          { _id: 'brd-denso', name: 'Denso' },
          { _id: 'brd-ngk', name: 'NGK' },
          { _id: 'brd-mobil', name: 'Mobil' },
        ]);
        setVehicleModels([
          { _id: 'vm-corolla-18', make: 'Toyota', model: 'Corolla', yearFrom: 2015, yearTo: 2018, engineType: '1.8L' },
          { _id: 'vm-civic-15', make: 'Honda', model: 'Civic', yearFrom: 2012, yearTo: 2015, engineType: '1.5L' },
          { _id: 'vm-focus-20', make: 'Ford', model: 'Focus', yearFrom: 2016, yearTo: 2020, engineType: '2.0L' },
          { _id: 'vm-3-20', make: 'Mazda', model: '3', yearFrom: 2014, yearTo: 2020, engineType: '2.0L' }
        ]);
        // Also set example suppliers as fallback
        setSuppliers([
          { _id: 'sup-01', name: 'Auto Parts Co.' },
          { _id: 'sup-02', name: 'Best Motors Ltd.' },
          { _id: 'sup-03', name: 'Prime Spares' },
        ]);
      }
    })();
  }, []);

  // Separate effect to load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        console.log('🔄 Loading suppliers...');
        const supRes = await api.get('/api/suppliers/public');
        console.log('🔍 Suppliers API Response:', supRes.data);
        const supData = supRes.data?.items || [];
        console.log('🔍 Extracted suppliers data:', supData);
        
        if (supData.length > 0) {
          setSuppliers(supData);
          console.log('✅ Suppliers loaded successfully:', supData);
        } else {
          console.log('⚠️ No suppliers found, using examples');
          setSuppliers([
            { _id: 'sup-01', name: 'Auto Parts Co.' },
            { _id: 'sup-02', name: 'Best Motors Ltd.' },
            { _id: 'sup-03', name: 'Prime Spares' },
          ]);
        }
      } catch (err) {
        console.error('❌ Failed to load suppliers:', err);
        setSuppliers([
          { _id: 'sup-01', name: 'Auto Parts Co.' },
          { _id: 'sup-02', name: 'Best Motors Ltd.' },
          { _id: 'sup-03', name: 'Prime Spares' },
        ]);
      }
    };
    
    loadSuppliers();
  }, []);

  // Validation functions
  const validateField = (name, value) => {
    if (name === "name") {
      if (!value || value.trim() === "") return "Part name is required";
      if (value.length < 2) return "Part name must be at least 2 characters";
      if (value.length > 100) return "Part name must be less than 100 characters";
    }
    
    if (name === "categoryId") {
      if (!value) return "Category is required";
    }
    
    if (name === "brandId") {
      if (!value) return "Brand is required";
    }
    if (name === "compatibleModels") {
      if (!value || value.length === 0) return "Select at least one compatible model";
    }
    if (name === "unit") {
      if (!value || value.trim() === "") return "Unit is required";
    }
    
    if (name === "cost.lastPurchasePrice") {
      const num = Number(value);
      if (isNaN(num) || num < 0) return "Price must be a positive number";
      if (num > 999999.99) return "Price must be less than 1,000,000";
    }
    
    if (name.startsWith("stock.")) {
      const num = Number(value);
      if (isNaN(num) || num < 0) return "Quantity must be a positive number";
      if (num > 999999) return "Quantity must be less than 1,000,000";
    }
    
    if (name === "notes" && value.length > 500) {
      return "Notes must be less than 500 characters";
    }
    
    return "";
  };

  // Check if part code already exists (kept for potential server-side retries)
  const checkPartCodeExists = async (partCode) => {
    if (!partCode) return false;
    try {
      const { data } = await api.get(`/api/parts?partCode=${partCode}`);
      return Boolean(data.items && data.items.length > 0);
    } catch (err) {
      return false;
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: null }));
    setPartCodeExists(false);
    if (name.startsWith("stock.")) {
      const key = name.split(".")[1];
      setForm((f) => ({ ...f, stock: { ...f.stock, [key]: value === "" ? "" : Number(value) } }));
    } else if (name.startsWith("cost.")) {
      const key = name.split(".")[1];
      setForm((f) => ({ ...f, cost: { ...f.cost, [key]: key === "lastPurchasePrice" ? Number(value) : value } }));
    } else if (name === "compatibleModels") {
      // Multi-select for vehicle models
      const selected = Array.from(e.target.selectedOptions, opt => opt.value);
      setForm((f) => ({ ...f, compatibleModels: selected }));
    } else if (name === "suppliers") {
      // Multi-select for suppliers
      const selected = Array.from(e.target.selectedOptions, opt => opt.value);
      setForm((f) => ({ ...f, suppliers: selected }));
    } else if (name.startsWith("specifications.")) {
      const key = name.replace("specifications.", "");
      setForm((f) => ({
        ...f,
        specifications: { ...f.specifications, [key]: value }
      }));
      if (!specKeys.includes(key)) setSpecKeys([...specKeys, key]);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const addSpecField = () => {
    setSpecKeys([...specKeys, ""]);
  };

  const removeSpecField = (key) => {
    const newKeys = specKeys.filter(k => k !== key);
    setSpecKeys(newKeys);
    const newSpecs = { ...form.specifications };
    delete newSpecs[key];
    setForm(f => ({ ...f, specifications: newSpecs }));
    setSpecErrors(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
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

    // Validate all fields
    Object.keys(form).forEach(key => {
      if (key === "stock" || key === "cost") {
        Object.keys(form[key]).forEach(subKey => {
          const fieldName = `${key}.${subKey}`;
          const error = validateField(fieldName, form[key][subKey]);
          if (error) {
            newErrors[fieldName] = error;
            isValid = false;
          }
        });
      } else {
        const error = validateField(key, form[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    // Validate stock levels
    if (form.stock.maxLevel > 0 && form.stock.minLevel > form.stock.maxLevel) {
      newErrors["stock.minLevel"] = "Minimum level cannot be greater than maximum level";
      isValid = false;
    }

    if (form.stock.maxLevel > 0 && form.stock.onHand > form.stock.maxLevel) {
      newErrors["stock.onHand"] = "On hand quantity cannot be greater than maximum level";
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
      const payload = {
        ...form,
      };

      // Map categoryId (UI) -> category (server expects string name)
      if (form.categoryId) {
        const sel = categories.find((c) => String(c._id) === String(form.categoryId));
        payload.category = sel ? sel.name : form.categoryId;
      }
      delete payload.categoryId;

      // Ensure suppliers array is sent
      payload.suppliers = Array.isArray(form.suppliers) ? form.suppliers : [];

      // Auto-generate partCode on create
      if (!id) {
        const base = (form.name || 'PART').toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').slice(0, 10).replace(/^-|-$/g, '');
        const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
        let candidate = `${base}${base ? '-' : ''}${rand}`;
        // probe for uniqueness a couple of times
        for (let i = 0; i < 2; i++) {
          const exists = await checkPartCodeExists(candidate);
          if (!exists) break;
          const extra = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2);
          candidate = `${base}${base ? '-' : ''}${rand}${extra}`;
        }
        payload.partCode = candidate;
      }
      
      if (id) {
        await api.put(`/api/parts/${id}`, payload);
        setToast("Part updated successfully!");
      } else {
        await api.post("/api/parts", payload);
        setToast("Part saved successfully!");
      }
      
      navigate("/parts");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to save part";
      setErrors({ submit: errorMessage });
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
          <div style={{ color: '#6b7280' }}>Loading part data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      padding: '2rem',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: '720px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '2rem',
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
          }}>{id ? "Edit Part" : "Add New Part"}</h1>
          <button
            type="button"
            onClick={() => navigate("/parts")}
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
            ← Back to Parts
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

        {toast && (
          <div ref={toastRef} style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: '#22c55e',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontWeight: 'bold',
            fontSize: '1rem',
            animation: 'fadeIn 0.5s',
          }}>
            {toast}
          </div>
        )}
        <form onSubmit={submit} style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Basic Info Section */}
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
              📋 Basic Information
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Brand */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Brand *</label>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', marginLeft: '0.5rem' }} title="Select the manufacturer or brand for this part.">ⓘ</span>
                <select name="brandId" value={form.brandId} onChange={onChange} onBlur={onBlur} required style={getInputStyle('brandId')} aria-label="Brand">
                  <option value="">Select brand</option>
                  {brands.map(brand => (<option key={brand._id} value={brand._id}>{brand.name}</option>))}
                </select>
                {getFieldError('brandId') && (<div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span>⚠️</span>{getFieldError('brandId')}</div>)}
              </div>
              {/* Part Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Part Name *</label>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', marginLeft: '0.5rem' }} title="Enter a descriptive name for the part.">ⓘ</span>
                <input name="name" placeholder="Enter part name (e.g., Oil Filter, Brake Pads)" value={form.name} onChange={onChange} onBlur={onBlur} required style={getInputStyle('name')} aria-label="Part name" />
                {getFieldError('name') && (<div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span>⚠️</span>{getFieldError('name')}</div>)}
              </div>
              {/* Compatible Vehicle Models */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Compatible Vehicle Models *</label>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', marginLeft: '0.5rem' }} title="Select all vehicle models this part fits.">ⓘ</span>
                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: '#fff'
                }} aria-label="Compatible vehicle models">
                  {vehicleModels.map(vm => {
                    const checked = form.compatibleModels.includes(vm._id);
                    return (
                      <label key={vm._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setForm(f => {
                              const current = new Set(f.compatibleModels);
                              if (isChecked) current.add(vm._id); else current.delete(vm._id);
                              return { ...f, compatibleModels: Array.from(current) };
                            });
                          }}
                          aria-label={`${vm.make} ${vm.model} ${vm.yearFrom}-${vm.yearTo} ${vm.engineType}`}
                        />
                        <span style={{ color: '#374151' }}>{vm.make} {vm.model} {vm.yearFrom}-{vm.yearTo} {vm.engineType}</span>
                      </label>
                    );
                  })}
                  {vehicleModels.length === 0 && (
                    <div style={{ padding: '0.5rem', color: '#6b7280' }}>No vehicle models available</div>
                  )}
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {form.compatibleModels.map(id => {
                    const vm = vehicleModels.find(v => v._id === id);
                    if (!vm) return null;
                    return (
                      <span key={id} style={{ background: '#eef2ff', color: '#3730a3', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.8rem' }}>
                        {vm.make} {vm.model} {vm.engineType}
                      </span>
                    );
                  })}
                  {form.compatibleModels.length === 0 && (
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>No models selected</span>
                  )}
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setForm(f => ({ ...f, compatibleModels: [] }))} style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.375rem', cursor: 'pointer' }}>Clear selection</button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, compatibleModels: vehicleModels.map(v => v._id) }))} style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '0.375rem', cursor: 'pointer' }}>Select all</button>
                </div>
                {getFieldError('compatibleModels') && (<div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span>⚠️</span>{getFieldError('compatibleModels')}</div>)}
              </div>
              {/* Part Code */}
              {/* Removed: part code is auto-generated server-side; no manual input */}
              {/* Category */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Category *</label>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', marginLeft: '0.5rem' }} title="Select the category for this part.">ⓘ</span>
                <select name="categoryId" value={form.categoryId} onChange={onChange} onBlur={onBlur} required style={getInputStyle('categoryId')} aria-label="Category">
                  <option value="">Select category</option>
                  {categories.map(cat => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
                </select>
                {getFieldError('categoryId') && (<div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span>⚠️</span>{getFieldError('categoryId')}</div>)}
              </div>

              {/* Preferred Suppliers (multiple) */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Preferred Suppliers</label>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', marginLeft: '0.5rem' }} title="Select suppliers who commonly provide this part.">ⓘ</span>
                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: '#fff'
                }} aria-label="Suppliers">
                  {console.log('🎯 Rendering suppliers:', suppliers, 'Length:', suppliers.length)}
                  {suppliers.map(s => {
                    const checked = form.suppliers.includes(s._id);
                    return (
                      <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setForm(f => {
                              const current = new Set(f.suppliers);
                              if (isChecked) current.add(s._id); else current.delete(s._id);
                              return { ...f, suppliers: Array.from(current) };
                            });
                          }}
                          aria-label={`${s.name}`}
                        />
                        <span style={{ color: '#374151' }}>{s.name}</span>
                      </label>
                    );
                  })}
                  {suppliers.length === 0 && (
                    <div style={{ padding: '0.5rem', color: '#6b7280' }}>No suppliers available</div>
                  )}
              </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setForm(f => ({ ...f, suppliers: [] }))} style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.375rem', cursor: 'pointer' }}>Clear</button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, suppliers: suppliers.map(x => x._id) }))} style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '0.375rem', cursor: 'pointer' }}>Select all</button>
                </div>
              </div>
              {/* Compatible Vehicles (text) */}
              {/* Removed free-text compatible vehicles; using multi-select models instead */}
            </div>
          </div>

          {/* Unit & Cost Section */}
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
              💰 Unit & Cost Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Unit *
                </label>
                <select
                  name="unit"
                  value={form.unit}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  style={getInputStyle('unit')}
                  aria-label="Unit"
                >
                  <option value="">Select a unit</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="liters">Liters (L)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="meters">Meters (m)</option>
                  <option value="cm">Centimeters (cm)</option>
                  <option value="mm">Millimeters (mm)</option>
                  <option value="feet">Feet (ft)</option>
                  <option value="inches">Inches (in)</option>
                  <option value="boxes">Boxes</option>
                  <option value="sets">Sets</option>
                  <option value="pairs">Pairs</option>
                  <option value="rolls">Rolls</option>
                  <option value="sheets">Sheets</option>
                  <option value="gallons">Gallons (gal)</option>
                  <option value="quarts">Quarts (qt)</option>
                  <option value="pints">Pints (pt)</option>
                  <option value="ounces">Ounces (oz)</option>
                  <option value="pounds">Pounds (lbs)</option>
                  <option value="tons">Tons</option>
                  <option value="hours">Hours</option>
                  <option value="minutes">Minutes</option>
                  <option value="other">Other (specify in description)</option>
                </select>
                {getFieldError('unit') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('unit')}
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
                  Last Purchase Price
                </label>
                <input
                  name="cost.lastPurchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.cost.lastPurchasePrice}
                  onChange={onChange}
                  onBlur={onBlur}
                  style={getInputStyle('cost.lastPurchasePrice')}
                  aria-label="Last purchase price"
                />
                {getFieldError('cost.lastPurchasePrice') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('cost.lastPurchasePrice')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock Levels Section */}
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
              📦 Stock Levels
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  On Hand Quantity
                </label>
                <input
                  name="stock.onHand"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock.onHand}
                  onChange={onChange}
                  onBlur={onBlur}
                  style={getInputStyle('stock.onHand')}
                  aria-label="Stock on hand"
                />
                {getFieldError('stock.onHand') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('stock.onHand')}
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
                  Reorder Level *
                </label>
                <input
                  name="stock.reorderLevel"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock.reorderLevel}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  style={getInputStyle('stock.reorderLevel')}
                  aria-label="Reorder level"
                />
                {getFieldError('stock.reorderLevel') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('stock.reorderLevel')}
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
                  Minimum Level
                </label>
                <input
                  name="stock.minLevel"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock.minLevel}
                  onChange={onChange}
                  onBlur={onBlur}
                  style={getInputStyle('stock.minLevel')}
                  aria-label="Minimum level"
                />
                {getFieldError('stock.minLevel') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('stock.minLevel')}
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
                  Maximum Level
                </label>
                <input
                  name="stock.maxLevel"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock.maxLevel}
                  onChange={onChange}
                  onBlur={onBlur}
                  style={getInputStyle('stock.maxLevel')}
                  aria-label="Maximum level"
                />
                {getFieldError('stock.maxLevel') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('stock.maxLevel')}
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280', 
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '0.375rem',
              border: '1px solid #bae6fd'
            }}>
              <strong>💡 Tip:</strong> Set a reorder level to receive low-stock alerts when inventory falls below this threshold.
            </div>
          </div>

          {/* Specifications Section */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🛠️ Specifications
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {specKeys.map((key, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Key (e.g., Weight)"
                    value={key}
                    onChange={e => {
                      const newKeys = [...specKeys];
                      newKeys[idx] = e.target.value;
                      setSpecKeys(newKeys);
                      // Move value to new key
                      if (form.specifications[key]) {
                        setForm(f => ({
                          ...f,
                          specifications: {
                            ...f.specifications,
                            [e.target.value]: f.specifications[key],
                            [key]: undefined
                          }
                        }));
                      }
                    }}
                    style={{ width: '40%', padding: '0.5rem', border: specErrors[key] ? '2px solid #dc2626' : '1px solid #d1d5db', borderRadius: '0.375rem' }}
                    title="Enter the specification name (e.g., Weight, Thread Size)"
                  />
                  <input
                    type="text"
                    name={`specifications.${key}`}
                    placeholder="Value (e.g., 0.5kg)"
                    value={form.specifications[key] || ""}
                    onChange={onChange}
                    style={{ width: '50%', padding: '0.5rem', border: specErrors[key] ? '2px solid #dc2626' : '1px solid #d1d5db', borderRadius: '0.375rem' }}
                    title="Enter the specification value (e.g., 0.5kg, Cartridge)"
                  />
                  <button type="button" onClick={() => removeSpecField(key)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', cursor: 'pointer' }}>Remove</button>
                  {specErrors[key] && (
                    <span style={{ position: 'absolute', left: 0, top: '100%', color: '#dc2626', fontSize: '0.85rem', marginTop: '2px' }}>
                      {specErrors[key]}
                    </span>
                  )}
                </div>
              ))}
              <button type="button" onClick={addSpecField} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.5rem 1rem', cursor: 'pointer', marginTop: '0.5rem' }}>+ Add Specification</button>
            </div>
          </div>
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
                name="notes"
                placeholder="Enter any additional notes about this part (optional)"
                value={form.notes}
                onChange={onChange}
                onBlur={onBlur}
                style={{ 
                  ...getInputStyle('notes'),
                  minHeight: '100px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                aria-label="Notes"
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
              type="submit"
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
              aria-label={loading ? "Saving..." : "Save part"}
            >
              {loading ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  {id ? "Update Part" : "Save Part"}
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate("/parts")}
              style={{
                background: 'transparent',
                border: '1px solid #d1d5db',
                color: '#374151',
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