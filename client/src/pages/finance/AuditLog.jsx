import React from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AuditLog = ({ user }) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'white', mb: 1 }}>
          Audit Log
        </Typography>
        <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
          Track system activities and user actions
        </Typography>
      </Box>

      {/* Main Content */}
      <Paper sx={{ 
        p: 6, 
        bgcolor: '#2d2d2d', 
        color: 'white',
        border: '1px solid #404040',
        textAlign: 'center'
      }}>
        <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
          Audit Log Coming Soon
        </Typography>
        <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 4 }}>
          This feature is currently under development. You'll be able to:
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 2 }}>
          • Track user activities
          </Typography>
          <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 2 }}>
          • Monitor system changes
          </Typography>
          <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 2 }}>
          • Generate audit reports
          </Typography>
          <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 2 }}>
          • Maintain compliance records
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
          sx={{
            bgcolor: '#1976d2',
            color: 'white',
            '&:hover': {
              bgcolor: '#1976d2',
              opacity: 0.8
            }
          }}
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Container>
  );
};

export default AuditLog;
