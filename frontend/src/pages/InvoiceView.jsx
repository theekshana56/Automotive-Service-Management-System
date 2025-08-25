import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Paper, Button, Grid, Divider, Chip } from '@mui/material';
import { getInvoices, deleteInvoice } from '../api/financeService';
import { useNavigate, useParams } from 'react-router-dom';

const InvoiceView = ({ user, showNotification }) => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError('');
    getInvoices().then(res => {
      const inv = res.data.data.find(i => i._id === id);
      setInvoice(inv);
      setLoading(false);
    }).catch(() => {
      setError('Failed to fetch invoice');
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await deleteInvoice(id);
      showNotification('Invoice deleted successfully!', 'success');
      navigate('/invoices');
    } catch (err) {
      setError('Failed to delete invoice');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': return 'primary';
      case 'overdue': return 'warning';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading invoice...
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

  if (!invoice) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Invoice not found.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Invoice Details
        </Typography>
        <Typography variant="body1" color="textSecondary">
          View and manage invoice information
        </Typography>
      </Box>

      {/* Main Content */}
      <Paper sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* Invoice Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Invoice Information
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Invoice Number
              </Typography>
              <Typography variant="h6">
                {invoice.invoiceNumber}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Status
              </Typography>
              <Chip
                label={invoice.status || 'draft'}
                size="small"
                color={getStatusColor(invoice.status)}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Date
              </Typography>
              <Typography variant="body1">
                {invoice.date ? invoice.date.slice(0, 10) : ''}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Due Date
              </Typography>
              <Typography variant="body1">
                {invoice.dueDate ? invoice.dueDate.slice(0, 10) : ''}
              </Typography>
            </Box>
          </Grid>

          {/* Customer Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Customer Name
              </Typography>
              <Typography variant="body1">
                {invoice.customer?.name || 'Unknown Customer'}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Email
              </Typography>
              <Typography variant="body1">
                {invoice.customer?.email || 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Phone
              </Typography>
              <Typography variant="body1">
                {invoice.customer?.phone || 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Items */}
        <Typography variant="h6" gutterBottom>
          Invoice Items
        </Typography>

        <Box sx={{ mb: 4 }}>
          {invoice.items && invoice.items.length > 0 ? (
            <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 3 }}>
              {invoice.items.map((item, index) => (
                <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < invoice.items.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {item.description}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="body2" color="textSecondary">
                        Quantity
                      </Typography>
                      <Typography variant="body1">
                        {item.quantity}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="body2" color="textSecondary">
                        Unit Price
                      </Typography>
                      <Typography variant="body1">
                        ${item.unitPrice?.toFixed(2) || '0.00'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="body2" color="textSecondary">
                        Amount
                      </Typography>
                      <Typography variant="body1">
                        ${item.amount?.toFixed(2) || '0.00'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'textSecondary' }}>
              No items found
            </Typography>
          )}
        </Box>

        {/* Total */}
        <Box sx={{ mb: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h5" sx={{ textAlign: 'right' }}>
            Total: ${invoice.totalAmount?.toFixed(2) || '0.00'}
          </Typography>
        </Box>

        {/* Notes */}
        {invoice.notes && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body1">
                {invoice.notes}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/invoices')}
          >
            Back
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/invoices/${id}/edit`)}
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

export default InvoiceView;
