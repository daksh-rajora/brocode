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
import { useSocketEvent } from '../hooks/useSocket';

export const CartPage = () => {
  const { items, totalItems, subtotal, updateQuantity, removeItem, clearCart, syncStock } = useCart();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  const fetchSettings = () => {
    apiService.getSettings().then((res) => setSettings(res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchSettings();
    apiService
      .getProducts({ limit: 100 })
      .then((res) => {
        if (res.data && syncStock) {
          syncStock(res.data);
        }
      })
      .catch(() => {});

    window.addEventListener('focus', fetchSettings);
    return () => window.removeEventListener('focus', fetchSettings);
  }, []);

  // Real-time update when admin updates delivery settings
  useSocketEvent('settings:updated', (updated) => {
    if (updated) {
      setSettings(updated);
    }
  });

  const configuredDeliveryFee =
    typeof settings?.deliveryFee === 'number' && settings.deliveryFee >= 0
      ? settings.deliveryFee
      : 0;
  const deliveryCharge = totalItems > 0 ? configuredDeliveryFee : 0;
  const totalAmount = subtotal + deliveryCharge;

  const outOfStockItems = items.filter(
    (item) => item.product.isAvailable === false || Number(item.product.stock) <= 0
  );
  const hasOutOfStockItems = outOfStockItems.length > 0;

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

        {/* Out of Stock Warning Banner */}
        {hasOutOfStockItems && (
          <div className="mt-4 p-3 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-center space-x-2.5 text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Some snacks in your cart are currently out of stock. Please remove them before proceeding to checkout.
            </span>
          </div>
        )}

        {/* Items List */}
        <div className="divide-y divide-[#262626] my-4">
          {items.map(({ product, quantity }) => {
            const isItemOut = product.isAvailable === false || Number(product.stock) <= 0;
            return (
              <div key={product._id} className="py-4 flex items-center justify-between gap-3">
                {/* Product Media & Info */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center p-1.5 shrink-0 relative">
                    <img
                      src={product.imageUrl || product.image}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-1 max-w-[160px] sm:max-w-xs">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs font-black text-white">
                        {formatCurrency(product.price ?? product.sellingPrice ?? product.selling_price)}
                      </span>
                      {isItemOut && (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 text-[10px] font-extrabold border border-rose-800">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stepper & Trash Icon */}
                <div className="flex items-center space-x-3 shrink-0">
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
                      disabled={isItemOut || quantity >= (product.stock || 99)}
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
            );
          })}
        </div>

        {/* Bill Summary */}
        <div className="pt-4 border-t border-[#262626] space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span>Subtotal</span>
            <span className="font-bold text-white" data-testid="cart-subtotal">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>Delivery Charge</span>
            <span
              className={`font-bold ${deliveryCharge === 0 ? 'text-emerald-400' : 'text-white'}`}
              data-testid="cart-delivery-charge"
            >
              {deliveryCharge === 0 ? 'FREE (₹0)' : formatCurrency(deliveryCharge)}
            </span>
          </div>

          <div className="pt-3 border-t border-[#2E2E2E] flex items-center justify-between text-base font-black text-white">
            <span>Total</span>
            <span className="text-lg text-white" data-testid="cart-total-amount">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Checkout CTA */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/checkout')}
            disabled={hasOutOfStockItems}
            className={`w-full py-3.5 px-6 rounded-full font-black text-sm flex items-center justify-center space-x-2 transition-transform active:scale-95 ${
              hasOutOfStockItems
                ? 'bg-[#2A2A2A] text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-brand-orange hover:bg-brand-yellow text-black shadow-brand'
            }`}
          >
            <span>{hasOutOfStockItems ? 'Remove Unavailable Items to Checkout' : 'Proceed to Checkout'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
