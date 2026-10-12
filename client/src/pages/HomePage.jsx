import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';
import { SnackCard } from '../components/SnackCard';
import { SnackModal } from '../components/SnackModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useSocketEvent } from '../hooks/useSocket';

export const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSnack, setSelectedSnack] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  useSocketEvent('inventory:updated', () => {
    loadProducts();
  });

  useSocketEvent('order:created', () => {
    loadProducts();
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await apiService.getProducts({ limit: 100 });
      setProducts(res.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.brand && p.brand.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-16 text-slate-100 font-sans">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-3 sm:pt-6 space-y-7 sm:space-y-10">
        {/* 1. Curved Dark Hero Banner Card */}
        <section className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#262626] min-h-[340px] sm:min-h-[440px] lg:min-h-[480px] flex items-center bg-[#111111]">
          {/* Background image: cozy midnight lamp hostel room */}
          <div className="absolute inset-0 z-0">
            <img
              src="/hero_midnight_snack.jpg"
              alt="Midnight Hostel Room"
              className="w-full h-full object-cover opacity-75 sm:opacity-70 object-right sm:object-center"
            />
            {/* Dark vignette gradient overlay on left for readable text */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 md:via-black/75 to-transparent" />
          </div>

          {/* Content inside Hero Card */}
          <div className="relative z-10 p-6 sm:p-12 md:p-14 max-w-xl space-y-3 sm:space-y-4 text-white">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] uppercase">
              MIDNIGHT <br />
              <span className="text-brand-yellow font-serif italic text-4xl sm:text-6xl lg:text-7xl tracking-normal normal-case block my-1 sm:my-2 drop-shadow-md">
                CRAVINGS?
              </span>
              WE GOT YOU.
            </h1>

            <p className="text-xs sm:text-base font-semibold text-slate-200 italic pt-0.5">
              Hostel Ki Bhook, Bro Code Ke Naam!
            </p>

            <div className="pt-3 sm:pt-4">
              <a
                href="#snacks"
                className="inline-flex items-center space-x-2.5 px-7 py-3 sm:py-3.5 rounded-full bg-brand-yellow hover:bg-brand-orange text-black font-black text-xs sm:text-base shadow-brand transition-all hover:scale-105 active:scale-95"
              >
                <span>Order Your Cravings</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              </a>
            </div>
          </div>
        </section>

        {/* 2. Real Midnight Snacks Storefront Section (No Categories) */}
        <section id="snacks" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Available Snacks & Drinks</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#241F14] text-brand-orange border border-brand-orange/30 font-bold">
                  {filteredProducts.length} items
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fresh stock delivered directly to your hostel room door.
              </p>
            </div>

            {/* Quick search input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search snacks, chips, noodles..."
                className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-brand-orange rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Product Grid or Clean Empty State */}
          {loading ? (
            <LoadingSpinner text="Loading snacks from store..." />
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[#181818] rounded-3xl border border-[#262626] p-10 sm:p-14 text-center max-w-md mx-auto my-4 shadow-xl">
              <div className="w-20 h-20 mx-auto mb-4 bg-[#222222] rounded-3xl flex items-center justify-center text-4xl border border-[#2E2E2E]">
                🌙
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                No snacks available right now
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                {search
                  ? `No items match "${search}". Try searching for another snack.`
                  : 'Our hostel pantry is being restocked with fresh munchies. Check back soon!'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-4 px-5 py-2 rounded-full bg-brand-orange text-black font-bold text-xs hover:bg-brand-yellow transition-transform active:scale-95"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              {filteredProducts.map((snack) => (
                <SnackCard
                  key={snack._id}
                  snack={snack}
                  onOpenDetails={(s) => setSelectedSnack(s)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 3. Desktop Mid-Page Motivational Banner */}
        <section className="hidden sm:block pt-4">
          <div className="bg-[#111111] text-white rounded-3xl p-8 border border-[#222222] flex items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="space-y-2 z-10 max-w-md">
              <div className="inline-block px-3 py-1 rounded-full bg-[#1E1911] text-brand-orange text-[10px] font-black uppercase tracking-wider border border-brand-orange/40">
                Good Food Better Mood
              </div>
              <h3 className="text-2xl font-black uppercase">
                Assignment pending. <br />
                Sleep missing. <br />
                <span className="text-brand-orange">Snacks sorted.</span>
              </h3>
              <p className="text-xs text-slate-300">
                Hot Maggi, cold drinks, and crunchies delivered in 15 mins.
              </p>
              <div className="pt-2">
                <a
                  href="#snacks"
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-full bg-brand-orange text-black font-black text-xs shadow-brand"
                >
                  <span>Explore Snacks</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </a>
              </div>
            </div>

            <div className="text-6xl pr-6 select-none">
              🍜 🍟 🥤
            </div>
          </div>
        </section>
      </div>

      {/* Modal */}
      {selectedSnack && (
        <SnackModal
          snack={selectedSnack}
          onClose={() => setSelectedSnack(null)}
        />
      )}
    </div>
  );
};
