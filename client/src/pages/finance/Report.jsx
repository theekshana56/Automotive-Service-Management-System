import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const Report = ({ user }) => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Financial Reports
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Generate and view financial reports and analytics
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          Report Component
        </Typography>
        <Typography variant="body2" color="textSecondary">
          This component will be implemented to show financial reports and analytics.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Report;
