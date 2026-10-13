import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  PackageOpen,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';
import { apiService } from '../services/api';

export const CartPage = () => {
  const { items, totalItems, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    apiService.getSettings().then((res) => setSettings(res.data)).catch(() => {});
  }, []);

  const deliveryCharge = totalItems > 0 ? (settings?.deliveryFee ?? 10) : 0;
  const totalAmount = subtotal + deliveryCharge;


  // Empty state
  if (totalItems === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 mx-auto mb-4 bg-[#1E1E1E] rounded-3xl flex items-center justify-center text-4xl border border-[#2A2A2A]">
          📦
        </div>
        <h2 className="text-xl font-black text-white">Your cart is empty</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Looks like you haven't added any snacks yet.
        </p>
        <div className="mt-6">
          <Link
            to="/menu"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-brand-orange hover:bg-brand-yellow text-black font-black text-xs sm:text-sm shadow-brand transition-transform active:scale-95"
          >
            <span>Explore Snacks</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 min-h-[85vh]">
      <div className="bg-[#181818] rounded-3xl border border-[#262626] p-5 sm:p-7 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
          <h1 className="text-lg sm:text-xl font-black text-white">
            Your Cart <span className="text-slate-400 font-semibold text-sm">({totalItems} items)</span>
          </h1>
          <button
            onClick={clearCart}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Items List */}
        <div className="divide-y divide-[#262626] my-4">
          {items.map(({ product, quantity }) => (
            <div key={product._id} className="py-4 flex items-center justify-between gap-3">
              {/* Product Media & Info */}
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center p-1.5 shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.src =
                        'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-1 max-w-[160px] sm:max-w-xs">
                    {product.name}
                  </h3>
                  <div className="text-xs font-black text-white mt-0.5">
                    {formatCurrency(product.price ?? product.sellingPrice ?? product.selling_price)}
                  </div>
                </div>
              </div>

              {/* Stepper & Trash Icon */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 bg-[#222222] border border-[#2E2E2E] rounded-full p-1">
                  <button
                    onClick={() => updateQuantity(product._id, quantity - 1)}
                    className="w-6 h-6 rounded-full bg-[#2E2E2E] text-slate-200 hover:bg-brand-orange hover:text-black flex items-center justify-center font-bold shadow-xs"
                    aria-label="Decrease"
                  >
                    <Minus className="w-3 h-3 stroke-[3]" />
                  </button>
                  <span className="text-xs font-black text-white min-w-4 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(product._id, quantity + 1)}
                    disabled={quantity >= (product.stock || 99)}
                    className="w-6 h-6 rounded-full bg-brand-orange text-black hover:bg-brand-yellow flex items-center justify-center font-bold shadow-xs disabled:opacity-40"
                    aria-label="Increase"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(product._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bill Summary */}
        <div className="pt-4 border-t border-[#262626] space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span>Subtotal</span>
            <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>Delivery Charge</span>
            <span className="font-bold text-white">{formatCurrency(deliveryCharge)}</span>
          </div>

          <div className="pt-3 border-t border-[#2E2E2E] flex items-center justify-between text-base font-black text-white">
            <span>Total</span>
            <span className="text-lg text-white">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Checkout CTA */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 px-6 rounded-full bg-brand-orange hover:bg-brand-yellow text-black font-black text-sm flex items-center justify-center space-x-2 shadow-brand transition-transform active:scale-95"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
