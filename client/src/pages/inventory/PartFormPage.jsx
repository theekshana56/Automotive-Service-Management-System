import React, { useEffect, useState, useCallback } from "react";
import { useRef } from "react";
import api from "../../api/client";
import { useNavigate, useParams } from "react-router-dom";
import FormField from "../../components/inventory/FormField";
import FormSection from "../../components/inventory/FormSection";
import ActionButtons from "../../components/inventory/ActionButtons";
import MultiSelect from "../../components/inventory/MultiSelect";
import LoadingSpinner from "../../components/inventory/LoadingSpinner";
import ErrorAlert from "../../components/inventory/ErrorAlert";
import SuccessToast from "../../components/inventory/SuccessToast";

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
  sellingPrice: 0,
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

        try {
          const supRes = await api.get('/api/suppliers/public');
          const supData = supRes.data?.items || [];
          const exampleSuppliers = [
            { _id: 'sup-01', name: 'Auto Parts Co.' },
            { _id: 'sup-02', name: 'Best Motors Ltd.' },
            { _id: 'sup-03', name: 'Prime Spares' },
          ];
          setSuppliers(supData.length ? supData : exampleSuppliers);
        } catch (err) {
          setSuppliers([
            { _id: 'sup-01', name: 'Auto Parts Co.' },
            { _id: 'sup-02', name: 'Best Motors Ltd.' },
            { _id: 'sup-03', name: 'Prime Spares' },
          ]);
        }
      } catch (e) {
        console.warn('Failed to load reference data. Using examples.');
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
        setSuppliers([
          { _id: 'sup-01', name: 'Auto Parts Co.' },
          { _id: 'sup-02', name: 'Best Motors Ltd.' },
          { _id: 'sup-03', name: 'Prime Spares' },
        ]);
      }
    })();
  }, []);

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
    
    if (name === "sellingPrice") {
      const num = Number(value);
      if (isNaN(num) || num < 0) return "Selling price must be a positive number";
      if (num > 999999.99) return "Selling price must be less than 1,000,000";
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
    } else if (name === "sellingPrice") {
      setForm((f) => ({ ...f, sellingPrice: value === "" ? "" : Number(value) }));
    } else if (name === "compatibleModels") {
      const selected = Array.from(e.target.selectedOptions, opt => opt.value);
      setForm((f) => ({ ...f, compatibleModels: selected }));
    } else if (name === "suppliers") {
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
      const payload = { ...form };

      if (form.categoryId) {
        const sel = categories.find((c) => String(c._id) === String(form.categoryId));
        payload.category = sel ? sel.name : form.categoryId;
      }
      delete payload.categoryId;

      const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v));
      payload.suppliers = Array.isArray(form.suppliers)
        ? form.suppliers.filter(isObjectId)
        : [];

      if (!id) {
        const base = (form.name || 'PART').toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').slice(0, 10).replace(/^-|-$/g, '');
        const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
        let candidate = `${base}${base ? '-' : ''}${rand}`;
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
      
      setTimeout(() => navigate("/parts"), 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to save part";
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return <LoadingSpinner message="Loading part data..." />;
  }

  const vehicleModelOptions = vehicleModels.map(vm => ({
    ...vm,
    name: `${vm.make} ${vm.model} ${vm.yearFrom}-${vm.yearTo} ${vm.engineType}`,
    _id: vm._id
  }));

  return (
    <div className="bg-app min-h-screen">
      <div className="app-container">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="section-title mb-2">
                {id ? "Edit Part" : "Add New Part"}
              </h1>
              <p className="text-slate-400">
                {id ? "Update part information and specifications" : "Create a new automotive part entry"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/parts")}
              className="btn-secondary flex items-center gap-2"
            >
              <span>←</span>
              Back to Parts
            </button>
          </div>

          <ErrorAlert 
            message={errors.submit} 
            onDismiss={() => setErrors(prev => ({ ...prev, submit: null }))} 
          />

          <form onSubmit={submit} className="space-y-8">
            {/* Basic Information */}
            <FormSection title="Basic Information" icon="📋" className="relative z-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Brand"
                  name="brandId"
                  value={form.brandId}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.brandId}
                  touched={touched.brandId}
                  helpText="Select the manufacturer or brand for this part"
                >
                  <select
                    name="brandId"
                    value={form.brandId}
                    onChange={onChange}
                    onBlur={onBlur}
                    required
                    className="select"
                  >
                    <option value="">Select brand</option>
                    {brands.map(brand => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Part Name"
                  name="name"
                  placeholder="Enter part name (e.g., Oil Filter, Brake Pads)"
                  value={form.name}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.name}
                  touched={touched.name}
                  helpText="Enter a descriptive name for the part"
                />
              </div>

              <FormField
                label="Category"
                name="categoryId"
                value={form.categoryId}
                onChange={onChange}
                onBlur={onBlur}
                required
                error={errors.categoryId}
                touched={touched.categoryId}
                helpText="Select the category for this part"
              >
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  className="select"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </FormField>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Compatible Vehicle Models *
                </label>
                <MultiSelect
                  options={vehicleModelOptions}
                  selected={form.compatibleModels}
                  onChange={(selected) => setForm(f => ({ ...f, compatibleModels: selected }))}
                  placeholder="Select compatible vehicle models..."
                  displayKey="name"
                  valueKey="_id"
                  error={errors.compatibleModels}
                  touched={touched.compatibleModels}
                />
                {errors.compatibleModels && touched.compatibleModels && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                    <span className="text-xs">⚠</span>
                    {errors.compatibleModels}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Preferred Suppliers
                </label>
                <MultiSelect
                  options={suppliers}
                  selected={form.suppliers}
                  onChange={(selected) => setForm(f => ({ ...f, suppliers: selected }))}
                  placeholder="Select preferred suppliers..."
                  displayKey="name"
                  valueKey="_id"
                />
              </div>
            </FormSection>

            {/* Stock & Pricing */}
            <FormSection title="Stock & Pricing" icon="📊" className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Unit"
                  name="unit"
                  value={form.unit}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.unit}
                  touched={touched.unit}
                  helpText="Unit of measurement"
                >
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={onChange}
                    onBlur={onBlur}
                    required
                    className="select"
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
                </FormField>

                <FormField
                  label="Last Purchase Price"
                  name="cost.lastPurchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost.lastPurchasePrice}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['cost.lastPurchasePrice']}
                  touched={touched['cost.lastPurchasePrice']}
                  helpText="Last purchase price in USD"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Selling Price"
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.sellingPrice}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['sellingPrice']}
                  touched={touched['sellingPrice']}
                  helpText="Retail/unit selling price in USD"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  label="On Hand"
                  name="stock.onHand"
                  type="number"
                  min="0"
                  value={form.stock.onHand}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['stock.onHand']}
                  touched={touched['stock.onHand']}
                />

                <FormField
                  label="Min Level"
                  name="stock.minLevel"
                  type="number"
                  min="0"
                  value={form.stock.minLevel}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['stock.minLevel']}
                  touched={touched['stock.minLevel']}
                />

                <FormField
                  label="Max Level"
                  name="stock.maxLevel"
                  type="number"
                  min="0"
                  value={form.stock.maxLevel}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['stock.maxLevel']}
                  touched={touched['stock.maxLevel']}
                />

                <FormField
                  label="Reorder Level"
                  name="stock.reorderLevel"
                  type="number"
                  min="0"
                  value={form.stock.reorderLevel}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['stock.reorderLevel']}
                  touched={touched['stock.reorderLevel']}
                />
              </div>
            </FormSection>

            {/* Specifications */}
            <FormSection title="Specifications" icon="🔧">
              <div className="space-y-4">
                {specKeys.map((key, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <FormField
                        label="Specification Name"
                        name={`spec-key-${index}`}
                        placeholder="e.g., Engine Type, Voltage"
                        value={key}
                        onChange={(e) => {
                          const newKeys = [...specKeys];
                          const oldKey = newKeys[index];
                          newKeys[index] = e.target.value;
                          setSpecKeys(newKeys);
                          
                          if (oldKey && form.specifications[oldKey]) {
                            const newSpecs = { ...form.specifications };
                            newSpecs[e.target.value] = newSpecs[oldKey];
                            delete newSpecs[oldKey];
                            setForm(f => ({ ...f, specifications: newSpecs }));
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <FormField
                        label="Value"
                        name={`specifications.${key}`}
                        placeholder="e.g., V6, 12V"
                        value={form.specifications[key] || ""}
                        onChange={onChange}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSpecField(key)}
                      className="btn-secondary btn-icon mb-2 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addSpecField}
                  className="btn-ghost flex items-center gap-2"
                >
                  <span>+</span>
                  Add Specification
                </button>
              </div>
            </FormSection>

            {/* Notes */}
            <FormSection title="Additional Notes" icon="📝">
              <FormField
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={onChange}
                onBlur={onBlur}
                error={errors.notes}
                touched={touched.notes}
                helpText="Any additional information about this part"
              >
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Enter any additional notes about this part..."
                  rows={4}
                  className="textarea"
                />
              </FormField>
            </FormSection>

            <ActionButtons
              onSave={submit}
              onCancel={() => navigate("/parts")}
              loading={loading}
              saveText={id ? "Update Part" : "Create Part"}
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