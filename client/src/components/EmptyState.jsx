import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are no snacks matching your search or filters.',
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-midnight-900/60 border border-slate-800 rounded-2xl">
      <div className="w-16 h-16 rounded-2xl bg-midnight-800 flex items-center justify-center text-brand-amber mb-4 border border-brand-amber/20 shadow-neon">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      {actionLink && actionText && (
        <Link
          to={actionLink}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-amber to-brand-orange text-midnight-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-neon"
        >
          {actionText}
        </Link>
      )}
      {!actionLink && onAction && actionText && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-amber to-brand-orange text-midnight-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-neon"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
