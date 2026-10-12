import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ArrowUpDown, SlidersHorizontal, Check } from 'lucide-react';
import { apiService } from '../services/api';
import { SnackCard } from '../components/SnackCard';
import { SnackModal } from '../components/SnackModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useSocketEvent } from '../hooks/useSocket';

export const MenuPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlSearch);
  const [sortBy, setSortBy] = useState('recommended');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedSnack, setSelectedSnack] = useState(null);

  useEffect(() => {
    if (urlSearch) setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    loadProducts();
  }, [search, sortBy, inStockOnly]);

  // Real-time socket events + fallback interval polling
  useSocketEvent('inventory:updated', () => {
    loadProducts();
  });

  useSocketEvent('order:created', () => {
    loadProducts();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      loadProducts(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [search, sortBy, inStockOnly]);

  const loadProducts = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const params = {
        search: search.trim() || undefined,
        inStockOnly: inStockOnly || undefined,
        sort: sortBy,
      };
      const res = await apiService.getProducts(params);
      setProducts(res.data || []);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(search ? { search } : {});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen text-slate-100">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          All Snacks & Drinks
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Order late night munchies, hot instant noodles, and chilled drinks for your room.
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snacks, chips, Maggi, Oreo, Coke..."
            className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-brand-orange rounded-full pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 shadow-soft focus:outline-none"
          />
        </form>
      </div>

      {/* Filter and Control Bar (No Categories) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#262626]">
        <div className="text-xs text-slate-400 font-bold">
          Showing <span className="text-white">{products.length}</span> snacks
        </div>

        {/* Dropdown controls for Sort & In Stock */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center space-x-1 ${
              inStockOnly
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-[#181818] text-slate-300 border-[#2A2A2A]'
            }`}
          >
            <span>In Stock Only</span>
          </button>

          <div className="flex items-center space-x-1.5 bg-[#181818] border border-[#2A2A2A] rounded-full px-3 py-1.5 text-xs font-bold text-slate-200 shadow-soft">
            <ArrowUpDown className="w-3.5 h-3.5 text-brand-orange" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold text-slate-200"
            >
              <option value="recommended" className="bg-[#181818] text-white">Sort: Popular</option>
              <option value="price_asc" className="bg-[#181818] text-white">Price: Low to High</option>
              <option value="price_desc" className="bg-[#181818] text-white">Price: High to Low</option>
              <option value="rating" className="bg-[#181818] text-white">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching snacks catalog..." />
      ) : products.length === 0 ? (
        <div className="bg-[#181818] rounded-3xl border border-[#282828] p-12 text-center max-w-md mx-auto">
          <span className="text-4xl">📦</span>
          <h3 className="text-base font-bold text-white mt-3">No snacks available right now</h3>
          <p className="text-xs text-slate-400 mt-1">
            {search
              ? `No snacks found matching "${search}". Try another term.`
              : 'Our hostel pantry is being restocked. Check back in a few minutes!'}
          </p>
          {(search || inStockOnly) && (
            <button
              onClick={() => {
                setSearch('');
                setInStockOnly(false);
                setSortBy('recommended');
                setSearchParams({});
              }}
              className="mt-4 px-5 py-2 rounded-full bg-brand-orange text-black font-bold text-xs"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {products.map((snack) => (
            <SnackCard
              key={snack._id}
              snack={snack}
              onOpenDetails={(s) => setSelectedSnack(s)}
            />
          ))}
        </div>
      )}

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
