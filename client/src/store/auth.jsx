import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

// 1. Create Auth Context
const AuthCtx = createContext(null);

// 2. Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // logged in user data
  const [loading, setLoading] = useState(true);

  // Handle auth errors from API interceptor
  useEffect(() => {
    const handleAuthError = (event) => {
      if (event.detail?.status === 401) {
        setUser(null);
        setLoading(false);
      }
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  // Try auto-login (check localStorage for saved user + token)
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Verify the user is still authenticated
  api.get('/api/auth/me')
          .then(response => {
            setUser(response.data.user);
            localStorage.setItem("user", JSON.stringify(response.data.user));
          })
          .catch(() => {
            // If verification fails, clear the user
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        // If JSON parsing fails, clear invalid data
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    // Note: Backend handles token storage via cookies
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Call backend logout
    api.post('/api/auth/logout').catch(() => {}); // Ignore errors
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    hasRole,
    loading,
    isAuthenticated: !!user,
  };

  // ✅ Show loader until auth check finishes
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-gray-700">
        Loading...
      </div>
    );
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// 3. Custom hook to use Auth Context
export const useAuth = () => useContext(AuthCtx);
