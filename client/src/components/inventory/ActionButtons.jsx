import React from 'react';

const ActionButtons = ({ 
  onSave, 
  onCancel, 
  loading = false, 
  saveText = 'Save', 
  cancelText = 'Cancel',
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-end gap-4 pt-6 ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        className="btn-secondary px-6 py-3 flex items-center gap-2"
        disabled={loading}
      >
        <span className="text-slate-400">←</span>
        {cancelText}
      </button>
      <button
        type="submit"
        onClick={onSave}
        disabled={loading}
        className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            Saving...
          </>
        ) : (
          <>
            <span>✓</span>
            {saveText}
          </>
        )}
      </button>
    </div>
  );
};

export default ActionButtons;