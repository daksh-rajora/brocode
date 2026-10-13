import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Star,
  Heart,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useCart } from '../hooks/useCart';

export const SnackModal = ({ snack, onClose }) => {
  const { items, addItem, updateQuantity } = useCart();
  const [selectedQty, setSelectedQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!snack) return null;

  const cartItem = items.find((item) => item.product._id === snack._id);
  const currentInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = !snack.isAvailable || snack.stock <= 0;

  const handleAdd = () => {
    if (currentInCart > 0) {
      updateQuantity(snack._id, currentInCart + selectedQty);
    } else {
      addItem(snack, selectedQty);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#181818] rounded-3xl overflow-hidden shadow-2xl border border-[#282828] max-h-[92vh] flex flex-col text-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-[#262626]">
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`p-2 rounded-full hover:bg-[#252525] transition-colors ${
              isWishlisted ? 'text-rose-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Main Product Image */}
          <div className="w-full aspect-[4/3] rounded-2xl bg-[#222222] flex items-center justify-center p-6 border border-[#2A2A2A]">
            <img
              src={snack.imageUrl || snack.image}
              alt={snack.name}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          {/* Title and Rating */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-black text-white leading-tight">
                {snack.name}
              </h2>
            </div>

            <div className="mt-2 flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{snack.rating || 4.8}</span>
                <span className="text-slate-400 font-normal">({snack.reviewCount || 120} reviews)</span>
              </span>

              {snack.isVeg ? (
                <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Vegetarian</span>
                </span>
              ) : null}
            </div>

            <div className="mt-3 text-2xl font-black text-white">
              {formatCurrency(snack.price ?? snack.sellingPrice ?? snack.selling_price)}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {snack.description}
            </p>
          </div>

          {/* Product Details Specs Table */}
          <div className="rounded-2xl border border-[#2A2A2A] bg-[#222222] p-4 space-y-2.5 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2">
              Product Details
            </h4>
            <div className="flex items-center justify-between py-1 border-b border-[#2D2D2D]">
              <span className="text-slate-400">Brand</span>
              <span className="font-bold text-white">{snack.brand || "Bro Code"}</span>
            </div>
            {snack.weight && (
              <div className="flex items-center justify-between py-1 border-b border-[#2D2D2D]">
                <span className="text-slate-400">Package Size</span>
                <span className="font-bold text-white">{snack.weight}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Availability</span>
              {isOutOfStock ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold text-[10px]">
                  <span>Out of Stock</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>In Stock ({snack.stock} available)</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-[#262626] bg-[#181818] flex items-center justify-between gap-4">
          {!isOutOfStock && (
            <div className="flex items-center space-x-3 bg-[#222222] rounded-full px-3 py-1.5 border border-[#2E2E2E]">
              <button
                onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                className="text-slate-300 hover:text-white"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-white min-w-4 text-center">
                {selectedQty}
              </span>
              <button
                onClick={() => setSelectedQty((q) => Math.min(snack.stock, q + 1))}
                disabled={selectedQty >= snack.stock}
                className="text-slate-300 hover:text-white disabled:opacity-30"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex-1 py-3 px-6 rounded-full font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition-transform active:scale-95 shadow-brand ${
              isOutOfStock
                ? 'bg-[#262626] text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-brand-orange hover:bg-brand-yellow text-black'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {isOutOfStock
                ? 'Currently Sold Out'
                : `Add to Cart • ${formatCurrency((snack.price ?? snack.sellingPrice ?? snack.selling_price ?? 0) * selectedQty)}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
