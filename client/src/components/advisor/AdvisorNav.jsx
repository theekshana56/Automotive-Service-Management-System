import React from 'react';
import { NavLink } from 'react-router-dom';

export default function AdvisorNav() {
  const base = '/advisor';
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
    }`;

  return (
    <nav className="bg-slate-800/60 border border-slate-700 rounded-xl p-2 flex gap-2">
      <NavLink to="/advisor-dashboard" className={linkClass}>Dashboard</NavLink>
      <NavLink to={`${base}/inspections`} className={linkClass}>Inspections</NavLink>
      <NavLink to={`${base}/assign`} className={linkClass}>Assign Jobs</NavLink>
      <NavLink to={`${base}/estimate`} className={linkClass}>Cost Estimation</NavLink>
    </nav>
  );
}




