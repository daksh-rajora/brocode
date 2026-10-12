import React from 'react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-brand-amber/30 border-t-brand-amber animate-spin`}
      />
      {text && <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">{text}</p>}
    </div>
  );
};
