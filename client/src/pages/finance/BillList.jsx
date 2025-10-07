import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const BillList = ({ user }) => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Bills
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your vendor bills and expenses
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          Bill List Component
        </Typography>
        <Typography variant="body2" color="textSecondary">
          This component will be implemented to show a list of bills with filtering and pagination.
        </Typography>
      </Paper>
    </Container>
  );
};

export default BillList;
