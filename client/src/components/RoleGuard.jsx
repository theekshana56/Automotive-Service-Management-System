import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import React from 'react';

export default function RoleGuard({ roles, children }){
  const { user, loading } = useAuth();

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Ensure roles is an array
  if (!Array.isArray(roles)) {
    console.warn('RoleGuard: roles prop must be an array');
    return <Navigate to="/" replace />;
  }

  // Check if user has the required role
  if (!user || !user.role || !roles.includes(user.role)) {
    console.warn('RoleGuard: Access denied - user:', user, 'required roles:', roles);
    return <Navigate to="/" replace />;
  }

  return children;
}
