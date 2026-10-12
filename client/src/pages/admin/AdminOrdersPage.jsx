import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Search,
  X,
  Check,
  ArrowRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Phone,
  MapPin,
  Clock,
  ArrowLeft,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useSocketEvent, useAdminSocket } from '../../hooks/useSocket';

const TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'placed', label: 'Pending' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'out_for_delivery', label: 'Ready' },
  { id: 'delivered', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusToUpdate, setStatusToUpdate] = useState('preparing');
  const [updating, setUpdating] = useState(false);

  useAdminSocket();

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getAllOrders({ limit: 100 });
      setOrders(res.data?.orders || []);
    } catch (err) {
      toast.error('Failed to load orders from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time synchronization
  useSocketEvent('order:created', (newOrder) => {
    toast.success(`New order ${newOrder.orderNumber} placed by ${newOrder.studentName}!`);
    loadOrders();
  });
  useSocketEvent('order:updated', () => {
    loadOrders();
  });

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      const res = await apiService.updateOrderStatus(orderId, { status: newStatus });
      setOrders((prev) => prev.map((ord) => (ord._id === orderId ? res.data : ord)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(res.data);
      }
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Connecting to database & loading orders ledger..." />;
  }

  // Count items per status strictly from real database records
  const getTabCount = (tabId) => {
    if (tabId === 'all') return orders.length;
    return orders.filter((o) => o.status === tabId).length;
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (ord.studentName && ord.studentName.toLowerCase().includes(search.toLowerCase())) ||
      (ord.studentPhone && ord.studentPhone.includes(search));
    if (!matchesSearch) return false;
    if (activeTab === 'all') return true;
    return ord.status === activeTab;
  });

  const displayOrders = filteredOrders;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View and manage all customer orders in real-time
          </p>
        </div>

        {/* Date on Right */}
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-brand-orange" />
          <span>Today ({new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders by ID, student name, or phone..."
          className="w-full bg-white border border-slate-200 focus:border-brand-orange rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
        {TABS.map((tab) => {
          const count = getTabCount(tab.id);
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs shrink-0 ${
                isActive
                  ? 'bg-brand-orange text-white font-extrabold shadow-md'
                  : 'bg-white text-slate-600 hover:text-black border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1 opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* MOBILE VIEW (< md): Mobile Order Cards */}
      <div className="md:hidden space-y-3">
        {displayOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-700">
              {orders.length === 0 ? 'No orders have been placed yet.' : 'No orders found matching this filter.'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {orders.length === 0 ? 'New hostel orders will appear here automatically.' : 'Try selecting another tab or clearing the search.'}
            </p>
          </div>
        ) : (
          displayOrders.map((ord) => {
            const totalItemsCount =
              ord.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0;
            const isPickup = ord.orderType === 'pickup';
            const statusLabel =
              ord.status === 'placed'
                ? 'Pending'
                : ord.status === 'preparing'
                ? 'Preparing'
                : ord.status === 'out_for_delivery'
                ? 'Ready'
                : ord.status === 'delivered'
                ? 'Completed'
                : 'Cancelled';

            return (
              <div
                key={ord._id || ord.orderNumber}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3"
              >
                {/* Top Row: Order ID, Status, Time */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {ord.orderNumber}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                        statusLabel === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : statusLabel === 'Preparing'
                          ? 'bg-blue-100 text-blue-800'
                          : statusLabel === 'Ready'
                          ? 'bg-purple-100 text-purple-800'
                          : statusLabel === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {statusLabel}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(ord.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="text-xs">
                  <div className="font-bold text-slate-900">{ord.studentName}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {ord.hostelBlock}, Room {ord.roomNumber}
                  </div>
                </div>

                {/* Bottom Row: Items count, Total & View Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold">
                      {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} •{' '}
                      <span className="font-bold text-slate-700">
                        {isPickup ? 'Pickup' : 'Delivery'}
                      </span>
                    </span>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {formatCurrency(ord.totalAmount)}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOrder(ord);
                      setStatusToUpdate(ord.status);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-brand-orange hover:text-black text-slate-800 font-bold text-xs transition-colors shadow-2xs"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP/TABLET VIEW (>= md): Full Orders Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Hostel & Room</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 text-xs">
                    {orders.length === 0
                      ? 'No orders have been placed yet.'
                      : 'No orders found matching your search.'}
                  </td>
                </tr>
              ) : (
                displayOrders.map((ord) => {
                  const totalItemsCount =
                    ord.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0;
                  const isPickup = ord.orderType === 'pickup';
                  const statusLabel =
                    ord.status === 'placed'
                      ? 'Pending'
                      : ord.status === 'preparing'
                      ? 'Preparing'
                      : ord.status === 'out_for_delivery'
                      ? 'Ready'
                      : ord.status === 'delivered'
                      ? 'Completed'
                      : 'Cancelled';

                  return (
                    <tr key={ord._id || ord.orderNumber} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {ord.studentName}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {ord.hostelBlock}, Rm {ord.roomNumber}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {formatCurrency(ord.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-600">
                        {isPickup ? 'Pickup' : 'Delivery'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                            statusLabel === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : statusLabel === 'Preparing'
                              ? 'bg-blue-100 text-blue-800'
                              : statusLabel === 'Ready'
                              ? 'bg-purple-100 text-purple-800'
                              : statusLabel === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {new Date(ord.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setStatusToUpdate(ord.status);
                          }}
                          className="px-3 py-1 rounded-lg border border-slate-200 hover:border-brand-orange hover:bg-brand-orange hover:text-black text-slate-700 text-xs font-bold transition-all shadow-2xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ORDER DETAILS MODAL (Real Database Record) */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-7 shadow-2xl relative">
            {/* Close Cross */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-black text-base sm:text-lg text-slate-900">
                  {selectedOrder.orderNumber}
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                    selectedOrder.status === 'placed'
                      ? 'bg-amber-100 text-amber-800'
                      : selectedOrder.status === 'preparing'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedOrder.status === 'out_for_delivery'
                      ? 'bg-purple-100 text-purple-800'
                      : selectedOrder.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Placed on {formatDate(selectedOrder.createdAt)}
              </p>
            </div>

            {/* 2-Column Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs border-b border-slate-100">
              <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Hostel Delivery Details
                </div>
                <div className="font-bold text-slate-900">{selectedOrder.studentName}</div>
                <div className="text-slate-600 font-medium">
                  {selectedOrder.hostelBlock}, Room {selectedOrder.roomNumber}
                </div>
                <div className="font-mono text-slate-500 text-[11px]">
                  📞 {selectedOrder.studentPhone}
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Payment & Service
                </div>
                <div className="font-bold text-slate-900 capitalize">
                  {selectedOrder.orderType === 'pickup' ? 'Self Pickup at Kitchen' : 'Hostel Room Delivery'}
                </div>
                <div className="text-slate-600 font-medium capitalize">
                  Method: {selectedOrder.paymentMethod?.replace(/_/g, ' ')}
                </div>
                {selectedOrder.deliveryNotes && (
                  <div className="text-amber-800 text-[11px] bg-amber-50 p-1.5 rounded-lg border border-amber-200/50 mt-1">
                    Note: "{selectedOrder.deliveryNotes}"
                  </div>
                )}
              </div>
            </div>

            {/* Order Items List */}
            <div className="py-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                Ordered Snacks ({selectedOrder.items?.length || 0})
              </h3>
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={
                            item.image ||
                            (item.name?.toLowerCase().includes('maggi')
                              ? '/packs/maggi.jpg'
                              : item.name?.toLowerCase().includes('coke')
                              ? '/packs/coke.jpg'
                              : '/packs/lays.jpg')
                          }
                          alt={item.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.target.src = '/packs/lays.jpg';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {formatCurrency(item.price)} × {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div className="font-black text-slate-900 shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary & Status Update Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              {/* Bill Details strictly from database */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between space-x-8 text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(selectedOrder.subtotal ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between space-x-8 text-slate-600">
                  <span>Delivery Charge:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(selectedOrder.deliveryFee ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between space-x-8 text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total:</span>
                  <span className="text-brand-orange">
                    {formatCurrency(selectedOrder.totalAmount ?? 0)}
                  </span>
                </div>
              </div>

              {/* Status Update Dropdown + Orange Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={statusToUpdate}
                  onChange={(e) => setStatusToUpdate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer w-full sm:w-auto"
                >
                  <option value="placed">Pending (Placed)</option>
                  <option value="preparing">In Kitchen (Preparing)</option>
                  <option value="out_for_delivery">Out for Delivery (Ready)</option>
                  <option value="delivered">Completed (Delivered)</option>
                  <option value="cancelled">Cancelled (Restore Stock)</option>
                </select>

                <button
                  onClick={() => handleUpdateStatus(selectedOrder._id, statusToUpdate)}
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-yellow text-black font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 text-center"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
