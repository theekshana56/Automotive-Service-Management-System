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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  getServiceCosts,
  getServiceCostSummary,
  reviewServiceCost,
  generateInvoice,
  deleteServiceCost,
  getServiceCostsWithPayments,
  getCustomerPaymentSummary,
  processCustomerPaymentRequest,
  generateServiceCostPDF
} from '../../api/finance/financeService';

const ServiceCostManagement = () => {
  const [serviceCosts, setServiceCosts] = useState([]);
  const [filteredServiceCosts, setFilteredServiceCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [summary, setSummary] = useState(null);
  const [customerPaymentSummary, setCustomerPaymentSummary] = useState(null);
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
  const [showCustomerPayments, setShowCustomerPayments] = useState(false);
  const [reviewData, setReviewData] = useState({
    approved: false,
    notes: '',
    taxRate: 0,
    discountAmount: 0
  });
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

      const [serviceCostsRes, summaryRes, customerPaymentSummaryRes] = await Promise.all([
        getServiceCosts(),
        getServiceCostSummary(),
        getCustomerPaymentSummary()
      ]);

      setServiceCosts(serviceCostsRes.data.data || []);
      setSummary(summaryRes.data.data);
      setCustomerPaymentSummary(customerPaymentSummaryRes.data.data);
    } catch (err) {
      console.error('Error loading service cost data:', err);
      setError('Failed to load service cost data');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (serviceCostId) => {
    try {
      await reviewServiceCost(serviceCostId, reviewData);
      setDialogOpen(false);
      await loadData();
      setError('');
    } catch (err) {
      setError('Failed to review service cost');
    }
  };

  const handleGenerateInvoice = async (serviceCostId) => {
    try {
      await generateInvoice(serviceCostId);
      await loadData();
      setError('');
    } catch (err) {
      setError('Failed to generate invoice');
    }
  };

  const handleDelete = async (serviceCostId) => {
    if (!window.confirm('Are you sure you want to delete this service cost record?')) return;
    
    try {
      await deleteServiceCost(serviceCostId);
      await loadData();
      setError('');
    } catch (err) {
      setError('Failed to delete service cost record');
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

  const handleGenerateServiceCostPDF = async () => {
    try {
      setLoading(true);
      const response = await generateServiceCostPDF();
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `service-cost-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Service cost report PDF generated successfully!');
    } catch (err) {
      setError('Failed to generate service cost PDF');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (type, serviceCost = null) => {
    setDialogType(type);
    setSelectedServiceCost(serviceCost);
    setDialogOpen(true);
    
    if (type === 'review' && serviceCost) {
      setReviewData({
        approved: false,
        notes: '',
        taxRate: serviceCost.finalCost.taxRate || 0,
        discountAmount: serviceCost.finalCost.discountAmount || 0
      });
    }
    
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
    setReviewData({
      approved: false,
      notes: '',
      taxRate: 0,
      discountAmount: 0
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_review': return <PendingIcon />;
      case 'under_review': return <AssessmentIcon />;
      case 'approved': return <CheckCircleOutline />;
      case 'rejected': return <CancelIcon />;
      case 'invoiced': return <ReceiptLongIcon />;
      case 'paid': return <CheckCircleOutline />;
      default: return <PendingIcon />;
    }
  };

  const toggleRowExpansion = (serviceCostId) => {
    setExpandedRows(prev => ({
      ...prev,
      [serviceCostId]: !prev[serviceCostId]
    }));
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
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <LinearProgress sx={{ width: '100%', mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Loading Service Cost Data...
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Please wait while we fetch the latest information
          </Typography>
        </Box>
      </Container>
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
          Service Cost Management
        </Typography>
              <Typography variant="h6" sx={{ fontWeight: 400, color: '#a3b8d0' }}>
                Review advisor estimates and manage service costs with advanced analytics
        </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Tooltip title="Generate Service Cost PDF">
                <IconButton 
                  sx={{ color: '#3fa7ff' }}
                  onClick={handleGenerateServiceCostPDF}
                  disabled={loading}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Print Report">
                <IconButton sx={{ color: '#3fa7ff' }}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton sx={{ color: '#3fa7ff' }}>
                  <ShareIcon />
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




      {/* Enhanced Service Costs Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-200">Customer</th>
                <th className="text-left p-4 font-semibold text-slate-200">Vehicle</th>
                <th className="text-left p-4 font-semibold text-slate-200">Service Type</th>
                <th className="text-left p-4 font-semibold text-slate-200">Advisor</th>
                <th className="text-left p-4 font-semibold text-slate-200">Service Cost</th>
                <th className="text-left p-4 font-semibold text-slate-200">Details</th>
              </tr>
            </thead>
            <tbody>
              {(filteredServiceCosts || []).map((serviceCost) => (
                <React.Fragment key={serviceCost._id}>
                  <tr 
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => toggleRowExpansion(serviceCost._id)}
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
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-slate-500/20 flex items-center justify-center mr-2">
                          <PersonIcon className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-slate-200">
                      {serviceCost.advisorId?.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-200">
                        ${serviceCost.finalCost?.totalAmount?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpansion(serviceCost._id);
                        }}
                      >
                        {expandedRows[serviceCost._id] ? <ExpandLessIcon className="w-4 h-4" /> : <ExpandMoreIcon2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expandable Row Details */}
                  {expandedRows[serviceCost._id] && (
                    <tr>
                      <td colSpan={6} className="p-0 border-0">
                        <div className="p-6 bg-slate-800/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h6 className="text-lg font-semibold text-slate-200 mb-4">
                                Service Details
                              </h6>
                              <div className="space-y-3">
                                <div className="flex items-center">
                                  <ScheduleIcon className="w-4 h-4 text-slate-400 mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-slate-200">Created</div>
                                    <div className="text-sm text-slate-400">
                                      {new Date(serviceCost.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <BuildIcon className="w-4 h-4 text-slate-400 mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-slate-200">Labor Hours</div>
                                    <div className="text-sm text-slate-400">
                                      {serviceCost.advisorEstimate?.laborHours || 0} hours
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <MoneyIcon className="w-4 h-4 text-slate-400 mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-slate-200">Labor Rate</div>
                                    <div className="text-sm text-slate-400">
                                      ${serviceCost.advisorEstimate?.laborRate || 0}/hour
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h6 className="text-lg font-semibold text-slate-200 mb-4">
                                Parts Required
                              </h6>
                              {serviceCost.advisorEstimate?.partsRequired?.length > 0 ? (
                                <div className="space-y-2">
                                  {serviceCost.advisorEstimate.partsRequired.map((part, index) => (
                                    <div key={index} className="p-3 bg-slate-700/50 rounded-lg">
                                      <div className="text-sm font-medium text-slate-200">
                                        {part.partName}
                                      </div>
                                      <div className="text-sm text-slate-400">
                                        Qty: {part.quantity} × ${part.unitCost} = ${part.totalCost}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-slate-400">
                                  No parts required
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {(filteredServiceCosts || []).length === 0 && (
          <div className="p-8 text-center">
            <BuildIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h6 className="text-lg font-semibold text-slate-200 mb-2">
              No service cost records found
            </h6>
            <p className="text-sm text-slate-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by adding a new service cost record'
              }
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Review Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={closeDialog} 
        maxWidth="lg" 
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
          Review Service Cost
              </Typography>
              <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                Review and approve advisor estimates
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
              {/* Customer Info Header */}
              <div className="glass-panel p-6 mb-6">
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <PersonIcon className="w-7 h-7 text-blue-400" />
                    </div>
                  </Grid>
                  <Grid item xs>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#dbeafe' }}>
                      {selectedServiceCost.customerId?.name}
              </Typography>
                    <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                      {selectedServiceCost.customerId?.email}
              </Typography>
                    <Box display="flex" gap={2} mt={1}>
                      <span className="badge">
                        <CarIcon className="w-3 h-3 mr-1" />
                        {selectedServiceCost.vehiclePlate}
                      </span>
                      <span className="badge">
                        <BuildIcon className="w-3 h-3 mr-1" />
                        {selectedServiceCost.serviceType}
                      </span>
                    </Box>
                  </Grid>
                  <Grid item>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#4fffb0' }}>
                      ${selectedServiceCost.finalCost?.totalAmount?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#a3b8d0' }}>
                      Total Amount
                    </Typography>
                  </Grid>
                </Grid>
              </div>
              
              {/* Cost Breakdown */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <div className="card text-center p-4">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#3fa7ff' }}>
                      ${selectedServiceCost.finalCost?.laborCost?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                      Labor Cost
                    </Typography>
                  </div>
                </Grid>
                <Grid item xs={12} md={4}>
                  <div className="card text-center p-4">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#38e8fc' }}>
                      ${selectedServiceCost.finalCost?.partsCost?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                      Parts Cost
                    </Typography>
                  </div>
                </Grid>
                <Grid item xs={12} md={4}>
                  <div className="card text-center p-4">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffa726' }}>
                      ${selectedServiceCost.finalCost?.taxAmount?.toFixed(2) || '0.00'}
              </Typography>
                    <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                      Tax Amount
              </Typography>
                  </div>
                </Grid>
              </Grid>
              
              {/* Advisor Estimate Details */}
              <div className="glass-panel mb-6">
                <div className="p-4 border-b border-white/10">
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#dbeafe' }}>
                    Advisor Estimate Details
                  </Typography>
                </div>
                <div className="p-4">
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#dbeafe' }}>
                        <strong>Labor Hours:</strong> {selectedServiceCost.advisorEstimate?.laborHours || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#dbeafe' }}>
                        <strong>Labor Rate:</strong> ${selectedServiceCost.advisorEstimate?.laborRate || 0}/hour
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom sx={{ color: '#dbeafe' }}>
                        <strong>Parts Required:</strong>
                      </Typography>
                      {selectedServiceCost.advisorEstimate?.partsRequired?.length > 0 ? (
                        selectedServiceCost.advisorEstimate.partsRequired.map((part, index) => (
                          <Typography key={index} variant="caption" display="block" sx={{ ml: 2, color: '#a3b8d0' }}>
                          • {part.partName} (Qty: {part.quantity}) - ${part.totalCost}
                        </Typography>
                        ))
                      ) : (
                        <Typography variant="caption" sx={{ color: '#a3b8d0' }}>
                          No parts required
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ color: '#dbeafe' }}>
                        <strong>Estimated Total:</strong> ${selectedServiceCost.advisorEstimate?.estimatedTotal || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </div>
              </div>
              
              {/* Review Form */}
              <div className="glass-panel p-6">
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#dbeafe' }}>
                  Review Decision
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <div>
                      <label className="label">Approval Decision</label>
                      <select
                    value={reviewData.approved}
                        onChange={(e) => setReviewData({ ...reviewData, approved: e.target.value === 'true' })}
                        className="select"
                      >
                        <option value={true}>
                          ✓ Approve
                        </option>
                        <option value={false}>
                          ✗ Reject
                        </option>
                      </select>
                    </div>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <div>
                      <label className="label">Tax Rate (%)</label>
                      <input
                  type="number"
                  value={reviewData.taxRate}
                  onChange={(e) => setReviewData({ ...reviewData, taxRate: parseFloat(e.target.value) || 0 })}
                        className="input"
                      />
                    </div>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <div>
                      <label className="label">Discount Amount</label>
                      <input
                  type="number"
                  value={reviewData.discountAmount}
                  onChange={(e) => setReviewData({ ...reviewData, discountAmount: parseFloat(e.target.value) || 0 })}
                        className="input"
                      />
                    </div>
                  </Grid>
                  <Grid item xs={12}>
                    <div>
                      <label className="label">Review Notes</label>
                      <textarea
                  value={reviewData.notes}
                  onChange={(e) => setReviewData({ ...reviewData, notes: e.target.value })}
                        placeholder="Add any additional notes or comments..."
                        className="textarea"
                        rows={3}
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
            onClick={() => handleReview(selectedServiceCost._id)} 
            className={`btn ${reviewData.approved ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              backgroundColor: reviewData.approved ? '#4fffb0' : '#ff6b6b',
              color: reviewData.approved ? '#0b1020' : '#ffffff'
            }}
          >
            {reviewData.approved ? (
              <>
                <CheckCircleOutline className="w-4 h-4" />
                Approve Service Cost
              </>
            ) : (
              <>
                <CancelIcon className="w-4 h-4" />
                Reject Service Cost
              </>
            )}
          </button>
        </DialogActions>
      </Dialog>

      {/* Customer Payment Processing Dialog */}
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
                  <Grid item xs={6}>
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

      {/* Enhanced Floating Action Button */}
      <button
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-50"
        onClick={() => navigate('/finance/service-costs/new')}
        aria-label="add service cost"
      >
        <AddIcon className="w-7 h-7" />
      </button>
    </Container>
    </div>
  );
};

export default ServiceCostManagement;
