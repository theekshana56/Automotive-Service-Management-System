import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, IconButton, Select, MenuItem, FormControl, InputLabel, Grid, Divider } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { createInvoice, updateInvoice, getInvoices, getCustomers } from '../api/financeService';
import { useNavigate, useParams } from 'react-router-dom';

const InvoiceForm = ({ user, showNotification }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const emptyItem = {
    description: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0
  };

  const [form, setForm] = useState({
    invoiceNumber: '',
    customer: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    items: [{ ...emptyItem }],
    status: 'draft',
    notes: ''
  });

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await getCustomers();
        setCustomers(res.data.data || []);
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const fetchInvoice = async () => {
        try {
          const res = await getInvoices();
          const invoice = res.data.data.find(inv => inv._id === id);
          if (invoice) {
            setForm({
              invoiceNumber: invoice.invoiceNumber || '',
              customer: invoice.customer?._id || invoice.customer || '',
              date: invoice.date ? invoice.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
              dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : '',
              items: invoice.items?.length > 0 ? invoice.items : [{ ...emptyItem }],
              status: invoice.status || 'draft',
              notes: invoice.notes || ''
            });
          }
        } catch (err) {
          console.error('Error fetching invoice:', err);
        }
      };
      fetchInvoice();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };

    // Calculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }

    setForm(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }]
    }));
  };

  const removeItem = (index) => {
    if (form.items.length > 1) {
      setForm(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    // If address is an object
    const { street, city, state, zipCode, country } = address;
    return [street, city, state, zipCode, country].filter(Boolean).join(', ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const invoiceData = {
        ...form,
        totalAmount: calculateTotal()
      };

      if (isEdit) {
        await updateInvoice(id, invoiceData);
        showNotification('Invoice updated successfully!', 'success');
      } else {
        await createInvoice(invoiceData);
        showNotification('Invoice created successfully!', 'success');
      }

      navigate('/invoices');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Edit Invoice' : 'Create Invoice'}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {isEdit ? 'Update invoice details' : 'Generate a new invoice for your customer'}
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
                label="Invoice Number"
                name="invoiceNumber"
                value={form.invoiceNumber}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customer"
                  value={form.customer}
                  onChange={handleChange}
                >
                  {customers.map(customer => (
                    <MenuItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Show customer address if selected */}
              {(() => {
                const selectedCustomer = customers.find(c => c._id === form.customer);
                if (selectedCustomer && selectedCustomer.address) {
                  return (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Address: {formatAddress(selectedCustomer.address)}
                    </Typography>
                  );
                }
                return null;
              })()}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Items Section */}
          <Typography variant="h6" gutterBottom>
            Invoice Items
          </Typography>

          {form.items.map((item, index) => (
            <Box key={index} sx={{ mb: 3, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Unit Price"
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Amount"
                    value={`$${item.amount?.toFixed(2) || '0.00'}`}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <IconButton
                    onClick={() => removeItem(index)}
                    disabled={form.items.length === 1}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={addItem}
            variant="outlined"
            color="primary"
          >
            Add Item
          </Button>

          <Divider sx={{ my: 4 }} />

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>

          {/* Total */}
          <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ textAlign: 'right' }}>
              Total: ${calculateTotal().toFixed(2)}
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/invoices')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Invoice' : 'Create Invoice')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default InvoiceForm;
