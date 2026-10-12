import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Plus, ArrowRight, Package, Check, Sparkles } from 'lucide-react';
import { apiService } from '../../services/api';
import { HOME_CATEGORY_CARDS, SNACK_CATEGORIES } from '../../data/hostelConfig';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminCategoriesPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiService.getProducts({ limit: 100 });
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load categories data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading category inventory..." />;
  }

  // Calculate count per category
  const categoryStats = SNACK_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
    const matchingProducts = products.filter((p) => p.category === cat.id);
    const inStockCount = matchingProducts.filter((p) => p.stock > 0).length;
    return {
      ...cat,
      count: matchingProducts.length,
      inStockCount,
      outOfStockCount: matchingProducts.length - inStockCount,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Categories</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize and manage snack catalog categories for hostel students.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/products?action=new')}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-yellow text-black font-extrabold text-xs shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Snack Item</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryStats.map((cat) => {
          const matchingHomeCard = HOME_CATEGORY_CARDS.find((c) => c.id === cat.id);
          const imageSrc = matchingHomeCard?.image || '/packs/lays.jpg';

          return (
            <div
              key={cat.id}
              onClick={() => navigate(`/admin/products?category=${cat.id}`)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-card hover:border-brand-orange transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                    <img
                      src={imageSrc}
                      alt={cat.label}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                    {cat.count} items
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 group-hover:text-brand-orange transition-colors">
                  {cat.label}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {cat.inStockCount} in stock • {cat.outOfStockCount} out of stock
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-orange">
                <span>View Products</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
