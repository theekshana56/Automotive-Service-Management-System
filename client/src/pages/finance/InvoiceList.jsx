import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import { getInvoices, deleteInvoice } from '../api/financeService';
import { useNavigate } from 'react-router-dom';

const InvoiceList = ({ user }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getInvoices();
      setInvoices(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await deleteInvoice(id);
      setInvoices(invoices.filter(inv => inv._id !== id));
      setError('');
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Invoices
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your invoices and track payments
        </Typography>
      </Box>

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        {loading ? (
          <Typography sx={{ textAlign: 'center', py: 4 }}>
            Loading invoices...
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle no</TableCell>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv._id}>
                    <TableCell>
                      {inv.vehicle?.number || 'Unknown Vehicle'}
                    </TableCell>
                    <TableCell>
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {inv.date ? inv.date.slice(0, 10) : ''}
                    </TableCell>
                    <TableCell>
                      {inv.dueDate ? inv.dueDate.slice(0, 10) : ''}
                    </TableCell>
                    <TableCell>
                      ${inv.totalAmount?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={inv.status || 'draft'}
                        size="small"
                        color={getStatusColor(inv.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/invoices/${inv._id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate(`/invoices/${inv._id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(inv._id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/invoices/new')}
          >
            Create Invoice
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default InvoiceList;
