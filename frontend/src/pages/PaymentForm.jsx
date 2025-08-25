import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const PaymentForm = ({ user }) => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Record Payment
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Record customer payments and manage cash flow
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          Payment Form Component
        </Typography>
        <Typography variant="body2" color="textSecondary">
          This component will be implemented to record customer payments.
        </Typography>
      </Paper>
    </Container>
  );
};

export default PaymentForm;
