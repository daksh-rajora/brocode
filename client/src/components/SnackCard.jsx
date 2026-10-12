import React, { useState } from 'react';
import { Plus, Minus, Heart, Star } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useCart } from '../hooks/useCart';

export const SnackCard = ({ snack, onOpenDetails }) => {
  const { items, addItem, updateQuantity } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const cartItem = items.find((item) => item.product._id === snack._id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = !snack.isAvailable || snack.stock <= 0;

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (quantityInCart < snack.stock) {
      if (quantityInCart === 0) {
        addItem(snack, 1);
      } else {
        updateQuantity(snack._id, quantityInCart + 1);
      }
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (quantityInCart > 0) {
      updateQuantity(snack._id, quantityInCart - 1);
    }
  };

  const toggleWishlist = (e) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <div
      onClick={() => onOpenDetails && onOpenDetails(snack)}
      className="group bg-[#181818] rounded-2xl border border-[#262626] hover:border-brand-orange/60 p-3 sm:p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-card cursor-pointer relative"
    >
      {/* Top Header: Badge + Wishlist */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div>
          {snack.hostelFavorite ? (
            <span className="inline-block px-2 py-0.5 rounded-full bg-brand-orange text-black font-extrabold text-[10px] uppercase tracking-wide">
              Bestseller
            </span>
          ) : snack.isVeg ? (
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-semibold border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Veg</span>
            </span>
          ) : null}
        </div>

        <button
          onClick={toggleWishlist}
          className={`p-1.5 rounded-full hover:bg-[#252525] transition-colors ${
            isWishlisted ? 'text-rose-500' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Center Image */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#222222] flex items-center justify-center p-2 mb-3">
        <img
          src={snack.imageUrl || snack.image}
          alt={snack.name}
          loading="lazy"
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src =
              'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
          }}
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center">
            <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 text-[11px] font-bold border border-rose-800">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Details & Actions */}
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-brand-orange transition-colors line-clamp-2 leading-snug min-h-[2.5rem]">
          {snack.name}
        </h3>

        <div className="mt-2 pt-2 border-t border-[#262626] flex items-center justify-between gap-2">
          {/* Price */}
          <div>
            <div className="text-base sm:text-lg font-black text-white">
              {formatCurrency(snack.price)}
            </div>
            {snack.weight && (
              <div className="text-[10px] text-slate-400 font-medium">
                {snack.weight}
              </div>
            )}
          </div>

          {/* Add Button or Stepper */}
          <div>
            {isOutOfStock ? (
              <button
                disabled
                className="px-3 py-1.5 rounded-full bg-[#242424] text-slate-500 text-xs font-semibold cursor-not-allowed"
              >
                Out of Stock
              </button>
            ) : quantityInCart > 0 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-1.5 bg-[#251D12] border border-brand-orange rounded-full p-1 shadow-xs"
              >
                <button
                  onClick={handleDecrement}
                  aria-label="Decrease quantity"
                  className="w-6 h-6 rounded-full bg-[#2A2A2A] text-slate-200 hover:bg-brand-orange hover:text-black flex items-center justify-center font-bold transition-colors shadow-xs"
                >
                  <Minus className="w-3 h-3 stroke-[3]" />
                </button>
                <span className="text-xs font-black text-white min-w-4 text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={quantityInCart >= snack.stock}
                  aria-label="Increase quantity"
                  className="w-6 h-6 rounded-full bg-brand-orange text-black hover:bg-brand-yellow flex items-center justify-center font-bold transition-colors shadow-xs disabled:opacity-40"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleIncrement}
                className="px-4 py-1.5 rounded-full bg-brand-orange hover:bg-brand-yellow text-black font-extrabold text-xs transition-transform active:scale-95 shadow-sm"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
