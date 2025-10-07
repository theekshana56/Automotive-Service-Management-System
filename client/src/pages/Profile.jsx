import { useEffect, useState } from 'react';
import api from '../api/client';
import Input from '../components/Input';
import { useAuth } from '../store/auth';
import React from 'react';

const BACKEND_URL = "";

export default function Profile(){
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    setName(user?.name||'');
    setPhone(user?.phone||'');
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { data } = await api.put('/users/me', { name, phone });
    setUser(data.user);
    setSaving(false);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const form = new FormData();
    form.append('avatar', file);
    setUploading(true);
    try{
      const { data } = await api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' }});
      setUser(data.user);
    } finally { setUploading(false); }
  };

  return (
    <div className="max-w-xl mx-auto card p-6">
      <h1 className="text-2xl font-semibold mb-6 section-title">My Profile</h1>
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <img
          src={user?.avatarUrl ? `${user.avatarUrl}` : 'logo.svg'}
          alt="avatar"
          className="w-24 h-24 rounded-2xl object-cover border"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'logo.svg';
            if (e.target.src.includes('logo.svg')) {
              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="%23007BFF"/><text x="50%" y="50%" font-size="24" text-anchor="middle" dy=".3em" fill="white">AE</text></svg>';
            }
          }}
        />
        <label className="btn cursor-pointer mt-4 sm:mt-0">
          {uploading ? 'Uploading...' : 'Change Photo'}
          <input type="file" accept="image/*" onChange={onFile} hidden />
        </label>
      </div>

      <form onSubmit={save}>
        <Input label="Name" value={name} onChange={e=>setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} />
        <Input label="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
        <button className="btn bg-gradient-to-r from-primary to-accent2 text-slate-900 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:from-accent2 hover:to-primary mt-4" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
