import React from 'react';

const FormSection = ({ title, icon, children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl">{icon}</span>}
          <h2 className="card-title text-lg">{title}</h2>
        </div>
      </div>
      <div className="card-body space-y-6">
        {children}
      </div>
    </div>
  );
};

export default FormSection;