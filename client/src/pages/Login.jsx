import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import { useAuth } from '../store/auth';
import api from '../api/client';
import React from 'react';

export default function Login(){
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email:'', password:'' });
  const [err,setErr] = useState('');

  const submit = async (e)=>{
    e.preventDefault();
    setErr('');
    try{
      const response = await api.post('/api/auth/login', form);
      login(response.data.user);
      const role = response.data.user.role;
      if (role === 'inventory_manager') {
        nav('/inventory-dashboard');
      } else if (role === 'admin') {
        nav('/admin-dashboard');
      } else if (role === 'finance_manager') {
        nav('/finance-dashboard');
      } else if (role === 'staff_manager') {
        nav('/staff-dashboard');
      } else if (role === 'hr_manager') {
        nav('/hr');
      } else if (role === 'manager') {
        nav('/advisor-management');
      } else if (role === 'advisor') {
        nav('/advisor-dashboard');
        } else if (role === 'mechanic') {
        nav('/mechanic/dashboard');
      } else {
        nav('/book');
      }
    } catch(e) {
      setErr(e.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">Login</h1>
      <form onSubmit={submit} className="grid gap-6">
        <Input label="Email" type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required />
        <Input label="Password" type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required />
        {err && <p className="text-red-600 mb-2">{err}</p>}
        <button className="btn btn-primary mt-2">Login</button>
      </form>

      <p className="text-sm mt-4">
        No account? <Link to="/register" className="text-blue-600">Register</Link> | <Link to="/forgot-password" className="text-blue-600">Forgot Password?</Link>
      </p>

      <p className="text-sm mt-4">No account? <Link to="/register" className="text-blue-600">Register</Link></p>

    </div>
  );
}
