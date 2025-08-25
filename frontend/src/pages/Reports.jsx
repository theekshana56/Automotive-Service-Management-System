import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper, Grid, Card, CardContent, Button } from '@mui/material';
import { getInvoices, getCustomers } from '../api/financeService';

const Reports = ({ user }) => {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    outstandingAmount: 0,
    paidAmount: 0,
    overdueAmount: 0
  });
  const [loading, setLoading] = useState(true);

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
        const paidAmount = invoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const outstandingAmount = invoices
          .filter(inv => inv.status === 'sent')
          .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const overdueAmount = invoices
          .filter(inv => inv.status === 'overdue')
          .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

        setStats({
          totalInvoices: invoices.length,
          totalCustomers: customers.length,
          totalRevenue,
          outstandingAmount,
          paidAmount,
          overdueAmount
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const reportCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      color: 'success',
      description: 'Total revenue from all invoices'
    },
    {
      title: 'Outstanding Amount',
      value: `$${stats.outstandingAmount.toFixed(2)}`,
      color: 'warning',
      description: 'Amount pending payment'
    },
    {
      title: 'Paid Amount',
      value: `$${stats.paidAmount.toFixed(2)}`,
      color: 'primary',
      description: 'Total amount received'
    },
    {
      title: 'Overdue Amount',
      value: `$${stats.overdueAmount.toFixed(2)}`,
      color: 'error',
      description: 'Amount past due date'
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices.toString(),
      color: 'secondary',
      description: 'Total number of invoices'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toString(),
      color: 'info',
      description: 'Total number of customers'
    }
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading reports...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Financial Reports
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Comprehensive overview of your financial performance
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {reportCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h4" color={`${card.color}.main`} fontWeight="bold" gutterBottom>
                  {card.value}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detailed Reports */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Detailed Analysis
        </Typography>

        <Grid container spacing={4}>
          {/* Revenue Analysis */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Revenue Analysis
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Collection Rate
                </Typography>
                <Typography variant="h6" color="success.main">
                  {stats.totalRevenue > 0 ? ((stats.paidAmount / stats.totalRevenue) * 100).toFixed(1) : 0}%
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Outstanding Rate
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {stats.totalRevenue > 0 ? ((stats.outstandingAmount / stats.totalRevenue) * 100).toFixed(1) : 0}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Overdue Rate
                </Typography>
                <Typography variant="h6" color="error.main">
                  {stats.totalRevenue > 0 ? ((stats.overdueAmount / stats.totalRevenue) * 100).toFixed(1) : 0}%
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Average Invoice Value
                </Typography>
                <Typography variant="h6" color="primary.main">
                  ${stats.totalInvoices > 0 ? (stats.totalRevenue / stats.totalInvoices).toFixed(2) : '0.00'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Revenue per Customer
                </Typography>
                <Typography variant="h6" color="secondary.main">
                  ${stats.totalCustomers > 0 ? (stats.totalRevenue / stats.totalCustomers).toFixed(2) : '0.00'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Invoices per Customer
                </Typography>
                <Typography variant="h6" color="info.main">
                  {stats.totalCustomers > 0 ? (stats.totalInvoices / stats.totalCustomers).toFixed(1) : '0.0'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            color="primary"
          >
            Export Report
          </Button>
          <Button
            variant="outlined"
            color="success"
          >
            Generate PDF
          </Button>
          <Button
            variant="outlined"
            color="warning"
          >
            Send Report
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Reports;
