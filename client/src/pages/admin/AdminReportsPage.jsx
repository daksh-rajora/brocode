import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Download,
  Calendar,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useSocketEvent, useAdminSocket } from '../../hooks/useSocket';

export const AdminReportsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useAdminSocket();

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, ordersRes] = await Promise.all([
        apiService.getDashboardAnalytics(),
        apiService.getAllOrders({ limit: 200 }),
      ]);
      setAnalytics(analyticsRes.data || null);
      setOrders(ordersRes.data?.orders || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useSocketEvent('analytics:updated', loadReports);
  useSocketEvent('order:created', loadReports);

  if (loading) {
    return <LoadingSpinner text="Computing real sales analytics from database..." />;
  }

  const totalRevenue = analytics?.totalRevenue ?? 0;
  const totalOrders = analytics?.totalOrders ?? orders.length;
  const deliveredOrders = analytics?.deliveredOrders ?? 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Breakdown by payment method from actual orders
  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
  const validOrderCount = nonCancelledOrders.length;
  const codOrders = nonCancelledOrders.filter((o) => o.paymentMethod === 'cash_on_delivery').length;
  const upiOrders = nonCancelledOrders.filter((o) => o.paymentMethod === 'upi_on_delivery').length;

  const codPercent = validOrderCount > 0 ? Math.round((codOrders / validOrderCount) * 100) : 0;
  const upiPercent = validOrderCount > 0 ? Math.round((upiOrders / validOrderCount) * 100) : 0;

  const bestSellers = analytics?.bestSellers || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Financial performance, revenue verification, and delivery insights calculated from persisted orders.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-black font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Summary</span>
        </button>
      </div>

      {/* KPI Cards (100% Real Persisted Calculations) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalRevenue)}</div>
          <div className="text-[11px] text-slate-500 font-bold mt-1">
            Excludes cancelled orders • Persisted records
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalOrders}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {deliveredOrders} completed across hostel blocks
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Order Value</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(avgOrderValue)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Average spent per hostel order</div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900">Payment Breakdown</h3>

          {validOrderCount === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Sales data will appear when qualifying orders are recorded.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Cash on Delivery (COD)</span>
                  <span className="text-slate-900">
                    {codOrders} orders ({codPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-orange h-full rounded-full transition-all duration-500"
                    style={{ width: `${codPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">UPI on Delivery</span>
                  <span className="text-slate-900">
                    {upiOrders} orders ({upiPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${upiPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900">Top Selling Snacks</h3>

          {bestSellers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Best-seller statistics will populate as snack orders are placed.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bestSellers.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900">{item.name || item._id}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-brand-orange">{item.totalSold} sold</span>
                    <span className="text-slate-400 text-[10px] ml-2">({formatCurrency(item.revenue)})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
