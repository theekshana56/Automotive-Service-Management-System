import React from 'react';

const StatusBadge = ({ status, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-slate-600 text-slate-200',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    submitted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    delivered: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    low: 'bg-red-500/20 text-red-400 border-red-500/30',
    normal: 'bg-green-500/20 text-green-400 border-green-500/30'
  };

  const statusVariants = {
    draft: 'draft',
    submitted: 'submitted',
    approved: 'approved',
    delivered: 'delivered',
    low: 'low',
    normal: 'normal',
    active: 'success',
    inactive: 'error',
    create: 'success',
    update: 'warning',
    delete: 'error'
  };

  const finalVariant = statusVariants[status?.toLowerCase()] || variant;
  const variantClasses = variants[finalVariant] || variants.default;

  return (
    <span className={`
      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
      ${variantClasses} ${className}
    `}>
      {status}
    </span>
  );
};

export default StatusBadge;