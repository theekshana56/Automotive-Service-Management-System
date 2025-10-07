import React, { useState } from 'react';
import { initializeCapital } from '../api/finance/financeService';

const CapitalInitialization = ({ onInitialized }) => {
  const [amount, setAmount] = useState(500000); // Default amount as requested
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please enter a valid capital amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await initializeCapital(amount);
      onInitialized();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize capital');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Initialize Capital</h2>
        <p className="text-gray-600 mb-6">
          Set up the initial capital amount for your business. This will be used to track available funds for purchase orders.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Capital Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary/50"
              placeholder="Enter capital amount"
              min="0"
              step="0.01"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Initialize Capital'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CapitalInitialization;
