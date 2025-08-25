import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Alert, Snackbar } from '@mui/material';

// Import pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceView from './pages/InvoiceView';
import CustomerBalance from './pages/CustomerBalance';
import BillList from './pages/BillList';
import PaymentForm from './pages/PaymentForm';
import VendorList from './pages/VendorList';
import Report from './pages/Report';
import AuditLog from './pages/AuditLog';
import CustomerList from './pages/CustomerList';
import CustomerForm from './pages/CustomerForm';
import CustomerView from './pages/CustomerView';
import VehicleForm from './pages/VehicleForm';

// Import components
import Navigation from './components/Navigation';

// Import services
import { authService } from './api/authService';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      authService.validateToken(token)
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('token', userData.token);
    showNotification('Login successful!', 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    showNotification('Logged out successfully', 'info');
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          Loading...
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {user && <Navigation user={user} onLogout={handleLogout} />}
          
          <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
            <Routes>
              <Route 
                path="/login" 
                element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
              />
              <Route 
                path="/dashboard" 
                element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/invoices" 
                element={user ? <InvoiceList user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/invoices/new" 
                element={user ? <InvoiceForm user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/invoices/:id" 
                element={user ? <InvoiceView user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/invoices/:id/edit" 
                element={user ? <InvoiceForm user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/customers/balance" 
                element={user ? <CustomerBalance user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/customers" 
                element={user ? <CustomerList user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/customers/new" 
                element={user ? <CustomerForm user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/customers/:id" 
                element={user ? <CustomerView user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/customers/:id/edit" 
                element={user ? <CustomerForm user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/vehicles/new" 
                element={user ? <VehicleForm user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/vehicles/:id/edit" 
                element={user ? <VehicleForm user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/bills" 
                element={user ? <BillList user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/payments/new" 
                element={user ? <PaymentForm user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/vendors" 
                element={user ? <VendorList user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/reports" 
                element={user ? <Report user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/audit" 
                element={user ? <AuditLog user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/" 
                element={<Navigate to={user ? "/dashboard" : "/login"} />} 
              />
            </Routes>
          </Container>
        </Box>
      </Router>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
