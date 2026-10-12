import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Plus,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useSocketEvent, useAdminSocket } from '../../hooks/useSocket';

export const AdminInventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'low', 'out'
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useAdminSocket();

  useEffect(() => {
    loadInventory();
  }, []);

  useSocketEvent('inventory:updated', () => {
    loadInventory();
  });

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await apiService.getProducts({ limit: 100 });
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      setUpdatingId(productId);
      await apiService.updateStock(productId, { stock: Math.max(0, parseInt(newStock, 10) || 0) });
      toast.success('Stock updated');
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, stock: Math.max(0, parseInt(newStock, 10) || 0), isAvailable: newStock > 0 }
            : p
        )
      );
    } catch (err) {
      toast.error('Failed to update stock');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Checking inventory levels..." />;
  }

  const lowStockThreshold = 10;
  const lowStockItems = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold);
  const outOfStockItems = products.filter((p) => p.stock <= 0 || !p.isAvailable);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (filter === 'low') return p.stock > 0 && p.stock <= lowStockThreshold;
    if (filter === 'out') return p.stock <= 0 || !p.isAvailable;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track product stock counts, manage restocks, and avoid midnight stockouts.
          </p>
        </div>

        <button
          onClick={loadInventory}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-black hover:border-slate-300 font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilter('all')}
          className={`bg-white rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${
            filter === 'all' ? 'border-brand-orange ring-2 ring-brand-orange/20' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total SKUs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{products.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active catalog snacks</div>
        </div>

        <div
          onClick={() => setFilter('low')}
          className={`bg-white rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${
            filter === 'low' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{lowStockItems.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Stock below {lowStockThreshold} units</div>
        </div>

        <div
          onClick={() => setFilter('out')}
          className={`bg-white rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${
            filter === 'out' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Out of Stock</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{outOfStockItems.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Urgent restock needed</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by snack name or category..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-black'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'low' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:text-black'
            }`}
          >
            Low Stock ({lowStockItems.length})
          </button>
          <button
            onClick={() => setFilter('out')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'out' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:text-black'
            }`}
          >
            Out of Stock ({outOfStockItems.length})
          </button>
        </div>
      </div>

      {/* MOBILE VIEW (< md): Mobile Stock Cards */}
      <div className="md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
            <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-700">No products found</div>
            <p className="text-[11px] text-slate-400 mt-1">No snack items match this inventory filter.</p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isOut = p.stock <= 0;
            const isLow = p.stock > 0 && p.stock <= lowStockThreshold;

            return (
              <div
                key={p._id}

              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {p.brand || 'Bro Code'} • {formatCurrency(p.price)}
                    </div>
                  </div>
                </div>

                {isOut ? (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-extrabold text-[10px] border border-rose-200 shrink-0">
                    Out of Stock
                  </span>
                ) : isLow ? (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[10px] border border-amber-200 shrink-0">
                    Low Stock
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200 shrink-0">
                    In Stock
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold">Current Stock: </span>
                  <span className={`font-black ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                    {p.stock} units
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-slate-400 font-bold mr-1">Add:</span>
                  <button
                    onClick={() => handleStockUpdate(p._id, p.stock + 10)}
                    disabled={updatingId === p._id}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-orange hover:text-black text-slate-700 text-[11px] font-bold transition-colors"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleStockUpdate(p._id, p.stock + 25)}
                    disabled={updatingId === p._id}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-orange hover:text-black text-slate-700 text-[11px] font-bold transition-colors"
                  >
                    +25
                  </button>
                  <button
                    onClick={() => handleStockUpdate(p._id, p.stock + 50)}
                    disabled={updatingId === p._id}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-orange hover:text-black text-slate-700 text-[11px] font-bold transition-colors"
                  >
                    +50
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>


      {/* DESKTOP/TABLET VIEW (>= md): Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Snack Item</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-xs">
                    No snack items match this inventory filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOut = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= lowStockThreshold;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                e.target.src =
                                  'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80';
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.brand ? `${p.brand} • ` : ''}{p.weight || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                      {p.brand || 'Bro Code'}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isOut ? (
                        <span className="inline-block px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-extrabold text-[10px] border border-rose-200">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-block px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[10px] border border-amber-200">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => handleStockUpdate(p._id, p.stock + 10)}
                          disabled={updatingId === p._id}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-orange hover:text-black text-slate-700 text-[11px] font-bold transition-colors"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleStockUpdate(p._id, p.stock + 25)}
                          disabled={updatingId === p._id}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-orange hover:text-black text-slate-700 text-[11px] font-bold transition-colors"
                        >
                          +25
                        </button>
                        <button
                          onClick={() => handleStockUpdate(p._id, p.stock + 50)}
                          disabled={updatingId === p._id}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-orange hover:text-black text-slate-700 text-[11px] font-bold transition-colors"
                        >
                          +50
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        </div>
      </div>
    </div>
  );
};
