import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.jsx';
import api from '../../api/client';

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

  // Role-based access control helpers
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isInventoryManager = user?.role === 'inventory_manager' || user?.role === 'manager' || user?.role === 'admin';

  const statusColors = {
    draft: '#6B7280',
    submitted: '#F59E0B',
    approved: '#10B981',
    delivered: '#3B82F6'
  };

  const statusLabels = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    delivered: 'Delivered'
  };

  // Move these above useEffect
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
      // Safely access response data with defaults
      const purchaseOrders = response.data?.purchaseOrders || [];
      const pagination = response.data?.pagination || {};
      setPurchaseOrders(purchaseOrders);
      setTotalPages(pagination.totalPages || 0);
    } catch (err) {
      console.error('Error fetching POs:', err);
      // Set default values on error
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
            alert('Access denied. Only Inventory Managers can submit purchase orders.');
            return;
          }
          break;
        case 'approved':
          endpoint = `approve`;
          action = 'approve';
          requiredRole = 'Manager';
          if (!isManager) {
            alert('Access denied. Only Managers can approve purchase orders.');
            return;
          }
          break;
        case 'delivered':
          endpoint = `deliver`;
          action = 'deliver';
          requiredRole = 'Inventory Manager';
          if (!isInventoryManager) {
            alert('Access denied. Only Inventory Managers can mark purchase orders as delivered.');
            return;
          }
          break;
        default:
          return;
      }
      
      await api.patch(`/api/purchase-orders/${poId}/${endpoint}`);
      
      // Refresh the list
      fetchPurchaseOrders();
      fetchStats();
      
      // Show success message
      alert(`Purchase Order ${action}d successfully by ${requiredRole}!`);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      alert(`Failed to ${newStatus} purchase order: ${errorMessage}`);
      console.error(`Error ${newStatus}ing PO:`, err);
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        alert('Access denied. You do not have the required role for this action.');
      }
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

  const filteredPOs = (purchaseOrders || []).filter(po => {
    if (searchTerm) {
      return (
        po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.items?.some(item => 
          item.part?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.part?.partNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading Purchase Orders...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
             {/* Header */}
       <div style={styles.header}>
         <div style={styles.headerLeft}>
           <h1 style={styles.title}>Purchase Orders</h1>
           {user && (
             <div style={styles.userRole}>
               <span style={styles.roleLabel}>Role:</span>
               <span style={{
                 ...styles.roleBadge,
                 backgroundColor: isManager ? '#10B981' : isInventoryManager ? '#3B82F6' : '#6B7280'
               }}>
                 {user.role === 'admin' ? 'Admin' : 
                  user.role === 'manager' ? 'Manager' : 
                  user.role === 'inventory_manager' ? 'Inventory Manager' : 
                  user.role === 'user' ? 'User' : 'Unknown'}
               </span>
             </div>
           )}
         </div>
         {isInventoryManager && (
           <div style={{ display: 'flex', gap: '1rem' }}>
             <button 
               onClick={() => {
                 const link = document.createElement('a');
                 link.href = `/api/purchase-orders/download/all-pdf?status=${filter}`;
                 link.download = `PurchaseOrders-Summary-${new Date().toISOString().split('T')[0]}.pdf`;
                 link.click();
               }}
               style={{
                 ...styles.createButton,
                 background: '#059669',
                 border: 'none'
               }}
             >
               📄 Download All PDFs
             </button>
             <button 
               onClick={() => navigate('/purchase-orders/new')}
               style={styles.createButton}
             >
               + Create New PO
             </button>
           </div>
         )}
       </div>

      {/* Statistics Cards */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>{stats.totalPOs || 0}</h3>
          <p style={styles.statLabel}>Total POs</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>{formatCurrency(stats.totalValue || 0)}</h3>
          <p style={styles.statLabel}>Total Value</p>
        </div>
        {stats.statusBreakdown?.map(stat => (
          <div key={stat._id} style={styles.statCard}>
            <h3 style={styles.statNumber}>{stat.count}</h3>
            <p style={styles.statLabel}>{statusLabels[stat._id] || stat._id}</p>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div style={styles.controls}>
        <div style={styles.filterGroup}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
        
        <div style={styles.searchGroup}>
          <input
            type="text"
            placeholder="Search by PO number, supplier, or part..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Purchase Orders List */}
      <div style={styles.poList}>
        {filteredPOs.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No purchase orders found</p>
          </div>
        ) : (
          filteredPOs.map(po => (
            <div key={po._id} style={styles.poCard}>
              {/* PO Header */}
              <div style={styles.poHeader}>
                <div style={styles.poInfo}>
                  <h3 style={styles.poNumber}>{po.poNumber}</h3>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: statusColors[po.status]
                  }}>
                    {statusLabels[po.status]}
                  </span>
                </div>
                                 <div style={styles.poActions}>
                   {/* Submit button - Only Inventory Managers can submit */}
                   {po.status === 'draft' && isInventoryManager && (
                     <button
                       onClick={() => handleStatusChange(po._id, 'submitted')}
                       style={styles.actionButton}
                       title="Submit Purchase Order (Inventory Manager only)"
                     >
                       Submit
                     </button>
                   )}
                   
                   {/* Approve button - Only Managers can approve */}
                   {po.status === 'submitted' && isManager && (
                     <button
                       onClick={() => handleStatusChange(po._id, 'approved')}
                       style={styles.actionButton}
                       title="Approve Purchase Order (Manager only)"
                     >
                       Approve
                     </button>
                   )}
                   
                   {/* Deliver button - Only Inventory Managers can mark as delivered */}
                   {po.status === 'approved' && isInventoryManager && (
                     <button
                       onClick={() => handleStatusChange(po._id, 'delivered')}
                       style={styles.actionButton}
                       title="Mark as Delivered (Inventory Manager only)"
                     >
                       Mark Delivered
                     </button>
                   )}
                   
                   {/* Show role requirement message for non-authorized users */}
                   {po.status === 'submitted' && !isManager && (
                     <span style={styles.roleMessage}>
                       ⏳ Awaiting Manager Approval
                     </span>
                   )}
                   
                   {po.status === 'approved' && !isInventoryManager && (
                     <span style={styles.roleMessage}>
                       ✅ Ready for Delivery
                     </span>
                     )}
                   
                   {/* Download PDF button - Available for all purchase orders */}
                   <button
                     onClick={() => {
                       const link = document.createElement('a');
                       link.href = `/api/purchase-orders/${po._id}/pdf`;
                       link.download = `PO-${po.poNumber || po._id}.pdf`;
                       link.click();
                     }}
                     style={{
                       ...styles.actionButton,
                       background: '#059669',
                       border: 'none',
                       color: 'white'
                     }}
                     title="Download Purchase Order as PDF"
                   >
                     📄 PDF
                   </button>
                 </div>
              </div>

              {/* Supplier Info */}
              <div style={styles.supplierInfo}>
                <strong>Supplier:</strong> {po.supplier?.name || 'N/A'}
                <br />
                <strong>Expected Delivery:</strong> {formatDate(po.expectedDeliveryDate)}
              </div>

              {/* Items */}
              <div style={styles.itemsSection}>
                <h4 style={styles.itemsTitle}>Items ({po.items?.length || 0})</h4>
                <div style={styles.itemsList}>
                  {po.items?.map((item, index) => (
                    <div key={index} style={styles.itemRow}>
                      <span style={styles.itemName}>
                        {item.part?.name || 'Unknown Part'} ({item.part?.partNumber || 'N/A'})
                      </span>
                      <span style={styles.itemQuantity}>Qty: {item.quantity}</span>
                      <span style={styles.itemPrice}>{formatCurrency(item.unitPrice)}</span>
                      <span style={styles.itemTotal}>{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div style={styles.financialSummary}>
                <div style={styles.financialRow}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(po.subtotal)}</span>
                </div>
                <div style={styles.financialRow}>
                  <span>Tax:</span>
                  <span>{formatCurrency(po.tax)}</span>
                </div>
                <div style={styles.financialRow}>
                  <span>Shipping:</span>
                  <span>{formatCurrency(po.shipping)}</span>
                </div>
                <div style={styles.financialRow}>
                  <strong>Total:</strong>
                  <strong>{formatCurrency(po.totalAmount)}</strong>
                </div>
              </div>

              {/* Timestamps */}
              <div style={styles.timestamps}>
                <small>Created: {formatDate(po.createdAt)}</small>
                {po.submittedAt && <small>Submitted: {formatDate(po.submittedAt)}</small>}
                {po.approvedAt && <small>Approved: {formatDate(po.approvedAt)}</small>}
                {po.deliveredAt && <small>Delivered: {formatDate(po.deliveredAt)}</small>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={styles.paginationButton}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#1a1a1a',
    minHeight: '100vh',
    color: '#ffffff'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  userRole: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  roleLabel: {
    fontSize: '14px',
    color: '#cccccc'
  },
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0
  },
  createButton: {
    backgroundColor: '#10B981',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#2d2d2d',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #404040'
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#10B981',
    margin: '0 0 8px 0'
  },
  statLabel: {
    color: '#cccccc',
    margin: 0,
    fontSize: '14px'
  },
  controls: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    flexWrap: 'wrap'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  filterSelect: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #404040',
    backgroundColor: '#2d2d2d',
    color: '#ffffff',
    fontSize: '14px'
  },
  searchGroup: {
    flex: 1,
    minWidth: '300px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #404040',
    backgroundColor: '#2d2d2d',
    color: '#ffffff',
    fontSize: '14px'
  },
  poList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '30px'
  },
  poCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #404040',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  poHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  poInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  poNumber: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
    alignSelf: 'flex-start'
  },
  poActions: {
    display: 'flex',
    gap: '10px'
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  roleMessage: {
    color: '#F59E0B',
    fontSize: '12px',
    fontStyle: 'italic',
    padding: '8px 12px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(245, 158, 11, 0.3)'
  },
  supplierInfo: {
    backgroundColor: '#404040',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#cccccc',
    lineHeight: '1.6'
  },
  itemsSection: {
    marginBottom: '20px'
  },
  itemsTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 12px 0'
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  itemRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '12px',
    backgroundColor: '#404040',
    borderRadius: '6px',
    alignItems: 'center'
  },
  itemName: {
    fontWeight: '500',
    color: '#ffffff'
  },
  itemQuantity: {
    color: '#cccccc',
    textAlign: 'center'
  },
  itemPrice: {
    color: '#cccccc',
    textAlign: 'center'
  },
  itemTotal: {
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'right'
  },
  financialSummary: {
    backgroundColor: '#404040',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  financialRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    color: '#cccccc'
  },
  timestamps: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    color: '#888888',
    fontSize: '12px'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px'
  },
  paginationButton: {
    backgroundColor: '#3B82F6',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  pageInfo: {
    color: '#cccccc',
    fontSize: '14px'
  },
  loading: {
    textAlign: 'center',
    fontSize: '1.2rem',
    color: '#cccccc',
    padding: '40px'
  },
  emptyState: {
    textAlign: 'center',
    color: '#888888',
    padding: '40px'
  }
};

export default PurchaseOrdersPage;
