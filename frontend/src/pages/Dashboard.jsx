import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Paper, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getInvoices, getCustomers } from '../api/financeService';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalCustomers: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [invoicesRes, customersRes] = await Promise.all([
          getInvoices(),
          getCustomers()
        ]);

        const invoices = invoicesRes.data.data || [];
        const customers = customersRes.data.data || [];
        
        const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

        setStats({
          totalInvoices: invoices.length,
          totalCustomers: customers.length,
          totalRevenue
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'Create Invoice',
      description: 'Generate a new invoice for your customers',
      action: () => navigate('/invoices/new'),
      color: 'primary'
    },
    {
      title: 'Add Customer',
      description: 'Add a new customer to your database',
      action: () => navigate('/customers/new'),
      color: 'success'
    },
    {
      title: 'View Reports',
      description: 'Analyze your financial data',
      action: () => navigate('/reports'),
      color: 'warning'
    },
    {
      title: 'Manage Bills',
      description: 'Track your expenses and bills',
      action: () => navigate('/bills'),
      color: 'secondary'
    }
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading Dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Finance Manager
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Welcome back, {user?.name || 'User'}
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Invoices
            </Typography>
            <Typography variant="h3" color="primary" fontWeight="bold">
              {stats.totalInvoices}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Customers
            </Typography>
            <Typography variant="h3" color="success.main" fontWeight="bold">
              {stats.totalCustomers}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Revenue
            </Typography>
            <Typography variant="h3" color="warning.main" fontWeight="bold">
              ${stats.totalRevenue.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h6" color={`${action.color}.main`} gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  {action.description}
                </Typography>
                <Button
                  variant="contained"
                  color={action.color}
                  onClick={action.action}
                  fullWidth
                >
                  {action.title}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Dashboard;
