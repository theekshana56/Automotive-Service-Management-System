import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import api from '../api/client';
import React from 'react';

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const requestData = { email: email.toLowerCase() };
      console.log('Sending request reset with:', requestData);
      const response = await api.post('/api/auth/request-reset', requestData);
      console.log('Request reset response:', response.data);
      setMessage('OTP sent to your email. Redirecting to verification...');
      setTimeout(() => nav(`/verify-otp?email=${encodeURIComponent(email)}`), 2000);
    } catch (e) {
      console.error('Request reset error:', e);
      if (e.response) {
        console.error('Response status:', e.response.status);
        console.error('Response data:', e.response.data);
        setError(e.response.data?.message || `Server error (${e.response.status})`);
      } else if (e.request) {
        console.error('No response received:', e.request);
        setError('Network error. Please check your connection and try again.');
      } else {
        console.error('Request setup error:', e.message);
        setError('Error sending request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">Forgot Password</h1>
      <form onSubmit={submit} className="grid gap-6">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <p className="text-red-600 mb-2">{error}</p>}
        {message && <p className="text-green-600 mb-2">{message}</p>}
        <button className="btn btn-primary mt-2" disabled={loading}>
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </form>
      <p className="text-sm mt-4">
        Remember your password? <Link to="/login" className="text-blue-600">Login</Link>
      </p>
    </div>
  );
}
