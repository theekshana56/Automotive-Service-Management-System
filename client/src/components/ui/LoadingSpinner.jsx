import React from 'react';

export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`loading-spinner ${sizeClasses[size]} mb-3`}></div>
      {text && (
        <p className="text-slate-400 text-sm animate-pulse">{text}</p>
      )}
    </div>
  );
}