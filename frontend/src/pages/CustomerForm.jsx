import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, Grid } from '@mui/material';
import { createCustomer, updateCustomer, getCustomers } from '../api/financeService';
import { useNavigate, useParams } from 'react-router-dom';

const CustomerForm = ({ user, showNotification }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    creditLimit: 0,
    paymentTerms: 30
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const fetchCustomer = async () => {
        try {
          const res = await getCustomers();
          const customer = res.data.data.find(cust => cust._id === id);
          if (customer) {
            setForm({
              name: customer.name || '',
              email: customer.email || '',
              phone: customer.phone || '',
              address: customer.address || '',
              creditLimit: customer.creditLimit || 0,
              paymentTerms: customer.paymentTerms || 30
            });
          }
        } catch (err) {
          console.error('Error fetching customer:', err);
        }
      };
      fetchCustomer();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const customerData = {
        ...form,
        creditLimit: parseFloat(form.creditLimit) || 0,
        paymentTerms: parseInt(form.paymentTerms) || 30
      };

      if (isEdit) {
        await updateCustomer(id, customerData);
        showNotification('Customer updated successfully!', 'success');
      } else {
        await createCustomer(customerData);
        showNotification('Customer created successfully!', 'success');
      }

      navigate('/customers');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Edit Customer' : 'Add Customer'}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {isEdit ? 'Update customer information' : 'Add a new customer to your database'}
        </Typography>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Credit Limit"
                name="creditLimit"
                type="number"
                value={form.creditLimit}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Payment Terms (days)"
                name="paymentTerms"
                type="number"
                value={form.paymentTerms}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>

          {/* Actions */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/customers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Customer' : 'Add Customer')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CustomerForm;
