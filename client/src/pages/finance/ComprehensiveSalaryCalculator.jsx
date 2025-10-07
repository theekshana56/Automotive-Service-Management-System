import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import {
  calculateSalaryFromAttendance,
  createSalaryFromAttendance,
  calculateAllSalariesFromAttendance,
  getComprehensiveSalarySummary,
  generateDetailedSalaryReport,
  getStaffSalaries
} from '../../api/finance/financeService';

const ComprehensiveSalaryCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [staffEmail, setStaffEmail] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  
  // Calculation results
  const [salaryBreakdown, setSalaryBreakdown] = useState(null);
  const [allSalaries, setAllSalaries] = useState([]);
  const [summary, setSummary] = useState(null);
  
  // Dialog states
  const [calculationDialogOpen, setCalculationDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Sample staff emails for demo
  const sampleStaffEmails = [
    'mihiranga@autoelite.com',
    'staff@autoelite.com',
    'advisor@autoelite.com'
  ];

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const response = await getComprehensiveSalarySummary();
      setSummary(response.data.data);
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  };

  const handleCalculateSalary = async () => {
    if (!staffEmail || !startDate || !endDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await calculateSalaryFromAttendance({
        staffEmail,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      setSalaryBreakdown(response.data.data);
      setCalculationDialogOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate salary');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSalaryRecord = async () => {
    if (!staffEmail || !startDate || !endDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await createSalaryFromAttendance({
        staffEmail,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      setSuccess('Salary record created successfully!');
      setCalculationDialogOpen(false);
      await loadSummary();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create salary record');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateAllSalaries = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await calculateAllSalariesFromAttendance({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      setAllSalaries(response.data.data);
      setSuccess(`Calculated salaries for ${response.data.count} staff members`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate all salaries');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (email) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await generateDetailedSalaryReport(email, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      setSelectedReport(response.data.data);
      setReportDialogOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, color, icon, subtitle }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" color={color}>
              {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box color={color}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const SalaryBreakdownCard = ({ breakdown }) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Salary Breakdown for {breakdown.staffInfo.name}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Hours Worked
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><TimeIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary={`Regular Hours: ${breakdown.hours.regularHours}h`}
                  secondary={`@ $${breakdown.rates.regularHourlyRate}/hour`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><TimeIcon color="secondary" /></ListItemIcon>
                <ListItemText 
                  primary={`Overtime Hours: ${breakdown.hours.overtimeHours}h`}
                  secondary={`@ $${breakdown.rates.overtimeHourlyRate}/hour`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><TimeIcon /></ListItemIcon>
                <ListItemText 
                  primary={`Total Hours: ${breakdown.hours.totalHours}h`}
                />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Earnings & Deductions
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><MoneyIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary={`Regular Pay: $${breakdown.earnings.regularPay.toFixed(2)}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><MoneyIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary={`Overtime Pay: $${breakdown.earnings.overtimePay.toFixed(2)}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><MoneyIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary={`Gross Salary: $${breakdown.earnings.grossSalary.toFixed(2)}`}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon><MoneyIcon color="error" /></ListItemIcon>
                <ListItemText 
                  primary={`EPF (8%): $${breakdown.deductions.epfEmployee}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><MoneyIcon color="error" /></ListItemIcon>
                <ListItemText 
                  primary={`ETF (3%): $${breakdown.deductions.etf}`}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon><MoneyIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary={`Net Salary: $${breakdown.netSalary.toFixed(2)}`}
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Comprehensive Salary Calculator
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Calculate staff salaries from attendance management and extra work data
          </Typography>
          <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
            Formula: (Work Hours × $80 + OT Hours × $100) - ETF - EPF
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Salaries"
                value={summary.totalSalaries}
                color="primary.main"
                icon={<PeopleIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Net Salary Paid"
                value={summary.totalNetSalary}
                color="success.main"
                icon={<MoneyIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="EPF Contributions"
                value={summary.totalEPF}
                color="warning.main"
                icon={<TrendingUpIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="ETF Contributions"
                value={summary.totalETF}
                color="info.main"
                icon={<TrendingUpIcon />}
              />
            </Grid>
          </Grid>
        )}

        {/* Calculation Form */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Salary Calculation
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Staff Member</InputLabel>
                <Select
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  label="Staff Member"
                >
                  {sampleStaffEmails.map((email) => (
                    <MenuItem key={email} value={email}>
                      {email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleCalculateSalary}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
                sx={{ height: '56px' }}
              >
                Calculate
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCalculateAllSalaries}
              disabled={loading}
              startIcon={<RefreshIcon />}
            >
              Calculate All Staff
            </Button>
          </Box>
        </Paper>

        {/* All Salaries Results */}
        {allSalaries.length > 0 && (
          <Paper sx={{ mb: 4 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                All Staff Salary Calculations
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Staff Member</TableCell>
                    <TableCell>Regular Hours</TableCell>
                    <TableCell>OT Hours</TableCell>
                    <TableCell>Gross Salary</TableCell>
                    <TableCell>Net Salary</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allSalaries.map((salary, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {salary.staffInfo.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {salary.staffInfo.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{salary.hours.regularHours}h</TableCell>
                      <TableCell>{salary.hours.overtimeHours}h</TableCell>
                      <TableCell>${salary.earnings.grossSalary.toFixed(2)}</TableCell>
                      <TableCell>${salary.netSalary.toFixed(2)}</TableCell>
                      <TableCell>
                        <Tooltip title="Generate Report">
                          <IconButton
                            size="small"
                            onClick={() => handleGenerateReport(salary.staffInfo.email)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Salary Calculation Dialog */}
        <Dialog 
          open={calculationDialogOpen} 
          onClose={() => setCalculationDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Salary Calculation Result
          </DialogTitle>
          <DialogContent>
            {salaryBreakdown && (
              <SalaryBreakdownCard breakdown={salaryBreakdown} />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCalculationDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={handleCreateSalaryRecord}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              Create Salary Record
            </Button>
          </DialogActions>
        </Dialog>

        {/* Report Dialog */}
        <Dialog 
          open={reportDialogOpen} 
          onClose={() => setReportDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Detailed Salary Report
          </DialogTitle>
          <DialogContent>
            {selectedReport && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Report for {selectedReport.staffInfo.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Period: {selectedReport.reportPeriod}
                </Typography>
                
                <SalaryBreakdownCard breakdown={selectedReport} />
                
                {/* Attendance Details */}
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Attendance Details
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Check In</TableCell>
                            <TableCell>Check Out</TableCell>
                            <TableCell>Hours</TableCell>
                            <TableCell>Pay</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedReport.attendanceDetails.map((attendance, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(attendance.date).toLocaleDateString()}</TableCell>
                              <TableCell>{attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : 'N/A'}</TableCell>
                              <TableCell>{attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : 'N/A'}</TableCell>
                              <TableCell>{attendance.hoursWorked}h</TableCell>
                              <TableCell>${attendance.pay.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>

                {/* Extra Work Details */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Extra Work Details
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Hours</TableCell>
                            <TableCell>Pay</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedReport.extraWorkDetails.map((work, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(work.date).toLocaleDateString()}</TableCell>
                              <TableCell>{work.description}</TableCell>
                              <TableCell>{work.hours}h</TableCell>
                              <TableCell>${work.pay.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReportDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default ComprehensiveSalaryCalculator;
