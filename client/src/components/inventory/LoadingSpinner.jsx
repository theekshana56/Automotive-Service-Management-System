import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="bg-app min-h-screen flex items-center justify-center">
      <div className="card text-center p-8">
        <div className={`${sizeClasses[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4`}></div>
        <div className="text-slate-300">{message}</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;