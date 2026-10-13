import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Minus,
  Star,
  Heart,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useCart } from '../hooks/useCart';

export const SnackModal = ({ snack, onClose }) => {
  const { items, addItem, updateQuantity } = useCart();
  const [selectedQty, setSelectedQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Normalise gallery images
  const rawImages =
    snack && Array.isArray(snack.images) && snack.images.length > 0
      ? [...snack.images].sort((a, b) => (Number(a.order ?? 0)) - (Number(b.order ?? 0)))
      : [];

  const galleryImages =
    rawImages.length > 0
      ? rawImages.map((img) => (typeof img === 'string' ? { url: img } : img))
      : snack && (snack.imageUrl || snack.image)
      ? [{ url: snack.imageUrl || snack.image, isCover: true }]
      : [{ url: '/packs/lays.jpg', isCover: true }];

  const initialCoverIdx = Math.max(
    0,
    galleryImages.findIndex((img) => img.isCover)
  );
  const [currentIndex, setCurrentIndex] = useState(initialCoverIdx);

  useEffect(() => {
    if (snack) {
      const idx = Math.max(
        0,
        galleryImages.findIndex((img) => img.isCover)
      );
      setCurrentIndex(idx);
    }
  }, [snack?._id]);

  const hasMultiple = galleryImages.length > 1;

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  // Touch swipe gesture handlers (smooth without blocking vertical page scroll)
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY =
      (touchStartY.current !== null ? touchStartY.current : 0) - e.changedTouches[0].clientY;
    const minSwipeDistance = 35;

    // Trigger swipe only when horizontal gesture is greater than vertical gesture
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!snack) return null;

  const cartItem = items.find((item) => item.product._id === snack._id);
  const currentInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = !snack.isAvailable || Number(snack.stock) <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
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
          {/* Product Image Gallery */}
          <div className="space-y-3">
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative w-full aspect-[4/3] rounded-2xl bg-[#222222] flex items-center justify-center p-6 border border-[#2A2A2A] overflow-hidden select-none"
            >
              <img
                data-testid="gallery-main-img"
                src={galleryImages[currentIndex]?.url}
                alt={`${snack.name} - view ${currentIndex + 1}`}
                className="max-h-full max-w-full object-contain transition-opacity duration-200"
                onError={(e) => {
                  e.target.src =
                    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                }}
              />

              {/* Multiple Images Navigation Controls */}
              {hasMultiple && (
                <>
                  {/* Image Counter (e.g., 2 / 5) */}
                  <div
                    data-testid="gallery-counter"
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-black text-white border border-white/10 shadow-sm pointer-events-none"
                  >
                    {currentIndex + 1} / {galleryImages.length}
                  </div>

                  {/* Desktop / Clickable Previous Button */}
                  <button
                    type="button"
                    data-testid="gallery-prev-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrev();
                    }}
                    aria-label="Previous image"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/10 transition-transform active:scale-90 hover:scale-105 shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Desktop / Clickable Next Button */}
                  <button
                    type="button"
                    data-testid="gallery-next-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    aria-label="Next image"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/10 transition-transform active:scale-90 hover:scale-105 shadow-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Image Indicator Dots */}
                  <div
                    data-testid="gallery-dots"
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10"
                  >
                    {galleryImages.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        aria-label={`Go to image ${dotIdx + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex(dotIdx);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          dotIdx === currentIndex
                            ? 'w-5 bg-brand-orange'
                            : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Clickable Thumbnail Strip */}
            {hasMultiple && (
              <div
                data-testid="gallery-thumbnails"
                className="flex items-center space-x-2.5 overflow-x-auto py-1 scrollbar-thin"
              >
                {galleryImages.map((img, thumbIdx) => (
                  <button
                    key={thumbIdx}
                    type="button"
                    data-testid={`gallery-thumb-${thumbIdx}`}
                    onClick={() => setCurrentIndex(thumbIdx)}
                    className={`relative w-14 h-14 rounded-xl border-2 p-1 bg-[#222222] shrink-0 transition-all flex items-center justify-center ${
                      thumbIdx === currentIndex
                        ? 'border-brand-orange ring-2 ring-brand-orange/40 scale-105'
                        : 'border-[#2E2E2E] opacity-60 hover:opacity-100 hover:border-[#444]'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${thumbIdx + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                    {img.isCover && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-orange ring-2 ring-[#181818]" />
                    )}
                  </button>
                ))}
              </div>
            )}
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
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold text-[10px]" data-testid="modal-stock-badge">
                  <span>Unavailable</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[10px]" data-testid="modal-stock-badge">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>In Stock · {snack.stock} available</span>
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
                ? 'Unavailable'
                : `Add to Cart • ${formatCurrency((snack.price ?? snack.sellingPrice ?? snack.selling_price ?? 0) * selectedQty)}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
