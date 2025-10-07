import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import React, { useState } from 'react';

const BACKEND_URL = "";
const LOGO_URL = `/assets/logo.svg`;
const LOCAL_LOGO_URL = 'logo.svg';

export default function Navbar(){
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);
  const [useLocalLogo, setUseLocalLogo] = useState(false);

  const handleLogoError = () => {
    if (!useLocalLogo) {
      setUseLocalLogo(true);
    } else {
      setLogoError(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-white/98 via-[#e8eef9]/80 to-white/98 backdrop-blur-xl border-b border-[#4669f0]/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-3 group">
              {!logoError ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4669f0] to-[#5879f2] rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <img
                    src={useLocalLogo ? LOCAL_LOGO_URL : LOGO_URL}
                    alt="Auto Elite Logo"
                    className="relative w-12 h-12 rounded-2xl shadow-xl border-2 border-white/50 bg-gradient-to-br from-slate-800 to-slate-900 object-cover transform group-hover:scale-105 transition-transform"
                    onError={handleLogoError}
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4669f0] to-[#5879f2] rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-12 h-12 rounded-2xl shadow-xl border-2 border-white/50 bg-gradient-to-br from-[#4669f0] to-[#5879f2] flex items-center justify-center text-white font-bold text-xl transform group-hover:scale-105 transition-transform">
                    AE
                  </div>
                </div>
              )}
              <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#4669f0] via-[#5879f2] to-[#4669f0] bg-clip-text text-transparent tracking-tight drop-shadow-sm">
                Auto Elite
              </span>
            </Link>
          </div>

          {/* Centered navigation links - show on all pages for non-logged-in users */}
          {!user && (
            <nav className="hidden md:flex items-center space-x-2 lg:space-x-3">
              <Link to="/" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200 shadow-sm">
                Home
              </Link>
              <Link to="/services" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200 shadow-sm">
                Services
              </Link>
             <Link to="/find-mechanic" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200 shadow-sm">
                Find a Mechanic
              </Link>
              <Link to="/about" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200 shadow-sm">
                About
              </Link>
              <Link to="/contact" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200 shadow-sm">
                Contact
              </Link>
            </nav>
          )}

          {/* Right side - Auth buttons and navigation */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <>
                {/* Role-based navigation - show on all pages */}
                <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
                    {user.role === 'user' && (
                      <>
                        <Link to="/book" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Book</Link>
                        <Link to="/bookings" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">My Bookings</Link>
                        <Link to="/available-slots" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Slots</Link>
                        <Link to="/profile" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Profile</Link>
                      </>
                    )}
                    {(user.role === 'manager' || user.role === 'admin') && (
                      <>
                        <Link to="/advisor-management" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Advisors</Link>
                        <Link to="/bookings-management" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Bookings</Link>
                      </>
                    )}
                    {user.role === 'advisor' && (
                      <>
                        <Link to="/advisor-dashboard" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Dashboard</Link>
                        <Link to="/advisor/inspections" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Inspections</Link>
                        <Link to="/advisor/assign" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Assign</Link>
                        <Link to="/advisor/estimate" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Estimate</Link>
                        <Link to="/advisor/history" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">History</Link>
                      </>
                    )}
                    {user.role === 'mechanic' && (
                      <>
                        <Link to="/mechanic/dashboard" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Dashboard</Link>
                        
                      </>
                    )}
                    {user.role === 'admin' && <Link to="/admin-dashboard" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Admin</Link>}
                    {user.role === 'finance_manager' && <Link to="/finance-dashboard" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Finance</Link>}
                    {user.role === 'inventory_manager' && (
                      <>
                        <Link to="/inventory-dashboard" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Inventory</Link>
                        <Link to="/parts" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Parts</Link>
                        <Link to="/suppliers" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Suppliers</Link>
                        <Link to="/purchase-orders" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">POs</Link>
                        <Link to="/low-stock" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Low Stock</Link>
                        <Link to="/inventory/audit" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Audit</Link>
                      </>
                    )}
                    {user.role === 'staff_manager' && <Link to="/staff-dashboard" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Staff</Link>}
                    {(user.role === 'hr_manager' || user.role === 'admin') && <Link to="/hr" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">HR</Link>}
                    {(user.role === 'manager' || user.role === 'admin') && <Link to="/audit-logs" className="px-4 py-2 rounded-xl text-sm lg:text-base font-bold text-blue-700 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] transition-all duration-200">Audit</Link>}
                  </div>

                {/* User info and logout */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-[#4669f0]/20 shadow-lg hover:shadow-xl transition-all">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#4669f0] to-[#5879f2] rounded-full blur opacity-30"></div>
                      <img
                        src={user.avatarUrl ? `${user.avatarUrl}` : 'logo.svg'}
                        alt="avatar"
                        className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-[#4669f0]/30 shadow-md"
                      />
                    </div>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm truncate max-w-20 sm:max-w-32">
                      {user.name}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-[#4669f0] to-[#5879f2] text-white rounded-xl hover:from-[#5879f2] hover:to-[#4669f0] shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-sm font-bold text-blue-800 hover:text-white hover:bg-gradient-to-r hover:from-[#4669f0] hover:to-[#5879f2] rounded-xl transition-all duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-[#5f89a5] to-[#5879f2] text-white rounded-xl hover:from-[#5879f2] hover:to-[#4669f0] shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
