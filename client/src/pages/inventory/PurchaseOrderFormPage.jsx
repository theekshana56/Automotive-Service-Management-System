import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.jsx';
import api from '../../api/client';

const PurchaseOrderFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Role-based access control
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

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoadingSuppliers(true);
      setSuppliersError(null);
      console.log('🔍 Fetching suppliers...');
      const response = await api.get('/api/suppliers/public');
      console.log('✅ Suppliers response:', response.data);
      setSuppliers(response.data.suppliers || response.data.items || []);
    } catch (err) {
      console.error('❌ Error fetching suppliers:', err);
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
      console.log('🔍 Fetching parts...');
      const response = await api.get('/api/parts/public');
      console.log('✅ Parts response:', response.data);
      setParts(response.data.parts || []);
    } catch (err) {
      console.error('❌ Error fetching parts:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch parts';
      setPartsError(errorMessage);
      setError(`Parts error: ${errorMessage}`);
    } finally {
      setLoadingParts(false);
    }
  }, []);

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
    if (!newItem.part) return;
    const item = {
      part: newItem.part,
      quantity: Number(newItem.quantity) || 1,
      unitPrice: Number(newItem.unitPrice) || 0,
      totalPrice: (Number(newItem.quantity) || 1) * (Number(newItem.unitPrice) || 0)
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, item] }));
    setNewItem({ part: '', quantity: 1, unitPrice: 0 });
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
    try {
      setSaving(true);
      setError(null);

      const payload = { ...formData };
      // Create or update
      if (!id || id === 'new') {
        const response = await api.post('/api/purchase-orders', payload);
        const created = response.data?.purchaseOrder || response.data;
        alert('Purchase Order created');
        navigate(`/purchase-orders/${created?._id || 'list'}`);
      } else {
        await api.put(`/api/purchase-orders/${id}`, payload);
        alert('Purchase Order updated');
      }
    } catch (err) {
      console.error('❌ Error saving purchase order:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save purchase order');
    } finally {
      setSaving(false);
    }
  };

  if (!isInventoryManager) {
    return <div style={{ padding: '1rem', color: '#b91c1c' }}>Access denied. Only inventory managers can manage purchase orders.</div>;
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
        maxWidth: '1200px',
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
          }}>{id && id !== 'new' ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {id && id !== 'new' && (
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `/api/purchase-orders/${id}/pdf`;
                  link.download = `PO-${id}.pdf`;
                  link.click();
                }}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                📄 Download PDF
              </button>
            )}
          <button
            type="button"
            onClick={() => navigate('/purchase-orders')}
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
            ← Back to Purchase Orders
          </button>
          </div>
        </div>

        {error && (
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
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); save(); }} style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Supplier Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Supplier *
            </label>
            <select
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select a supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name} - {supplier.email}
                </option>
              ))}
            </select>
            {suppliersError && (
              <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {suppliersError}
              </p>
            )}
          </div>

          {/* Expected Delivery Date */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Expected Delivery Date *
            </label>
            <input
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
              required
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Payment Terms and Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Net 90">Net 90</option>
                <option value="Immediate">Immediate</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="credit">Credit</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Delivery Address
            </label>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Street Address"
                value={formData.deliveryAddress.street}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  deliveryAddress: { ...prev.deliveryAddress, street: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="City"
                  value={formData.deliveryAddress.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    deliveryAddress: { ...prev.deliveryAddress, city: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.deliveryAddress.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    deliveryAddress: { ...prev.deliveryAddress, state: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={formData.deliveryAddress.zipCode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    deliveryAddress: { ...prev.deliveryAddress, zipCode: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Shipping Instructions */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Shipping Instructions
            </label>
            <textarea
              value={formData.shippingInstructions}
              onChange={(e) => setFormData(prev => ({ ...prev, shippingInstructions: e.target.value }))}
              placeholder="Special handling instructions, delivery preferences, etc."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or comments about this purchase order"
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Items Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>
                Order Items
              </h3>
              <button
                type="button"
                onClick={addItem}
                disabled={!newItem.part}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  opacity: newItem.part ? 1 : 0.5
                }}
              >
                + Add Item
              </button>
            </div>

            {/* Add New Item */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr auto', 
              gap: '1rem', 
              alignItems: 'end',
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  Part
                </label>
                <select
                  value={newItem.part}
                  onChange={(e) => setNewItem(prev => ({ ...prev, part: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select a part</option>
                  {parts.map(part => (
                    <option key={part._id} value={part._id}>
                      {part.name} ({part.partCode})
                    </option>
                  ))}
                </select>
                {partsError && (
                  <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {partsError}
                  </p>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  Unit Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            {/* Items List */}
            {formData.items.length > 0 && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Part</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Quantity</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Unit Price</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '500', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>
                          {parts.find(p => p._id === item.part)?.name || 'Unknown Part'}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, e.target.value)}
                            style={{
                              width: '80px',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              fontSize: '0.875rem'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItemPrice(index, e.target.value)}
                            style={{
                              width: '100px',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              fontSize: '0.875rem'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                          ${(item.totalPrice || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            style={{
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total */}
            {formData.items.length > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                gap: '1rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.375rem',
                marginTop: '1rem'
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>
                  Total:
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <button
              type="button"
              onClick={() => navigate('/purchase-orders')}
              style={{
                background: 'transparent',
                border: '1px solid #d1d5db',
                color: '#6b7280',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || formData.items.length === 0}
              style={{
                background: saving || formData.items.length === 0 ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: saving || formData.items.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Saving...' : (id && id !== 'new' ? 'Update Purchase Order' : 'Create Purchase Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderFormPage;
