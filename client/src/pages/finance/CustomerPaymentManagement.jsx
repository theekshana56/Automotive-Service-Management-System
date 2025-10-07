import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  Fab,
  Avatar,
  Divider,
  Tooltip,
  Badge,
  LinearProgress,
  Stack,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Receipt as InvoiceIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Build as BuildIcon,
  CheckCircleOutline,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  ReceiptLong as ReceiptLongIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon2,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import {
  getServiceCostsWithPayments,
  getCustomerPaymentSummary,
  processCustomerPaymentRequest,
  getCustomerPayments,
  generateCustomerPaymentPDF,
  generateCombinedFinancePDF
} from '../../api/finance/financeService';

const CustomerPaymentManagement = () => {
  const [serviceCosts, setServiceCosts] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [filteredServiceCosts, setFilteredServiceCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [summary, setSummary] = useState(null);
  const [selectedServiceCost, setSelectedServiceCost] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentTab, setCurrentTab] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'cash',
    paymentReference: '',
    transactionId: '',
    loyaltyDiscount: 0,
    otherDiscount: 0,
    notes: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filterAndSortServiceCosts = () => {
      let filtered = [...(serviceCosts || [])];

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(sc => 
          sc.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sc.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sc.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sc.advisorId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(sc => sc.status === statusFilter);
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'customer':
            aValue = a.customerId?.name || '';
            bValue = b.customerId?.name || '';
            break;
          case 'amount':
            aValue = a.finalCost?.totalAmount || 0;
            bValue = b.finalCost?.totalAmount || 0;
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          default:
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      setFilteredServiceCosts(filtered);
    };

    filterAndSortServiceCosts();
  }, [serviceCosts, searchTerm, statusFilter, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [serviceCostsRes, summaryRes, paymentsRes] = await Promise.all([
        getServiceCostsWithPayments({ status: statusFilter }),
        getCustomerPaymentSummary(),
        getCustomerPayments()
      ]);

      setServiceCosts(serviceCostsRes.data.data.serviceCosts || []);
      setSummary(serviceCostsRes.data.data.summary);
      setCustomerPayments(paymentsRes.data.data.payments || []);
    } catch (err) {
      console.error('Error loading customer payment data:', err);
      setError('Failed to load customer payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (serviceCostId) => {
    try {
      const payload = {
        serviceCostId,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        transactionId: paymentData.transactionId,
        loyaltyDiscount: paymentData.loyaltyDiscount,
        otherDiscount: paymentData.otherDiscount,
        notes: paymentData.notes
      };

      await processCustomerPaymentRequest(payload);
      setDialogOpen(false);
      setPaymentData({
        paymentMethod: 'cash',
        paymentReference: '',
        transactionId: '',
        loyaltyDiscount: 0,
        otherDiscount: 0,
        notes: ''
      });
      await loadData();
      setError('');
    } catch (err) {
      setError('Failed to process customer payment');
    }
  };

  const handleGenerateCustomerPaymentPDF = async () => {
    try {
      setLoading(true);
      const response = await generateCustomerPaymentPDF();
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customer-payment-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Customer payment report PDF generated successfully!');
    } catch (err) {
      setError('Failed to generate customer payment PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCombinedPDF = async () => {
    try {
      setLoading(true);
      const response = await generateCombinedFinancePDF();
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `combined-finance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Combined finance report PDF generated successfully!');
    } catch (err) {
      setError('Failed to generate combined finance PDF');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (type, serviceCost = null) => {
    setDialogType(type);
    setSelectedServiceCost(serviceCost);
    setDialogOpen(true);
    
    if (type === 'payment' && serviceCost) {
      setPaymentData({
        paymentMethod: 'cash',
        paymentReference: '',
        transactionId: '',
        loyaltyDiscount: 0,
        otherDiscount: 0,
        notes: ''
      });
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedServiceCost(null);
    setPaymentData({
      paymentMethod: 'cash',
      paymentReference: '',
      transactionId: '',
      loyaltyDiscount: 0,
      otherDiscount: 0,
      notes: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_review': return 'warning';
      case 'under_review': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'invoiced': return 'primary';
      case 'paid': return 'success';
      default: return 'default';
    }
  };

  const EnhancedStatCard = ({ title, value, color, icon, trend, subtitle }) => {
    const getColorStyles = (colorType) => {
      switch (colorType) {
        case 'primary.main':
          return {
            bg: 'linear-gradient(135deg, rgba(63,167,255,0.15) 0%, rgba(63,167,255,0.05) 100%)',
            border: '1px solid rgba(63,167,255,0.3)',
            iconBg: '#3fa7ff',
            textColor: '#3fa7ff',
            hoverShadow: '0 8px 25px rgba(63,167,255,0.2)'
          };
        case 'success.main':
          return {
            bg: 'linear-gradient(135deg, rgba(79,255,176,0.15) 0%, rgba(79,255,176,0.05) 100%)',
            border: '1px solid rgba(79,255,176,0.3)',
            iconBg: '#4fffb0',
            textColor: '#4fffb0',
            hoverShadow: '0 8px 25px rgba(79,255,176,0.2)'
          };
        case 'info.main':
          return {
            bg: 'linear-gradient(135deg, rgba(56,232,252,0.15) 0%, rgba(56,232,252,0.05) 100%)',
            border: '1px solid rgba(56,232,252,0.3)',
            iconBg: '#38e8fc',
            textColor: '#38e8fc',
            hoverShadow: '0 8px 25px rgba(56,232,252,0.2)'
          };
        case 'warning.main':
          return {
            bg: 'linear-gradient(135deg, rgba(255,167,38,0.15) 0%, rgba(255,167,38,0.05) 100%)',
            border: '1px solid rgba(255,167,38,0.3)',
            iconBg: '#ffa726',
            textColor: '#ffa726',
            hoverShadow: '0 8px 25px rgba(255,167,38,0.2)'
          };
        default:
          return {
            bg: 'linear-gradient(135deg, rgba(63,167,255,0.15) 0%, rgba(63,167,255,0.05) 100%)',
            border: '1px solid rgba(63,167,255,0.3)',
            iconBg: '#3fa7ff',
            textColor: '#3fa7ff',
            hoverShadow: '0 8px 25px rgba(63,167,255,0.2)'
          };
      }
    };

    const styles = getColorStyles(color);

    return (
      <div 
        className="card card-hover"
        style={{ 
          height: '100%',
          background: styles.bg,
          border: styles.border,
          transition: 'all 0.3s ease',
        }}
      >
        <div className="p-6">
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <div 
              className="p-3 rounded-xl"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: styles.iconBg
              }}
            >
              {icon}
            </div>
            {trend && (
              <Box display="flex" alignItems="center" sx={{ color: trend > 0 ? '#4fffb0' : '#ff6b6b' }}>
                {trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#a3b8d0', mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1, color: styles.textColor }}>
            {typeof value === 'number' ? `$${value?.toLocaleString() || '0'}` : value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#a3b8d0' }}>
              {subtitle}
            </Typography>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-app min-h-screen">
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
            <LinearProgress sx={{ width: '100%', mb: 3 }} />
            <Typography variant="h5" gutterBottom sx={{ color: '#dbeafe' }}>
              Loading Customer Payment Data...
            </Typography>
            <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
              Please wait while we fetch the latest information
            </Typography>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-app min-h-screen">
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Enhanced Header */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h3" gutterBottom sx={{ 
                fontWeight: 700, 
                background: 'linear-gradient(45deg, #3fa7ff, #4fffb0)', 
                backgroundClip: 'text', 
                WebkitBackgroundClip: 'text', 
                color: 'transparent' 
              }}>
                Customer Payment Management
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Tooltip title="Generate Customer Payment PDF">
                <IconButton 
                  sx={{ color: '#3fa7ff' }}
                  onClick={handleGenerateCustomerPaymentPDF}
                  disabled={loading}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Generate Combined Finance PDF">
                <IconButton 
                  sx={{ color: '#4fffb0' }}
                  onClick={handleGenerateCombinedPDF}
                  disabled={loading}
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh Data">
                <IconButton 
                  sx={{ color: '#38e8fc' }}
                  onClick={loadData}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}




        {/* Service Costs with Payment Calculations Table */}
        <div className="glass-panel p-6 mb-6">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#dbeafe' }}>
              Service Costs Ready for Payment Processing
            </Typography>
            <Box display="flex" gap={1}>
              <button
                className="btn btn-secondary"
                onClick={loadData}
              >
                <RefreshIcon className="w-4 h-4" />
                Refresh
              </button>
            </Box>
          </Box>

          {/* Search and Filter Bar */}
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={3}>
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by customer, vehicle, service type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <div className="min-w-[150px]">
              <label className="label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </Box>

          {/* Service Costs Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-200">Customer</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Vehicle</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Service Type</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Cost Service</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Profit (80%)</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Advisor Cost</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Staff Cost</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Loyalty Discount</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Customer Payment</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Status</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filteredServiceCosts || []).map((serviceCost) => (
                  <tr 
                    key={serviceCost._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                          <PersonIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">
                            {serviceCost.customerId?.name}
                          </div>
                          <div className="text-sm text-slate-400">
                            {serviceCost.customerId?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <CarIcon className="w-4 h-4 text-slate-400 mr-2" />
                        <span className="font-medium text-slate-200">
                          {serviceCost.vehiclePlate}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="badge">
                        {serviceCost.serviceType}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="font-medium text-slate-200">
                          ${serviceCost.finalCost?.totalAmount?.toFixed(2) || '0.00'}
                        </span>
                        <div className="text-xs text-slate-400">
                          Cost Service
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-yellow-400">
                        ${serviceCost.customerPaymentCalculation?.profitAmount?.toFixed(2) || 
                          ((serviceCost.finalCost?.totalAmount || 0) * 0.8).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-blue-400">
                        ${serviceCost.customerPaymentCalculation?.advisorFixedCost?.toFixed(2) || '100.00'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-orange-400">
                        ${serviceCost.customerPaymentCalculation?.staffFixedCost?.toFixed(2) || '60.00'}
                      </span>
                    </td>
                    <td className="p-4">
                      {serviceCost.loyaltyDiscount ? (
                        <div>
                          <span className="font-medium text-green-400">
                            {serviceCost.loyaltyDiscount.percentage}%
                          </span>
                          <div className="text-xs text-slate-400">
                            -${serviceCost.customerPaymentCalculation?.loyaltyDiscountAmount?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">No discount</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="font-bold text-green-400">
                          ${serviceCost.customerPaymentCalculation?.finalCustomerPayment?.toFixed(2) || 
                            (((serviceCost.finalCost?.totalAmount || 0) * 1.8 + 160) * 1.12).toFixed(2)}
                        </span>
                        <div className="text-xs text-slate-400">
                          Total with 80% profit + fixed costs
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${getStatusColor(serviceCost.status) === 'warning' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                        getStatusColor(serviceCost.status) === 'success' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        getStatusColor(serviceCost.status) === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        getStatusColor(serviceCost.status) === 'info' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                        'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                        {serviceCost.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button
                          className="btn-icon"
                          onClick={() => openDialog('payment', serviceCost)}
                          title="Process Payment"
                        >
                          <MoneyIcon className="w-4 h-4 text-blue-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {(filteredServiceCosts || []).length === 0 && (
              <div className="p-8 text-center">
                <BuildIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h6 className="text-lg font-semibold text-slate-200 mb-2">
                  No service costs ready for payment
                </h6>
                <p className="text-sm text-slate-400">
                  All service costs have been processed or none are approved yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Processing Dialog */}
        <Dialog 
          open={dialogOpen && dialogType === 'payment'} 
          onClose={closeDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#10182a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '1rem',
              backdropFilter: 'blur(8px)'
            }
          }}
        >
          <DialogTitle sx={{ pb: 1, backgroundColor: '#10182a', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#dbeafe' }}>
                  Process Customer Payment
                </Typography>
                <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                  Calculate and process payment with 80% profit margin
                </Typography>
              </Box>
              <IconButton onClick={closeDialog} size="small" sx={{ color: '#a3b8d0' }}>
                <CancelIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ backgroundColor: '#10182a' }}>
            {selectedServiceCost && (
              <Box sx={{ mt: 2 }}>
                {/* Payment Calculation Display */}
                <div className="glass-panel p-6 mb-6">
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#dbeafe', mb: 3 }}>
                    Payment Calculation
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <Typography variant="h6" sx={{ color: '#3fa7ff', fontWeight: 600 }}>
                          ${selectedServiceCost.finalCost?.totalAmount?.toFixed(2) || '0.00'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                          Service Cost
                        </Typography>
                      </div>
                    </Grid>
                    <Grid item xs={6}>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <Typography variant="h6" sx={{ color: '#4fffb0', fontWeight: 600 }}>
                          ${selectedServiceCost.customerPaymentCalculation?.profitAmount?.toFixed(2) || 
                            ((selectedServiceCost.finalCost?.totalAmount || 0) * 0.8).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                          Profit (80%)
                        </Typography>
                      </div>
                    </Grid>
                    <Grid item xs={6}>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <Typography variant="h6" sx={{ color: '#38e8fc', fontWeight: 600 }}>
                          ${selectedServiceCost.customerPaymentCalculation?.advisorFixedCost?.toFixed(2) || '100.00'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                          Advisor Fixed Cost
                        </Typography>
                      </div>
                    </Grid>
                    <Grid item xs={6}>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <Typography variant="h6" sx={{ color: '#ffa726', fontWeight: 600 }}>
                          ${selectedServiceCost.customerPaymentCalculation?.staffFixedCost?.toFixed(2) || '60.00'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                          Staff Fixed Cost
                        </Typography>
                      </div>
                    </Grid>
                    <Grid item xs={6}>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 600 }}>
                          ${selectedServiceCost.customerPaymentCalculation?.taxAmount?.toFixed(2) || 
                            (((selectedServiceCost.finalCost?.totalAmount || 0) * 1.8 + 160) * 0.12).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                          Tax (12%)
                        </Typography>
                      </div>
                    </Grid>
                    {selectedServiceCost.loyaltyDiscount && (
                      <Grid item xs={6}>
                        <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                          <Typography variant="h6" sx={{ color: '#ff6b6b', fontWeight: 600 }}>
                            -${selectedServiceCost.customerPaymentCalculation?.loyaltyDiscountAmount?.toFixed(2) || '0.00'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                            Loyalty Discount ({selectedServiceCost.loyaltyDiscount.percentage}%)
                          </Typography>
                        </div>
                      </Grid>
                    )}
                    <Grid item xs={selectedServiceCost.loyaltyDiscount ? 6 : 12}>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                          ${selectedServiceCost.customerPaymentCalculation?.finalCustomerPayment?.toFixed(2) || 
                            (((selectedServiceCost.finalCost?.totalAmount || 0) * 1.8 + 160) * 1.12).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                          Final Payment
                        </Typography>
                      </div>
                    </Grid>
                  </Grid>
                </div>

                {/* Payment Form */}
                <div className="glass-panel p-6">
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#dbeafe' }}>
                    Payment Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <div>
                        <label className="label">Payment Method</label>
                        <select
                          value={paymentData.paymentMethod}
                          onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                          className="select"
                        >
                          <option value="cash">Cash</option>
                          <option value="credit_card">Credit Card</option>
                          <option value="debit_card">Debit Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cheque">Cheque</option>
                          <option value="online">Online</option>
                        </select>
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <div>
                        <label className="label">Payment Reference</label>
                        <input
                          type="text"
                          value={paymentData.paymentReference}
                          onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                          className="input"
                          placeholder="Reference number"
                        />
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <div>
                        <label className="label">Transaction ID</label>
                        <input
                          type="text"
                          value={paymentData.transactionId}
                          onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                          className="input"
                          placeholder="Transaction ID"
                        />
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <div>
                        <label className="label">Loyalty Discount</label>
                        <input
                          type="number"
                          value={paymentData.loyaltyDiscount}
                          onChange={(e) => setPaymentData({ ...paymentData, loyaltyDiscount: parseFloat(e.target.value) || 0 })}
                          className="input"
                          placeholder="0.00"
                        />
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <div>
                        <label className="label">Other Discount</label>
                        <input
                          type="number"
                          value={paymentData.otherDiscount}
                          onChange={(e) => setPaymentData({ ...paymentData, otherDiscount: parseFloat(e.target.value) || 0 })}
                          className="input"
                          placeholder="0.00"
                        />
                      </div>
                    </Grid>
                    <Grid item xs={12}>
                      <div>
                        <label className="label">Notes</label>
                        <textarea
                          value={paymentData.notes}
                          onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                          className="textarea"
                          rows={3}
                          placeholder="Additional notes..."
                        />
                      </div>
                    </Grid>
                  </Grid>
                </div>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1, backgroundColor: '#10182a', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={closeDialog} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              onClick={() => handleProcessPayment(selectedServiceCost._id)} 
              className="btn btn-primary"
            >
              <MoneyIcon className="w-4 h-4" />
              Process Payment
            </button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
};

export default CustomerPaymentManagement;