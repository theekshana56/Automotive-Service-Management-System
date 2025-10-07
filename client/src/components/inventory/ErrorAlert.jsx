import React from 'react';

const ErrorAlert = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
      <span className="text-red-400 text-xl">⚠️</span>
      <div className="flex-1 text-red-300">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;