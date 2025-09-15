import React from 'react';

export default function StatusBadge({ status, type = 'default', size = 'sm' }) {
  const getStatusConfig = () => {
    switch (type) {
      case 'stock':
        return {
          'In Stock': 'status-badge-success',
          'Low Stock': 'status-badge-warning',
          'Out of Stock': 'status-badge-danger'
        };
      case 'po':
        return {
          'draft': 'status-badge-info',
          'submitted': 'status-badge-warning',
          'approved': 'status-badge-success',
          'delivered': 'status-badge-primary'
        };
      case 'active':
        return {
          'true': 'status-badge-success',
          'false': 'status-badge-danger',
          'active': 'status-badge-success',
          'inactive': 'status-badge-danger'
        };
      default:
        return {
          'success': 'status-badge-success',
          'warning': 'status-badge-warning',
          'error': 'status-badge-danger',
          'info': 'status-badge-info'
        };
    }
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const statusConfig = getStatusConfig();
  const statusClass = statusConfig[status] || 'status-badge';
  
  const formatStatus = (status) => {
    if (typeof status === 'boolean') {
      return status ? 'Active' : 'Inactive';
    }
    return status?.toString().replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) || 'Unknown';
  };

  return (
    <span className={`${statusClass} ${sizeClasses[size]} font-medium`}>
      {formatStatus(status)}
    </span>
  );
}