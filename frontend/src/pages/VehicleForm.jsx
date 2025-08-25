import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { createVehicle, updateVehicle, getVehicles, getCustomers } from '../api/financeService';
import { useNavigate, useParams } from 'react-router-dom';

const VehicleForm = ({ user }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    licensePlate: '',
    color: '',
    mileage: '',
    customer: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    // Fetch customers for dropdown
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
      getVehicles().then(res => {
        const vehicle = res.data.data.find(v => v._id === id);
        if (vehicle) {
          setForm({
            make: vehicle.make || '',
            model: vehicle.model || '',
            year: vehicle.year || new Date().getFullYear(),
            vin: vehicle.vin || '',
            licensePlate: vehicle.licensePlate || '',
            color: vehicle.color || '',
            mileage: vehicle.mileage || '',
            customer: vehicle.customer || ''
          });
        }
      });
    }
  }, [id, isEdit]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await updateVehicle(id, form);
      } else {
        await createVehicle(form);
      }
      navigate('/vehicles');
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Edit Vehicle' : 'Create Vehicle'}
        </Typography>
      </Box>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Make"
            name="make"
            value={form.make}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Model"
            name="model"
            value={form.model}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Year"
            name="year"
            type="number"
            value={form.year}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="VIN"
            name="vin"
            value={form.vin}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="License Plate"
            name="licensePlate"
            value={form.licensePlate}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Color"
            name="color"
            value={form.color}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Mileage"
            name="mileage"
            type="number"
            value={form.mileage}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Customer</InputLabel>
            <Select
              name="customer"
              value={form.customer}
              onChange={handleChange}
              label="Customer"
            >
              {customers.map(cust => (
                <MenuItem key={cust._id} value={cust._id}>
                  {cust.name} ({cust.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {error && <Typography color="error">{error}</Typography>}
          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {isEdit ? 'Update Vehicle' : 'Create Vehicle'}
            </Button>
            <Button sx={{ ml: 2 }} onClick={() => navigate('/vehicles')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default VehicleForm;
