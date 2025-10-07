import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import { getCustomers, deleteCustomer } from '../api/financeService';
import { useNavigate } from 'react-router-dom';

const CustomerList = ({ user }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getCustomers();
      setCustomers(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await deleteCustomer(id);
      setCustomers(customers.filter(cust => cust._id !== id));
      setError('');
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'warning'; // Orange for positive balance
    if (balance < 0) return 'error'; // Red for negative balance
    return 'success'; // Green for zero balance
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Customers
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your customer database and track balances
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
            Loading customers...
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Credit Limit</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map(customer => (
                  <TableRow key={customer._id}>
                    <TableCell>
                      {customer.name}
                    </TableCell>
                    <TableCell>
                      {customer.email}
                    </TableCell>
                    <TableCell>
                      {customer.phone}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`$${customer.balance?.toFixed(2) || '0.00'}`}
                        size="small"
                        color={getBalanceColor(customer.balance)}
                      />
                    </TableCell>
                    <TableCell>
                      ${customer.creditLimit?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/customers/${customer._id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate(`/customers/${customer._id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(customer._id)}
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
            {customers.length} customer{customers.length !== 1 ? 's' : ''} found
          </Typography>
          <Button
            variant="contained"
            color="success"
            onClick={() => navigate('/customers/new')}
          >
            Add Customer
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerList;
