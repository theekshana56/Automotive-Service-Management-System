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
  Cancel as DeclineIcon,
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
  Settings as SettingsIcon,
  Loyalty as LoyaltyIcon,
  Discount as DiscountIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import {
  getLoyaltyDiscountRequests,
  getLoyaltyDiscountSummary,
  reviewLoyaltyDiscountRequest
} from '../../api/finance/financeService';

const LoyaltyDiscountManagement = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentTab, setCurrentTab] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    reviewNotes: '',
    declineReason: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filterAndSortRequests = () => {
      let filtered = [...(requests || [])];

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(req => 
          req.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.requestReason?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(req => req.status === statusFilter);
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'customer':
            aValue = a.customerName || '';
            bValue = b.customerName || '';
            break;
          case 'bookings':
            aValue = a.totalBookings || 0;
            bValue = b.totalBookings || 0;
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

      setFilteredRequests(filtered);
    };

    filterAndSortRequests();
  }, [requests, searchTerm, statusFilter, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [requestsRes, summaryRes] = await Promise.all([
        getLoyaltyDiscountRequests(),
        getLoyaltyDiscountSummary()
      ]);

      setRequests(requestsRes.data.data.requests || []);
      setSummary(requestsRes.data.data.summary);
    } catch (err) {
      console.error('Error loading loyalty discount requests:', err);
      setError('Failed to load loyalty discount requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId) => {
    try {
      await reviewLoyaltyDiscountRequest(requestId, reviewData);
      setDialogOpen(false);
      setReviewData({
        status: 'approved',
        reviewNotes: '',
        declineReason: ''
      });
      await loadData();
      setError('');
    } catch (err) {
      setError('Failed to review loyalty discount request');
    }
  };

  const openDialog = (type, request = null) => {
    setDialogType(type);
    setSelectedRequest(request);
    setDialogOpen(true);
    
    if (type === 'review' && request) {
      setReviewData({
        status: 'approved',
        reviewNotes: '',
        declineReason: ''
      });
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedRequest(null);
    setReviewData({
      status: 'approved',
      reviewNotes: '',
      declineReason: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'declined': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <PendingIcon />;
      case 'approved': return <CheckCircleOutline />;
      case 'declined': return <CancelIcon />;
      default: return <PendingIcon />;
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
            {typeof value === 'number' ? value?.toLocaleString() || '0' : value}
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
              Loading Loyalty Discount Requests...
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
                Loyalty Discount Management
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 400, color: '#a3b8d0' }}>
                Review and manage customer loyalty discount requests
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Tooltip title="Export Data">
                <IconButton sx={{ color: '#3fa7ff' }}>
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

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <EnhancedStatCard
                title="Total Requests"
                value={summary.totalRequests}
                color="primary.main"
                icon={<LoyaltyIcon />}
                subtitle="All time"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <EnhancedStatCard
                title="Pending Review"
                value={summary.pendingRequests}
                color="warning.main"
                icon={<PendingIcon />}
                subtitle="Awaiting approval"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <EnhancedStatCard
                title="Approved"
                value={summary.approvedRequests}
                color="success.main"
                icon={<CheckCircleOutline />}
                subtitle="Successfully approved"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <EnhancedStatCard
                title="Declined"
                value={summary.declinedRequests}
                color="error.main"
                icon={<CancelIcon />}
                subtitle="Not approved"
              />
            </Grid>
          </Grid>
        )}

        {/* Requests Table */}
        <div className="glass-panel p-6 mb-6">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#dbeafe' }}>
              Loyalty Discount Requests
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
                  placeholder="Search by customer name, email, or reason..."
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </Box>

          {/* Requests Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-200">Customer</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Total Bookings</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Discount %</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Request Reason</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Status</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Requested Date</th>
                  <th className="text-left p-4 font-semibold text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filteredRequests || []).map((request) => (
                  <tr 
                    key={request._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                          <PersonIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">
                            {request.customerName}
                          </div>
                          <div className="text-sm text-slate-400">
                            {request.customerEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-200">
                        {request.totalBookings}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-yellow-400">
                        {request.discountPercentage}%
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-300 text-sm">
                        {request.requestReason || 'No reason provided'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${getStatusColor(request.status) === 'warning' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                        getStatusColor(request.status) === 'success' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        getStatusColor(request.status) === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-300 text-sm">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {request.status === 'pending' && (
                          <>
                            <button
                              className="btn-icon"
                              onClick={() => openDialog('review', request)}
                              title="Review Request"
                            >
                              <ViewIcon className="w-4 h-4 text-blue-400" />
                            </button>
                          </>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-slate-400 text-sm">
                            {request.status === 'approved' ? 'Approved' : 'Declined'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {(filteredRequests || []).length === 0 && (
              <div className="p-8 text-center">
                <LoyaltyIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h6 className="text-lg font-semibold text-slate-200 mb-2">
                  No loyalty discount requests found
                </h6>
                <p className="text-sm text-slate-400">
                  No requests match your current filters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Review Dialog */}
        <Dialog 
          open={dialogOpen && dialogType === 'review'} 
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
                  Review Loyalty Discount Request
                </Typography>
                <Typography variant="body2" sx={{ color: '#a3b8d0' }}>
                  Approve or decline customer loyalty discount request
                </Typography>
              </Box>
              <IconButton onClick={closeDialog} size="small" sx={{ color: '#a3b8d0' }}>
                <CancelIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ backgroundColor: '#10182a' }}>
            {selectedRequest && (
              <Box sx={{ mt: 2 }}>
                {/* Customer Information */}
                <div className="glass-panel p-6 mb-6">
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#dbeafe', mb: 3 }}>
                    Customer Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <div>
                        <Typography variant="body2" sx={{ color: '#a3b8d0', mb: 1 }}>
                          Customer Name
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#dbeafe' }}>
                          {selectedRequest.customerName}
                        </Typography>
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <div>
                        <Typography variant="body2" sx={{ color: '#a3b8d0', mb: 1 }}>
                          Email
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#dbeafe' }}>
                          {selectedRequest.customerEmail}
                        </Typography>
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <div>
                        <Typography variant="body2" sx={{ color: '#a3b8d0', mb: 1 }}>
                          Total Bookings
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#4fffb0' }}>
                          {selectedRequest.totalBookings}
                        </Typography>
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <div>
                        <Typography variant="body2" sx={{ color: '#a3b8d0', mb: 1 }}>
                          Requested Discount
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#ffa726' }}>
                          {selectedRequest.discountPercentage}%
                        </Typography>
                      </div>
                    </Grid>
                    <Grid item xs={12}>
                      <div>
                        <Typography variant="body2" sx={{ color: '#a3b8d0', mb: 1 }}>
                          Request Reason
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#dbeafe' }}>
                          {selectedRequest.requestReason || 'No reason provided'}
                        </Typography>
                      </div>
                    </Grid>
                  </Grid>
                </div>

                {/* Review Form */}
                <div className="glass-panel p-6">
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#dbeafe' }}>
                    Review Decision
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <div>
                        <label className="label">Decision</label>
                        <select
                          value={reviewData.status}
                          onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                          className="select"
                        >
                          <option value="approved">Approve</option>
                          <option value="declined">Decline</option>
                        </select>
                      </div>
                    </Grid>
                    <Grid item xs={12}>
                      <div>
                        <label className="label">Review Notes</label>
                        <textarea
                          value={reviewData.reviewNotes}
                          onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
                          className="textarea"
                          rows={3}
                          placeholder="Add notes about your decision..."
                        />
                      </div>
                    </Grid>
                    {reviewData.status === 'declined' && (
                      <Grid item xs={12}>
                        <div>
                          <label className="label">Decline Reason</label>
                          <textarea
                            value={reviewData.declineReason}
                            onChange={(e) => setReviewData({ ...reviewData, declineReason: e.target.value })}
                            className="textarea"
                            rows={2}
                            placeholder="Reason for declining the request..."
                            required
                          />
                        </div>
                      </Grid>
                    )}
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
              onClick={() => handleReview(selectedRequest._id)} 
              className={`btn ${reviewData.status === 'approved' ? 'btn-primary' : 'btn-danger'}`}
            >
              {reviewData.status === 'approved' ? (
                <>
                  <ApproveIcon className="w-4 h-4" />
                  Approve Request
                </>
              ) : (
                <>
                  <DeclineIcon className="w-4 h-4" />
                  Decline Request
                </>
              )}
            </button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
};

export default LoyaltyDiscountManagement;
