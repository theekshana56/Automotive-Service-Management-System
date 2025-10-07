import React, { useState, useEffect } from 'react';
import { createPartUsageLog } from '../../services/inventoty/api';
import api from '../../api/client';

export default function PartUsageLogForm({ onSuccess }) {
  const [parts, setParts] = useState([]);
  const [partId, setPartId] = useState('');
  const [quantityUsed, setQuantityUsed] = useState(1);
  const [jobId, setJobId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch parts for dropdown
    async function fetchParts() {
      try {
        const res = await api.get('/api/parts?isActive=true&limit=100');
        setParts(res.data.items || res.data.parts || []);
      } catch (err) {
        setError('Failed to load parts list');
      }
    }
    fetchParts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await createPartUsageLog({ partId, quantityUsed, jobId, note });
      setSuccess('Usage logged successfully!');
      setPartId('');
      setQuantityUsed(1);
      setJobId('');
      setNote('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to log usage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Log Part Usage</h2>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {success && <div className="mb-2 text-green-600">{success}</div>}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Part</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={partId}
          onChange={e => setPartId(e.target.value)}
          required
        >
          <option value="">Select a part</option>
          {parts.map(part => (
            <option key={part._id} value={part._id}>
              {part.name} ({part.partCode})
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Quantity Used</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          min={1}
          value={quantityUsed}
          onChange={e => setQuantityUsed(Number(e.target.value))}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Job ID (optional)</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={jobId}
          onChange={e => setJobId(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Note (optional)</label>
        <textarea
          className="w-full border rounded px-3 py-2"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={loading}
      >
        {loading ? 'Logging...' : 'Log Usage'}
      </button>
    </form>
  );
}
