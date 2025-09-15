import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Input from '../components/Input';
import React from 'react';

export default function Register(){
  const nav = useNavigate();
  const [form,setForm] = useState({ name:'', email:'', password:'', confirmPassword:'' });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [err,setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErr('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErr('Image file size must be less than 5MB');
        return;
      }
      
      setAvatar(file);
      setErr(''); // Clear any previous errors
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
  };

  const submit = async (e)=>{
    e.preventDefault();
    setErr('');
    
    // Validate password confirmation
    if (form.password !== form.confirmPassword) {
      setErr('Passwords do not match');
      return;
    }
    
    if (form.password.length < 6) {
      setErr('Password must be at least 6 characters long');
      return;
    }
    
    setSubmitting(true);
    try{
      const data = new FormData();
      data.append('name', form.name);
      data.append('email', form.email);
      data.append('password', form.password);
      if (avatar) data.append('avatar', avatar);
  await api.post('/api/auth/register', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      nav('/login');
    }catch(e){ 
      setErr(e.response?.data?.message || 'Registration failed'); 
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">Register</h1>
      <form onSubmit={submit} className="grid gap-6">
        <Input label="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} required />
        <Input label="Email" type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required />
        <Input label="Password" type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required />
        <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={e=>setForm({...form, confirmPassword: e.target.value})} required />
        
        {/* Avatar Upload Section */}
        <div className="space-y-3">
          <label className="label">Profile Image (Optional)</label>
          <div className="flex items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative">
              {avatarPreview ? (
                <div className="relative">
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                  />
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center">
                  <span className="text-2xl text-muted">👤</span>
                </div>
              )}
            </div>
            
            {/* File Input */}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-input"
              />
              <label 
                htmlFor="avatar-input"
                className="btn-secondary cursor-pointer inline-flex items-center gap-2"
              >
                📷 {avatar ? 'Change Image' : 'Upload Image'}
              </label>
              <p className="text-xs text-muted mt-1">
                JPG, PNG, GIF up to 5MB
              </p>
            </div>
          </div>
        </div>
        
        {err && <p className="text-red-400 mb-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{err}</p>}
        <button className="btn-primary mt-2" disabled={submitting}>
          {submitting ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="text-sm mt-4 text-muted">Already have an account? <Link to="/login" className="text-primary hover:text-primary/80 transition-colors">Login</Link></p>
    </div>
  );
}
