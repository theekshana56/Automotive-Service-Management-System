import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const VendorList = ({ user }) => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Vendors
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your vendor relationships and information
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          Vendor List Component
        </Typography>
        <Typography variant="body2" color="textSecondary">
          This component will be implemented to show a list of vendors with management capabilities.
        </Typography>
      </Paper>
    </Container>
  );
};

export default VendorList;
