import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Paper, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getInvoices, getCustomers, getCustomerPaymentSummary } from '../api/finance/financeService';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalServiceCost: 0,
    totalProfitAmount: 0,
    totalAdvisorFixedCost: 0,
    totalStaffFixedCost: 0,
    totalCustomerPayment: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [invoicesRes, customersRes, customerPaymentSummaryRes] = await Promise.all([
          getInvoices(),
          getCustomers(),
          getCustomerPaymentSummary()
        ]);

        const invoices = invoicesRes.data.data || [];
        const customers = customersRes.data.data || [];
        const customerPaymentSummary = customerPaymentSummaryRes.data.data || {};
        
        const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

        setStats({
          totalInvoices: invoices.length,
          totalCustomers: customers.length,
          totalRevenue,
          totalServiceCost: customerPaymentSummary.totalServiceCost || 0,
          totalProfitAmount: customerPaymentSummary.totalProfitAmount || 0,
          totalAdvisorFixedCost: customerPaymentSummary.totalAdvisorFixedCost || 0,
          totalStaffFixedCost: customerPaymentSummary.totalStaffFixedCost || 0,
          totalCustomerPayment: customerPaymentSummary.totalCustomerPayment || 0
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
      title: 'Customer Payment Management',
      description: 'Process customer payments with 80% profit margin + fixed costs',
      action: () => navigate('/finance/customer-payment-management'),
      color: 'primary'
    },
    {
      title: 'Service Cost Management',
      description: 'Review and manage service cost estimates',
      action: () => navigate('/finance/service-cost-management'),
      color: 'success'
    },
    {
      title: 'Create Invoice',
      description: 'Generate a new invoice for your customers',
      action: () => navigate('/invoices/new'),
      color: 'warning'
    },
    {
      title: 'View Reports',
      description: 'Analyze your financial data',
      action: () => navigate('/reports'),
      color: 'info'
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
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Invoices
            </Typography>
            <Typography variant="h3" color="primary" fontWeight="bold">
              {stats.totalInvoices}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Customers
            </Typography>
            <Typography variant="h3" color="success.main" fontWeight="bold">
              {stats.totalCustomers}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Service Cost Total
            </Typography>
            <Typography variant="h3" color="info.main" fontWeight="bold">
              ${stats.totalServiceCost.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Profit Amount (80%)
            </Typography>
            <Typography variant="h3" color="warning.main" fontWeight="bold">
              ${stats.totalProfitAmount.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Customer Payment
            </Typography>
            <Typography variant="h3" color="error.main" fontWeight="bold">
              ${stats.totalCustomerPayment.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Fixed Costs Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Advisor Fixed Cost Total
            </Typography>
            <Typography variant="h3" color="primary" fontWeight="bold">
              ${stats.totalAdvisorFixedCost.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              $100 per service
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Staff Fixed Cost Total
            </Typography>
            <Typography variant="h3" color="success.main" fontWeight="bold">
              ${stats.totalStaffFixedCost.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              $60 per service
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
