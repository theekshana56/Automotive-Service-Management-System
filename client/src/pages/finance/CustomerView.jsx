import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Paper, Button, Grid, Divider, Chip } from '@mui/material';
import { getCustomers, deleteCustomer } from '../api/financeService';
import { useNavigate, useParams } from 'react-router-dom';

const CustomerView = ({ user, showNotification }) => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError('');
    getCustomers().then(res => {
      const cust = res.data.data.find(c => c._id === id);
      setCustomer(cust);
      setLoading(false);
    }).catch(() => {
      setError('Failed to fetch customer');
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await deleteCustomer(id);
      showNotification('Customer deleted successfully!', 'success');
      navigate('/customers');
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'warning'; // Orange for positive balance
    if (balance < 0) return 'error'; // Red for negative balance
    return 'success'; // Green for zero balance
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading customer...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Customer not found.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Customer Details
        </Typography>
        <Typography variant="body1" color="textSecondary">
          View and manage customer information
        </Typography>
      </Box>

      {/* Main Content */}
      <Paper sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Name
              </Typography>
              <Typography variant="h6">
                {customer.name}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Email
              </Typography>
              <Typography variant="body1">
                {customer.email}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Phone
              </Typography>
              <Typography variant="body1">
                {customer.phone || 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Address
              </Typography>
              <Typography variant="body1">
                {customer.address || 'N/A'}
              </Typography>
            </Box>
          </Grid>

          {/* Financial Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Financial Information
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Current Balance
              </Typography>
              <Chip
                label={`$${customer.balance?.toFixed(2) || '0.00'}`}
                size="medium"
                color={getBalanceColor(customer.balance)}
                sx={{ fontSize: '1.1rem' }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Credit Limit
              </Typography>
              <Typography variant="body1">
                ${customer.creditLimit?.toFixed(2) || '0.00'}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Payment Terms
              </Typography>
              <Typography variant="body1">
                {customer.paymentTerms || 30} days
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Available Credit
              </Typography>
              <Typography variant="body1">
                ${((customer.creditLimit || 0) - (customer.balance || 0)).toFixed(2)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Additional Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Additional Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Customer ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {customer._id}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Created Date
                </Typography>
                <Typography variant="body1">
                  {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/customers')}
          >
            Back
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/customers/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerView;
