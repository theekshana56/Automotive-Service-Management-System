import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../../api/client';
import { jobHistoryApi } from '../../services/advisor/jobHistoryApi';

export default function Estimate() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [items, setItems] = useState([]); // {id, name, code, unitPrice, available, quantity, total}
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [assigned, setAssigned] = useState([]);
  const [selectedAssign, setSelectedAssign] = useState(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) { setSuggestions([]); return; }
      try {
        const { data } = await apiClient.get('/api/parts/search', { params: { query } });
        setSuggestions(data.items.map(p => ({
          id: p._id,
          name: p.name,
          code: p.partCode,
          unitPrice: p.sellingPrice || 0,
          category: p.category || '',
          onHand: p.stock?.onHand || 0,
          reserved: p.stock?.reserved || 0,
          reorder: p.stock?.reorderLevel || 0,
          available: Math.max(0, (p.stock?.onHand || 0) - (p.stock?.reserved || 0)),
          status: p.isActive ? 'In Stock' : 'Inactive'
        })));
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Load assigned jobs list on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get('/api/advisor/estimate/assigned');
        setAssigned(data.items || []);
      } catch {}
    })();
  }, []);

  const addPart = (s) => {
    setItems(prev => {
      if (prev.some(i => i.id === s.id)) return prev; // prevent duplicates
      return [...prev, { ...s, quantity: 1, total: s.unitPrice }];
    });
    setQuery('');
    setSuggestions([]);
  };

  const updateQty = (id, qty) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty, total: Math.max(0, Number(qty) || 0) * Number(i.unitPrice || 0) } : i));
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const grandTotal = useMemo(() => items.reduce((sum, i) => sum + (Number(i.total) || 0), 0), [items]);

  const finalizeAndDeduct = async () => {
    if (items.length === 0) { setMessage('Add at least one part.'); return; }
    try {
      setSaving(true);
      setMessage('');
      // Consume/deduct quantities sequentially (actually deducts from inventory)
      for (const i of items) {
        await apiClient.put(`/api/parts/${i.id}/consume`, { quantity: Number(i.quantity) || 0 });
      }
      setMessage('Estimate saved and inventory updated. Parts have been deducted from stock.');
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to save estimate');
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    try {
      setSaving(true);
      const payload = {
        items: items.map(i => ({ 
          code: i.code, 
          name: i.name, 
          quantity: Number(i.quantity) || 0, 
          unitPrice: Number(i.unitPrice) || 0, 
          total: Number(i.total) || 0 
        })),
        total: Number(grandTotal) || 0,
        notes: message || ''
      };

      const response = await jobHistoryApi.generateCostEstimationPDF(payload);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cost-estimation-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage('Failed to generate PDF');
    } finally {
      setSaving(false);
    }
  };

  const sendToManagers = async () => {
    if (items.length === 0) { setMessage('Add at least one part.'); return; }
    if (!selectedAssign) { setMessage('Please select a job first.'); return; }
    try {
      setSending(true);
      setMessage('');
      const payload = {
        bookingId: selectedAssign.id,
        vehiclePlate: selectedAssign.vehiclePlate,
        serviceType: selectedAssign.jobType,
        laborHours: 2, // Default labor hours - can be made configurable
        items: items.map(i => ({ id: i.id, code: i.code, name: i.name, quantity: Number(i.quantity)||0, unitPrice: Number(i.unitPrice)||0, total: Number(i.total)||0 })),
        total: Number(grandTotal)||0
      };
      await apiClient.post('/api/advisor/estimate/send', payload);
      setMessage('Estimate sent to Staff Manager and Finance Manager with 60% profit margin calculation.');
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to send estimate');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto bg-slate-800 p-6 rounded-lg">
        <h1 className="text-2xl font-semibold text-white mb-4">Cost Estimation</h1>
        {/* Assigned jobs picker */}
        <div className="mb-6">
          <label className="block text-white mb-2">Select Assigned Job</label>
          <div className="flex gap-2 items-center">
            <select
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
              value={selectedAssign?.id || ''}
              onChange={e => {
                const a = assigned.find(x => x.id === e.target.value);
                setSelectedAssign(a || null);
              }}
            >
              <option value="">-- Choose a job --</option>
              {assigned.map(a => (
                <option key={a.id} value={a.id}>{a.jobType} • {a.vehiclePlate} • {a.scheduledFor}</option>
              ))}
            </select>
            <button
              onClick={() => setItems([])}
              className="px-3 py-2 rounded bg-slate-600 hover:bg-slate-500 text-white"
            >
              Clear Parts
            </button>
          </div>
          {selectedAssign && (
            <div className="text-slate-300 text-sm mt-2">Estimated baseline: ${Number(selectedAssign.estimatedCost||0).toFixed(2)}</div>
          )}
        </div>
        {message && (
          <div className={`mb-4 p-3 rounded ${message.includes('fail') ? 'bg-red-900/20 border border-red-500 text-red-400' : 'bg-blue-900/20 border border-blue-500 text-blue-400'}`}>
            {message}
          </div>
        )}

        <div className="mb-6 relative">
          <label className="block text-white mb-2">Search Parts</label>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type part name or code"
            className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-600 rounded max-h-72 overflow-auto shadow-2xl">
              {suggestions.map(s => (
                <button key={s.id} onClick={() => addPart(s)} className="w-full text-left p-3 hover:bg-slate-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{s.name}</span>
                        <span className="text-slate-300 text-xs">{s.code}</span>
                        <span className="px-2 py-0.5 rounded text-xxs bg-slate-900 text-slate-300">{s.category || '—'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-slate-300 text-xs mt-2">
                        <div>On Hand: <span className="text-emerald-400 font-semibold">{s.onHand}</span></div>
                        <div>Reserved: <span className="text-yellow-300 font-semibold">{s.reserved}</span></div>
                        <div>Reorder: <span className="text-red-300 font-semibold">{s.reorder}</span></div>
                      </div>
                      <div className="text-slate-300 text-xs mt-1">Available: <span className="text-blue-300 font-semibold">{s.available}</span> • Status: {s.status}</div>
                    </div>
                    <div className="text-slate-100 font-medium">${Number(s.unitPrice||0).toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-200">
            <thead className="text-slate-300">
              <tr>
                <th className="py-2 text-left">Part</th>
                <th className="py-2 text-left">Unit Price</th>
                <th className="py-2 text-left">Qty</th>
                <th className="py-2 text-left">Total</th>
                <th className="py-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-t border-slate-700">
                  <td className="py-2">{i.name} <span className="text-slate-400">({i.code})</span></td>
                  <td className="py-2">${Number(i.unitPrice||0).toFixed(2)}</td>
                  <td className="py-2">
                    <input type="number" min="1" value={i.quantity}
                      onChange={e => updateQty(i.id, e.target.value)}
                      className="w-24 p-2 bg-slate-700 text-white rounded border border-slate-600" />
                  </td>
                  <td className="py-2">${Number(i.total||0).toFixed(2)}</td>
                  <td className="py-2">
                    <button onClick={() => removeItem(i.id)} className="px-3 py-1 rounded bg-red-600 hover:bg-red-700">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-white text-xl">Cost Service: <span className="font-bold">${Number(grandTotal||0).toFixed(2)}</span></div>
          <div className="flex gap-3">
            <button onClick={finalizeAndDeduct} disabled={saving || items.length===0} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white px-5 py-3 rounded">Save & Deduct</button>
            <button onClick={sendToManagers} disabled={sending || items.length===0} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white px-5 py-3 rounded">Send</button>
            <button onClick={downloadPDF} disabled={items.length===0} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-5 py-3 rounded">Download PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}


