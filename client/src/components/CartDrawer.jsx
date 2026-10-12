import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';

export const CartDrawer = () => {
  const { totalItems, subtotal } = useCart();
  const location = useLocation();

  // Don't show floating drawer if already on cart or checkout page
  if (
    totalItems === 0 ||
    location.pathname === '/cart' ||
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/admin')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-4 right-4 z-40 max-w-lg mx-auto sm:right-6 sm:left-auto sm:w-96 animate-slide-up">
      <div className="bg-gradient-to-r from-midnight-900 to-midnight-850 border border-brand-amber/40 rounded-2xl p-3.5 shadow-2xl shadow-brand-amber/10 flex items-center justify-between glass-panel-glow">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-amber text-midnight-950 flex items-center justify-center font-black relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-midnight-950 text-brand-amber text-[11px] font-black flex items-center justify-center border border-brand-amber">
              {totalItems}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Cart Subtotal</div>
            <div className="text-base font-extrabold text-white">
              {formatCurrency(subtotal)}
            </div>
          </div>
        </div>

        <Link
          to="/cart"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-amber to-brand-orange text-midnight-950 font-bold text-xs flex items-center space-x-1.5 hover:opacity-90 transition-opacity shadow-neon"
        >
          <span>View Cart</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
