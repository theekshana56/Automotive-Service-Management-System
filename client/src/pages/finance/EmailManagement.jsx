import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
  CheckCircle as SentIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import {
  getEmailStatus,
  sendBulkInvoiceEmails,
  sendBulkSalaryNotificationEmails
} from '../../api/finance/financeService';

const EmailManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState({
    invoice: { total: 0, sent: 0, pending: 0, sentPercentage: 0 },
    payment: { total: 0, sent: 0, pending: 0, sentPercentage: 0 }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [bulkData, setBulkData] = useState({
    emailType: 'invoice',
    selectedIds: [],
    allSelected: false
  });
  const [bulkResults, setBulkResults] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadEmailStatus();
  }, []);

  const loadEmailStatus = async () => {
    try {
      setLoading(true);
      setError('');

      const [invoiceStatus, paymentStatus] = await Promise.all([
        getEmailStatus({ type: 'invoice' }),
        getEmailStatus({ type: 'payment' })
      ]);

      setEmailStatus({
        invoice: invoiceStatus.data.data,
        payment: paymentStatus.data.data
      });
    } catch (err) {
      console.error('Error loading email status:', err);
      setError('Failed to load email status');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSend = async () => {
    try {
      setSending(true);
      setError('');

      let result;
      if (bulkData.emailType === 'invoice') {
        result = await sendBulkInvoiceEmails({ invoiceIds: bulkData.selectedIds });
      } else {
        result = await sendBulkSalaryNotificationEmails({ salaryIds: bulkData.selectedIds });
      }

      setBulkResults(result.data.results || []);
      await loadEmailStatus();
    } catch (err) {
      setError('Failed to send bulk emails');
    } finally {
      setSending(false);
    }
  };

  const openDialog = (type) => {
    setDialogType(type);
    setDialogOpen(true);
    setBulkData({
      emailType: type,
      selectedIds: [],
      allSelected: false
    });
    setBulkResults([]);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setBulkData({
      emailType: '',
      selectedIds: [],
      allSelected: false
    });
    setBulkResults([]);
  };

  const StatCard = ({ title, total, sent, pending, percentage, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" color={color}>
              {sent}/{total}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {pending} pending ({percentage}% sent)
            </Typography>
          </Box>
          <Box color={color}>
            <EmailIcon sx={{ fontSize: 40 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Email Management
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Send invoices, receipts, and salary notifications to customers and staff
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Email Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Invoice Emails"
            total={emailStatus.invoice.total}
            sent={emailStatus.invoice.sent}
            pending={emailStatus.invoice.pending}
            percentage={emailStatus.invoice.sentPercentage}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Payment Receipts"
            total={emailStatus.payment.total}
            sent={emailStatus.payment.sent}
            pending={emailStatus.payment.pending}
            percentage={emailStatus.payment.sentPercentage}
            color="success.main"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
              onClick={() => openDialog('invoice')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Send Invoice Emails
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      Send invoices to customers
                    </Typography>
                  </Box>
                  <Box color="primary.main">
                    <EmailIcon />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
              onClick={() => openDialog('salary')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Send Salary Notifications
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      Notify staff about salaries
                    </Typography>
                  </Box>
                  <Box color="success.main">
                    <EmailIcon />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
              onClick={loadEmailStatus}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Refresh Status
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      Update email statistics
                    </Typography>
                  </Box>
                  <Box color="info.main">
                    <RefreshIcon />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
              onClick={() => navigate('/finance/reports')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Email Reports
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      View email analytics
                    </Typography>
                  </Box>
                  <Box color="warning.main">
                    <ViewIcon />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Email Templates Info */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Email Templates
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Invoice Email Template
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Professional invoice template with company branding, service details, 
                  payment terms, and contact information.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Includes: Service details, pricing breakdown, payment methods, due date
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Receipt Template
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Detailed receipt template showing payment confirmation, deductions, 
                  and transaction details.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Includes: Payment confirmation, deduction breakdown, receipt number
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Salary Notification Template
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Staff notification template for salary processing with detailed 
                  breakdown of earnings and deductions.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Includes: Salary breakdown, overtime details, EPF/ETF contributions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Email Configuration
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Configure SMTP settings, email templates, and automated sending 
                  preferences for your organization.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Settings: SMTP server, authentication, template customization
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Bulk Email Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Send Bulk {bulkData.emailType === 'invoice' ? 'Invoice' : 'Salary Notification'} Emails
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Email Type</InputLabel>
              <Select
                value={bulkData.emailType}
                onChange={(e) => setBulkData({ ...bulkData, emailType: e.target.value })}
              >
                <MenuItem value="invoice">Invoice Emails</MenuItem>
                <MenuItem value="salary">Salary Notifications</MenuItem>
              </Select>
            </FormControl>
            
            <Typography variant="h6" gutterBottom>
              Select Items to Send
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              {bulkData.emailType === 'invoice' 
                ? 'Select invoices to send to customers' 
                : 'Select salary records to notify staff'
              }
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={bulkData.allSelected}
                  onChange={(e) => setBulkData({ 
                    ...bulkData, 
                    allSelected: e.target.checked,
                    selectedIds: e.target.checked ? ['all'] : []
                  })}
                />
              }
              label="Select All"
            />
            
            {bulkResults.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Send Results
                </Typography>
                <List>
                  {bulkResults.map((result, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {result.success ? (
                          <SentIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${result.emailType || 'Item'} ${result.invoiceId || result.salaryId}`}
                        secondary={result.message}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button 
            onClick={handleBulkSend} 
            variant="contained"
            color="primary"
            disabled={sending || bulkData.selectedIds.length === 0}
            startIcon={<SendIcon />}
          >
            {sending ? 'Sending...' : 'Send Emails'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmailManagement;
