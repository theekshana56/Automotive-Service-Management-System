import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.jsx';
import api from '../../api/client';
import PageHeader from '../../components/inventory/PageHeader';
import StatsCard from '../../components/inventory/StatsCard';
import StatusBadge from '../../components/inventory/StatusBadge';
import SearchInput from '../../components/inventory/SearchInput';
import Pagination from '../../components/inventory/Pagination';
import ActionMenu from '../../components/inventory/ActionMenu';
import LoadingSpinner from '../../components/inventory/LoadingSpinner';
import SuccessToast from '../../components/inventory/SuccessToast';

const PurchaseOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({});
  const [toast, setToast] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isInventoryManager = user?.role === 'inventory_manager' || user?.role === 'manager' || user?.role === 'admin';

  const statusColors = {
    draft: 'draft',
    submitted: 'submitted', 
    approved: 'approved',
    delivered: 'delivered'
  };

  const statusLabels = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    delivered: 'Delivered'
  };

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      if (filter !== 'all') {
        params.append('status', filter);
      }
      const response = await api.get(`/api/purchase-orders?${params}`);
      const purchaseOrders = response.data?.purchaseOrders || [];
      const pagination = response.data?.pagination || {};
      setPurchaseOrders(purchaseOrders);
      setTotalPages(pagination.totalPages || 0);
    } catch (err) {
      console.error('Error fetching POs:', err);
      setPurchaseOrders([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/api/purchase-orders/statistics');
      setStats(response.data || {});
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({});
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchStats();
  }, [filter, currentPage, fetchPurchaseOrders, fetchStats]);

  const handleStatusChange = async (poId, newStatus) => {
    try {
      let endpoint = '';
      let action = '';
      let requiredRole = '';
      
      switch (newStatus) {
        case 'submitted':
          endpoint = `submit`;
          action = 'submit';
          requiredRole = 'Inventory Manager';
          if (!isInventoryManager) {
            setToast('Access denied. Only Inventory Managers can submit purchase orders.');
            return;
          }
          break;
        case 'approved':
          endpoint = `approve`;
          action = 'approve';
          requiredRole = 'Manager';
          if (!isManager) {
            setToast('Access denied. Only Managers can approve purchase orders.');
            return;
          }
          break;
        case 'delivered':
          endpoint = `deliver`;
          action = 'deliver';
          requiredRole = 'Inventory Manager';
          if (!isInventoryManager) {
            setToast('Access denied. Only Inventory Managers can mark purchase orders as delivered.');
            return;
          }
          break;
        default:
          return;
      }
      
      await api.patch(`/api/purchase-orders/${poId}/${endpoint}`);
      
      fetchPurchaseOrders();
      fetchStats();
      
      setToast(`Purchase Order ${action}d successfully!`);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setToast(`Failed to ${newStatus} purchase order: ${errorMessage}`);
      console.error(`Error ${newStatus}ing PO:`, err);
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
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredPOs = (purchaseOrders || []).filter(po => {
    if (searchTerm) {
      return (
        po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.items?.some(item => 
          item.part?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.part?.partNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    return true;
  });

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      value: filter,
      placeholder: 'All Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'approved', label: 'Approved' },
        { value: 'delivered', label: 'Delivered' }
      ]
    }
  ];

  const headerActions = [
    ...(isInventoryManager ? [
      {
        label: 'Create New PO',
        icon: '+',
        onClick: () => navigate('/purchase-orders/new'),
        variant: 'primary'
      }
    ] : [])
  ];

  if (loading) {
    return <LoadingSpinner message="Loading purchase orders..." />;
  }

  return (
    <div className="bg-app min-h-screen">
      <div className="app-container">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title="Purchase Orders"
            subtitle={
              <div className="flex items-center gap-4">
                <span>Manage and track purchase orders</span>
                {user && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Role:</span>
                    <StatusBadge 
                      status={user.role === 'admin' ? 'Admin' : 
                             user.role === 'manager' ? 'Manager' : 
                             user.role === 'inventory_manager' ? 'Inventory Manager' : 
                             'User'} 
                      variant={isManager ? 'success' : isInventoryManager ? 'info' : 'default'}
                    />
                  </div>
                )}
              </div>
            }
            actions={headerActions}
          />

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total POs"
              value={stats.totalPOs || 0}
              icon="📋"
              color="primary"
            />
            <StatsCard
              title="Total Value"
              value={formatCurrency(stats.totalValue || 0)}
              icon="💰"
              color="success"
            />
            {stats.statusBreakdown?.map(stat => (
              <StatsCard
                key={stat._id}
                title={statusLabels[stat._id] || stat._id}
                value={stat.count}
                icon="📊"
                color="info"
              />
            ))}
          </div>

          {/* Filters and Search */}
          <div className="card mb-8">
            <div className="card-body">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
                <div className="flex-1">
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by PO number, supplier, or part..."
                    onClear={() => setSearchTerm('')}
                  />
                </div>
                <div className="w-full lg:w-64">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={filter}
                    onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                    className="select w-full"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Orders List */}
          <div className="space-y-6 mb-8">
            {filteredPOs.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-medium text-slate-300 mb-2">No purchase orders found</h3>
                <p className="text-slate-400">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredPOs.map(po => (
                <div key={po._id} className="card card-hover">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white/5 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpanded(po._id)}
                        className={`w-7 h-7 rounded-md flex items-center justify-center bg-white/10 hover:bg-white/20 transition ${isExpanded(po._id) ? 'rotate-90' : ''}`}
                        title={isExpanded(po._id) ? 'Collapse' : 'Expand'}
                      >
                        ▶
                      </button>
                      <div className="text-sm text-slate-400">PO</div>
                      <h3 className="text-xl font-semibold text-slate-100 tracking-tight">{po.poNumber}</h3>
                      <div className="hidden md:block">
                        <StatusBadge status={statusLabels[po.status]} variant={statusColors[po.status]} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <div className="hidden md:block text-sm text-slate-400 mr-3">
                        <span className="mr-3">Items: <span className="text-slate-200 font-medium">{po.items?.length || 0}</span></span>
                        <span>Total: <span className="text-primary font-semibold">{formatCurrency(po.totalAmount)}</span></span>
                      </div>
                      {/* Status Action Buttons */}
                      {po.status === 'draft' && isInventoryManager && (
                        <button
                          onClick={() => handleStatusChange(po._id, 'submitted')}
                          className="btn-primary text-xs md:text-sm"
                          title="Submit Purchase Order (Inventory Manager only)"
                        >
                          Submit
                        </button>
                      )}
                      {po.status === 'submitted' && isManager && (
                        <button
                          onClick={() => handleStatusChange(po._id, 'approved')}
                          className="btn-primary text-xs md:text-sm"
                          title="Approve Purchase Order (Manager only)"
                        >
                          Approve
                        </button>
                      )}
                      {po.status === 'approved' && isInventoryManager && (
                        <button
                          onClick={() => handleStatusChange(po._id, 'delivered')}
                          className="btn-primary text-xs md:text-sm"
                          title="Mark as Delivered (Inventory Manager only)"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {po.status === 'submitted' && !isManager && (
                        <div className="badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          ⏳ Awaiting Manager Approval
                        </div>
                      )}
                      {po.status === 'approved' && !isInventoryManager && (
                        <div className="badge bg-green-500/20 text-green-400 border-green-500/30">
                          ✅ Ready for Delivery
                        </div>
                      )}
                      <ActionMenu
                        actions={[
                          {
                            label: 'Download PDF',
                            icon: '📄',
                            onClick: () => {
                              const link = document.createElement('a');
                              link.href = `/api/purchase-orders/${po._id}/pdf`;
                              link.download = `PO-${po.poNumber || po._id}.pdf`;
                              link.click();
                            }
                          },
                          ...(isInventoryManager ? [
                            {
                              label: 'Edit',
                              icon: '✏️',
                              onClick: () => navigate(`/purchase-orders/${po._id}`)
                            }
                          ] : [])
                        ]}
                      />
                    </div>
                  </div>

                  {/* Body */}
                  <div className={`card-body ${isExpanded(po._id) ? 'block' : 'hidden'}`}> 
                    {/* Info grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-2">Supplier</h4>
                        <div className="text-slate-200 font-medium">{po.supplier?.companyName || 'N/A'}</div>
                        {po.supplier?.primaryContact?.email && (
                          <div className="text-sm text-slate-400 mt-0.5">{po.supplier.primaryContact.email}</div>
                        )}
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-2">Delivery</h4>
                        <div className="text-slate-200">Expected: {formatDate(po.expectedDeliveryDate)}</div>
                        <div className="text-sm text-slate-400">Payment: {po.paymentTerms || 'N/A'}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-2">Summary</h4>
                        <div className="text-sm text-slate-400">Items: <span className="text-slate-200 font-medium">{po.items?.length || 0}</span></div>
                        <div className="text-sm text-slate-400">Created: <span className="text-slate-200 font-medium">{formatDate(po.createdAt)}</span></div>
                      </div>
                    </div>

                    {/* Items compact list */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Items</h4>
                      <div className="rounded-xl overflow-hidden border border-white/5">
                        <div className="divide-y divide-white/5">
                          {po.items?.slice(0, 5).map((item, index) => (
                            <div key={index} className="grid grid-cols-12 items-center bg-white/5/50">
                              <div className="col-span-6 px-4 py-3">
                                <div className="text-sm font-medium text-slate-200 truncate" title={item.part?.name}>{item.part?.name || 'Unknown Part'}</div>
                                <div className="text-xs text-slate-400">{item.part?.partNumber || 'N/A'}</div>
                              </div>
                              <div className="col-span-2 px-4 py-3 text-sm text-slate-300">Qty: {item.quantity}</div>
                              <div className="col-span-4 px-4 py-3 text-right text-sm font-medium text-primary">{formatCurrency(item.totalPrice)}</div>
                            </div>
                          ))}
                        </div>
                        {po.items?.length > 5 && (
                          <div className="px-4 py-2 text-center text-sm text-slate-400 bg-white/5">+{po.items.length - 5} more items</div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="md:hidden">
                        <StatusBadge status={statusLabels[po.status]} variant={statusColors[po.status]} />
                      </div>
                      <div className="text-sm text-slate-400">Created: {formatDate(po.createdAt)}</div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Total Amount</div>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(po.totalAmount)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <SuccessToast 
        message={toast} 
        onClose={() => setToast('')} 
      />
    </div>
  );
};

export default PurchaseOrdersPage;