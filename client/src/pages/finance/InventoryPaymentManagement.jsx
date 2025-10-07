import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.jsx';
import api from '../../api/client';
import { generatePurchaseOrderCostPDF } from '../../api/finance/financeService';

const InventoryPaymentManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({});
  const [toast, setToast] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [success, setSuccess] = useState('');

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    delivered: 'bg-blue-100 text-blue-800'
  };

  const statusLabels = {
    draft: 'Draft',
    submitted: 'Awaiting Finance Approval',
    approved: 'Approved',
    delivered: 'Delivered'
  };

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(filter !== 'all' && { status: filter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await api.get(`/api/purchase-orders?${params}`);
      setPurchaseOrders(response.data.purchaseOrders || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching purchase order statistics...');
      const response = await api.get('/api/purchase-orders/statistics');
      const data = response.data;
      console.log('Stats API response:', data);
      
      // Calculate pending approvals (submitted status)
      const submittedCount = data.statusBreakdown?.find(s => s._id === 'submitted')?.count || 0;
      const submittedValue = data.statusBreakdown?.find(s => s._id === 'submitted')?.totalValue || 0;
      
      const statsData = {
        totalPOs: data.totalPOs || 0,
        totalValue: data.totalValue || 0,
        submitted: submittedCount,
        submittedValue: submittedValue
      };
      
      console.log('Processed stats data:', statsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Set default values if API fails
      setStats({
        totalPOs: 0,
        totalValue: 0,
        submitted: 0,
        submittedValue: 0
      });
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [currentPage, filter, searchTerm]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Also fetch stats when the component mounts and when purchase orders change
  useEffect(() => {
    if (purchaseOrders.length > 0) {
      fetchStats();
    }
  }, [purchaseOrders.length]);

  const handleApprovePO = async (poId) => {
    try {
      await api.patch(`/api/purchase-orders/${poId}/approve`, {
        approvalNotes: approvalNotes
      });
      
      setToast('Purchase Order approved successfully!');
      // Notify dashboard to refresh
      localStorage.setItem('po_approved', Date.now());
      setShowApprovalModal(false);
      setSelectedPO(null);
      setApprovalNotes('');
      
      // Refresh both purchase orders and stats
      await Promise.all([fetchPurchaseOrders(), fetchStats()]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Failed to approve purchase order: ${errorMessage}`);
    }
  };

  const handleRejectPO = async (poId) => {
    try {
      await api.patch(`/api/purchase-orders/${poId}/reject`, {
        rejectionNotes: approvalNotes
      });
      
      setToast('Purchase Order rejected successfully!');
      setShowApprovalModal(false);
      setSelectedPO(null);
      setApprovalNotes('');
      
      // Refresh both purchase orders and stats
      await Promise.all([fetchPurchaseOrders(), fetchStats()]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Failed to reject purchase order: ${errorMessage}`);
    }
  };

  const openApprovalModal = (po) => {
    setSelectedPO(po);
    setShowApprovalModal(true);
  };

  const handleGeneratePurchaseOrderCostPDF = async () => {
    try {
      setLoading(true);
      const response = await generatePurchaseOrderCostPDF();
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchase-order-cost-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Purchase order cost report PDF generated successfully!');
    } catch (err) {
      setError('Failed to generate purchase order cost PDF');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpanded = (id) => expandedIds.has(id);
  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredPOs = purchaseOrders.filter(po => {
    if (filter === 'all') return true;
    return po.status === filter;
  });

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-gray-600">Loading Purchase Orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold section-title mb-2">
          Purchase Order Management
        </h1>
        <p className="text-muted">
          Review and approve purchase orders for inventory payments. Role: Finance Manager
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {toast && (
        <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 border border-green-200">
          {toast}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 border border-green-200">
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Purchase Order Statistics</h2>
        <div className="flex gap-2">
          <button
            onClick={handleGeneratePurchaseOrderCostPDF}
            disabled={loading}
            className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Cost Report'}
          </button>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted mb-1">Total POs</h3>
              <p className="text-2xl font-bold text-white">
                {stats.totalPOs || 0}
              </p>
            </div>
            <div className="text-3xl text-blue-400">📄</div>
          </div>
        </div>
        <div className="glass-panel p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted mb-1">Total Value</h3>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalValue || 0)}
              </p>
            </div>
            <div className="text-3xl text-green-400">💰</div>
          </div>
        </div>
        <div className="glass-panel p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted mb-1">Pending Approval</h3>
              <p className="text-2xl font-bold text-white">
                {stats.submitted || 0}
              </p>
            </div>
            <div className="text-3xl text-yellow-400">⏳</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by PO number, supplier, or part..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="md:w-48">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Status</option>
            <option value="submitted">Awaiting Approval</option>
            <option value="approved">Approved</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {filteredPOs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No purchase orders found
          </div>
        ) : (
          filteredPOs.map((po) => (
            <div key={po._id} className="glass-panel border border-white/10">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleExpanded(po._id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {isExpanded(po._id) ? '▼' : '▶'}
                    </button>
                    <div>
                      <h3 className="font-semibold text-white">{po.poNumber}</h3>
                      <p className="text-sm text-muted">
                        Supplier: {po.supplier?.companyName || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[po.status]}`}>
                      {statusLabels[po.status]}
                    </span>
                    <div className="text-right">
                      <p className="text-sm text-muted">Items: {po.items?.length || 0}</p>
                      <p className="font-semibold text-white">
                        Total: {formatCurrency(po.totalAmount)}
                      </p>
                    </div>
                    {po.status === 'submitted' && (
                      <button
                        onClick={() => openApprovalModal(po)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                      >
                        Review & Approve
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded(po._id) && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-white mb-2">Order Details</h4>
                        <div className="space-y-1 text-sm text-muted">
                          <p>Expected Delivery: {formatDate(po.expectedDeliveryDate)}</p>
                          <p>Submitted: {formatDate(po.submittedAt)}</p>
                          {po.approvedAt && <p>Approved: {formatDate(po.approvedAt)}</p>}
                          {po.notes && <p>Notes: {po.notes}</p>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-2">Items</h4>
                        <div className="space-y-1 text-sm text-muted">
                          {po.items?.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{item.part?.name || 'Unknown Part'}</span>
                              <span>{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Review Purchase Order</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>PO Number:</strong> {selectedPO.poNumber}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Supplier:</strong> {selectedPO.supplier?.companyName || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Total Amount:</strong> {formatCurrency(selectedPO.totalAmount)}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Items:</strong> {selectedPO.items?.length || 0} items
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Notes
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary/50"
                rows="3"
                placeholder="Add any notes about this approval..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleApprovePO(selectedPO._id)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleRejectPO(selectedPO._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedPO(null);
                  setApprovalNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPaymentManagement;
