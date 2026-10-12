import React from 'react';
import { ORDER_STATUS_CONFIG } from '../data/hostelConfig';

export const StatusBadge = ({ status }) => {
  const config = ORDER_STATUS_CONFIG[status] || {
    label: status || 'Pending',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-500',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor || 'bg-current'} mr-1.5`} />
      {config.label}
    </span>
  );
};
