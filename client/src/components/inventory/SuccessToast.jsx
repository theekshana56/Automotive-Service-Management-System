import React, { useEffect } from 'react';

const SuccessToast = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-green-500/90 backdrop-blur-sm text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
        <span className="text-xl">✓</span>
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white/80 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default SuccessToast;