import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useSocketEvent, useAdminSocket } from '../../hooks/useSocket';

export const AdminDashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  useAdminSocket();

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [analyticsRes, ordersRes, productsRes] = await Promise.all([
        apiService.getDashboardAnalytics(),
        apiService.getAllOrders({ limit: 10 }),
        apiService.getProducts({ limit: 50 }),
      ]);

      setAnalytics(analyticsRes.data || null);
      setOrders(ordersRes.data?.orders || []);
      setProducts(productsRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to load live dashboard data. Check database connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Real-time synchronization
  useSocketEvent('order:created', loadDashboardData);
  useSocketEvent('order:updated', loadDashboardData);
  useSocketEvent('inventory:updated', loadDashboardData);
  useSocketEvent('analytics:updated', loadDashboardData);

  if (loading) {
    return <LoadingSpinner text="Connecting to database & loading live analytics..." />;
  }

  if (error && !analytics) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto shadow-xs my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-black text-slate-900">Failed to Load Dashboard Data</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-orange text-black font-extrabold text-xs shadow-xs hover:bg-brand-yellow transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  // Pure real metrics (0 if zero, no fake demo fallbacks)
  const totalRevenueVal = analytics?.totalRevenue ?? 0;
  const activeOrdersCount = analytics?.activeOrders ?? 0;
  const todayOrdersCount = analytics?.todayOrders ?? 0;
  const lowStockCount = analytics?.lowStockCount ?? 0;
  const outOfStockCount = analytics?.outOfStockCount ?? 0;
  const totalOrders = analytics?.totalOrders ?? 0;
  const statusBreakdown = analytics?.statusBreakdown || {};

  // Status breakdown numbers
  const placedCount = statusBreakdown.placed || 0;
  const preparingCount = statusBreakdown.preparing || 0;
  const outForDeliveryCount = statusBreakdown.out_for_delivery || 0;
  const deliveredCount = statusBreakdown.delivered || 0;
  const cancelledCount = statusBreakdown.cancelled || 0;

  // Real recent orders from database
  const recentOrdersList = analytics?.recentOrders?.length
    ? analytics.recentOrders
    : orders.slice(0, 6);

  // Real low stock items from database
  const lowStockItems = analytics?.lowStockItems || [];

  // Real 7-day Sales Overview from database
  const salesOverview = analytics?.salesOverview || [];
  const maxOrdersInChart = Math.max(...salesOverview.map((s) => s.orders), 1);
  const maxRevenueInChart = Math.max(...salesOverview.map((s) => s.revenue), 1);
  const hasChartActivity = salesOverview.some((s) => s.orders > 0 || s.revenue > 0);

  // Dynamic SVG Donut calculations based on actual status numbers
  const circumference = 2 * Math.PI * 38; // ~238.76
  const slices = [
    { label: 'Pending', count: placedCount, color: '#FF5500' },
    { label: 'Preparing', count: preparingCount, color: '#3B82F6' },
    { label: 'Ready', count: outForDeliveryCount, color: '#EAB308' },
    { label: 'Completed', count: deliveredCount, color: '#22C55E' },
    { label: 'Cancelled', count: cancelledCount, color: '#EF4444' },
  ];

  let currentOffset = 0;
  const renderedSlices = slices.map((s) => {
    const fraction = totalOrders > 0 ? s.count / totalOrders : 0;
    const strokeDash = fraction * circumference;
    const offset = currentOffset;
    currentOffset += strokeDash;
    return {
      ...s,
      strokeDasharray: `${strokeDash} ${circumference - strokeDash}`,
      strokeDashoffset: -offset,
    };
  });

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto min-w-0">
      {/* 1. Header with Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your live hostel snack store at a glance
          </p>
        </div>

        {/* Mascot Banner + Quick Actions */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="hidden lg:flex items-center space-x-3 px-3.5 py-1.5 rounded-2xl bg-[#FFF6E9] border border-amber-200/70 shadow-2xs relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              <img
                src="/admin_mascot.jpg"
                alt="Bro Code Mascot"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="text-left leading-tight">
              <div className="text-[9px] text-amber-500">👑</div>
              <div className="text-[11px] font-black text-slate-900 leading-tight">
                Good Food • <span className="text-[#FF5500]">Better Mood</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/admin/products?action=new"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand-orange hover:bg-brand-yellow text-black font-extrabold text-xs shadow-xs transition-all active:scale-95"
            >
              <span>+ Add Product</span>
            </Link>

            <Link
              to="/admin/orders"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-xs shadow-2xs transition-colors"
            >
              <span>View Orders</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Four Summary KPI Cards (Real Persisted Database Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
                Total Revenue
              </div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 leading-tight mt-0.5 truncate">
                {formatCurrency(totalRevenueVal)}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 text-[10px] font-bold text-emerald-600 truncate">
            {totalRevenueVal > 0 ? `₹${analytics?.todayRevenue || 0} today` : 'Verified database sales'}
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
                Active Orders
              </div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                {activeOrdersCount}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 text-[10px] font-bold text-blue-600 truncate">
            {activeOrdersCount > 0 ? 'In preparation & transit' : 'No active orders'}
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
                Today's Orders
              </div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                {todayOrdersCount}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 text-[10px] font-bold text-amber-600 truncate">
            {todayOrdersCount > 0 ? `${todayOrdersCount} orders placed today` : 'Midnight shift open'}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
                Low Stock
              </div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                {lowStockCount} items
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-500 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 text-[10px] font-bold text-rose-500 truncate">
            {outOfStockCount > 0 ? `${outOfStockCount} out of stock` : lowStockCount > 0 ? 'Stock ≤ 10 units' : 'Inventory healthy'}
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Real Sales Overview & Real Order Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Sales Overview Double-Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900">Sales Overview</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Last 7 days order volume and verified sales</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2.5 text-[11px] font-bold text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-xs bg-[#FF5500]" />
                  <span>Orders</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-xs bg-[#FFBA52]" />
                  <span>Sales</span>
                </span>
              </div>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="7d">Last 7 Days</option>
              </select>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-5 pb-1 overflow-x-hidden">
            {!hasChartActivity ? (
              <div className="h-44 sm:h-56 flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-2">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-black text-slate-800">No Sales History Yet</h3>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Sales data will appear when qualifying orders are recorded in the system.
                </p>
              </div>
            ) : (
              <div className="h-44 sm:h-56 flex items-end justify-between gap-1 sm:gap-3 px-1">
                {salesOverview.map((item, idx) => {
                  const orderHeight = (item.orders / maxOrdersInChart) * 100;
                  const salesHeight = (item.revenue / maxRevenueInChart) * 100;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative min-w-0"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold py-1 px-1.5 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-lg">
                        {item.orders} ord • ₹{item.revenue}
                      </div>

                      {/* Dual Bars */}
                      <div className="w-full flex items-end justify-center space-x-0.5 sm:space-x-1.5 h-full pb-2">
                        <div
                          className="w-2 sm:w-3.5 bg-[#FF5500] rounded-t-xs transition-all duration-300 group-hover:brightness-110 min-h-[4px]"
                          style={{ height: `${Math.max(item.orders > 0 ? orderHeight : 4, 4)}%` }}
                        />
                        <div
                          className="w-2 sm:w-3.5 bg-[#FFBA52] rounded-t-xs transition-all duration-300 group-hover:brightness-110 min-h-[4px]"
                          style={{ height: `${Math.max(item.revenue > 0 ? salesHeight : 4, 4)}%` }}
                        />
                      </div>

                      {/* Day label */}
                      <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 mt-1.5 border-t border-slate-100 pt-1 w-full text-center truncate">
                        {item.dayName}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Real Order Status Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900">Order Status</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time status breakdown</p>
          </div>

          <div className="py-4 flex flex-col sm:flex-row lg:flex-col items-center justify-around gap-5">
            {/* SVG Donut Ring */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F3F5" strokeWidth="12" />
                {totalOrders > 0 &&
                  renderedSlices.map(
                    (sl, i) =>
                      sl.count > 0 && (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke={sl.color}
                          strokeWidth="12"
                          strokeDasharray={sl.strokeDasharray}
                          strokeDashoffset={sl.strokeDashoffset}
                          className="transition-all duration-500"
                        />
                      )
                  )}
              </svg>

              <div className="absolute text-center leading-tight">
                <div className="text-lg sm:text-xl font-black text-slate-900">{totalOrders}</div>
                <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  Total Orders
                </div>
              </div>
            </div>

            {/* Real Status Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-1.5 text-xs font-bold text-slate-700 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] shrink-0" />
                <span>{placedCount} Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
                <span>{preparingCount} Preparing</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] shrink-0" />
                <span>{outForDeliveryCount} Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shrink-0" />
                <span>{deliveredCount} Completed</span>
              </div>
              <div className="flex items-center space-x-2 col-span-2 sm:col-span-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shrink-0" />
                <span>{cancelledCount} Cancelled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Real Recent Orders & Real Low Stock Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900">Recent Orders</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Live incoming orders from hostels</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-brand-orange hover:underline flex items-center space-x-0.5"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrdersList.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">No orders have been placed yet.</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Incoming student snack orders will automatically appear here in real-time.
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE VIEW (< md): Responsive Order Cards */}
              <div className="md:hidden divide-y divide-slate-100 pt-1">
                {recentOrdersList.map((ord) => {
                  const itemCount = ord.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0;
                  const orderType = ord.orderType === 'pickup' ? 'Pickup' : 'Delivery';
                  const timeStr = ord.createdAt
                    ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now';

                  return (
                    <div key={ord._id || ord.orderNumber} className="py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">{ord.orderNumber}</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                            ord.status === 'placed'
                              ? 'bg-amber-100 text-amber-800'
                              : ord.status === 'preparing'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.status === 'out_for_delivery'
                              ? 'bg-purple-100 text-purple-800'
                              : ord.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{ord.studentName}</span>
                        <span className="font-black text-slate-900">{formatCurrency(ord.totalAmount)}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {itemCount} {itemCount === 1 ? 'item' : 'items'} • <span className="font-semibold text-slate-600">{orderType}</span>
                        </span>
                        <span>{timeStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP/TABLET VIEW (>= md): Full Table */}
              <div className="hidden md:block overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-2">Customer</th>
                      <th className="py-2.5 px-2">Hostel & Room</th>
                      <th className="py-2.5 px-2">Items</th>
                      <th className="py-2.5 px-2">Total</th>
                      <th className="py-2.5 px-2">Type</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrdersList.map((ord) => {
                      const itemCount = ord.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0;
                      const orderType = ord.orderType === 'pickup' ? 'Pickup' : 'Delivery';
                      const timeStr = ord.createdAt
                        ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Just now';

                      return (
                        <tr key={ord._id || ord.orderNumber} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-2 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                          <td className="py-3 px-2 font-bold text-slate-900">{ord.studentName}</td>
                          <td className="py-3 px-2 text-slate-600 font-medium">
                            {ord.hostelBlock}, Rm {ord.roomNumber}
                          </td>
                          <td className="py-3 px-2 text-slate-500 font-semibold">{itemCount} items</td>
                          <td className="py-3 px-2 font-black text-slate-900">{formatCurrency(ord.totalAmount)}</td>
                          <td className="py-3 px-2 font-semibold text-slate-600">{orderType}</td>
                          <td className="py-3 px-2">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                                ord.status === 'placed'
                                  ? 'bg-amber-100 text-amber-800'
                                  : ord.status === 'preparing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : ord.status === 'out_for_delivery'
                                  ? 'bg-purple-100 text-purple-800'
                                  : ord.status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right text-slate-500 text-[11px] font-medium">
                            {timeStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Right Col: Real Low Stock Items List */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-2">
              <div>
                <h2 className="text-sm font-black text-slate-900">Low Stock Items</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Snacks reaching threshold (≤ 10)</p>
              </div>
              <Link
                to="/admin/inventory"
                className="text-xs font-bold text-brand-orange hover:underline flex items-center space-x-0.5"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-10 text-center">
                <Package className="w-9 h-9 text-emerald-300 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700">All snacks are well stocked!</div>
                <p className="text-[11px] text-slate-400 mt-1">No items currently below threshold.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockItems.slice(0, 6).map((item) => (
                  <div key={item._id || item.name} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                        <div
                          className={`text-[10px] font-semibold ${
                            item.stock === 0 ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          Stock: {item.stock} units
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                        item.stock === 0
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.stock === 0 ? 'Out' : 'Low'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
