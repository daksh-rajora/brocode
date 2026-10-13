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
  AlertCircle,
  ShieldCheck,
  Eye,
  Phone,
  MapPin,
  Clock,
  ArrowLeft,
  ShoppingBag,
  QrCode,
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
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusToUpdate, setStatusToUpdate] = useState('preparing');
  const [paymentStatusToUpdate, setPaymentStatusToUpdate] = useState('paid');
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

  const handleVerifyPayment = async (orderId) => {
    try {
      setUpdating(true);
      const res = await apiService.updatePaymentStatus(orderId, {
        paymentStatus: 'paid',
        note: 'UPI Payment verified by admin',
      });
      setOrders((prev) => prev.map((ord) => (ord._id === orderId ? res.data : ord)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(res.data);
      }
      toast.success('UPI Payment verified successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to verify payment');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      const res = await apiService.updatePaymentStatus(orderId, {
        paymentStatus: newStatus,
        note: `Payment status updated to ${newStatus} by admin`,
      });
      setOrders((prev) => prev.map((ord) => (ord._id === orderId ? res.data : ord)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(res.data);
      }
      toast.success(`Payment status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update payment status');
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
      (ord.studentPhone && ord.studentPhone.includes(search)) ||
      (ord.roomNumber && ord.roomNumber.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;

    if (activeTab !== 'all' && ord.status !== activeTab) return false;

    if (paymentMethodFilter !== 'all') {
      const isUpi = ord.paymentMethod === 'upi' || ord.paymentMethod === 'upi_on_delivery';
      if (paymentMethodFilter === 'upi' && !isUpi) return false;
      if (paymentMethodFilter === 'cash_on_delivery' && ord.paymentMethod !== 'cash_on_delivery') return false;
    }

    if (paymentStatusFilter !== 'all') {
      if (ord.paymentStatus !== paymentStatusFilter) return false;
    }

    return true;
  });

  const displayOrders = filteredOrders;

  const renderPaymentMethodBadge = (method) => {
    const isUpi = method === 'upi' || method === 'upi_on_delivery';
    if (isUpi) {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-700 border border-amber-300"
          data-testid="badge-method-upi"
        >
          UPI
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
        data-testid="badge-method-cod"
      >
        COD
      </span>
    );
  };

  const renderPaymentStatusBadge = (status) => {
    if (status === 'pending_verification') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
          data-testid="badge-status-pending-verification"
        >
          <AlertCircle className="w-3 h-3 text-amber-600" />
          Pending Verification
        </span>
      );
    }
    if (status === 'paid') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200"
          data-testid="badge-status-paid"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Paid
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200"
          data-testid="badge-status-failed"
        >
          <XCircle className="w-3 h-3 text-rose-600" />
          Failed
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
        data-testid="badge-status-pending"
      >
        Pending
      </span>
    );
  };

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

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders by ID, student name, or phone..."
            className="w-full bg-white border border-slate-200 focus:border-brand-orange rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none"
          />
        </div>

        {/* Payment Method Filter */}
        <select
          value={paymentMethodFilter}
          onChange={(e) => setPaymentMethodFilter(e.target.value)}
          className="bg-white border border-slate-200 focus:border-brand-orange rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 shadow-xs focus:outline-none cursor-pointer"
          data-testid="filter-payment-method"
        >
          <option value="all">All Methods</option>
          <option value="upi">UPI</option>
          <option value="cash_on_delivery">Cash on Delivery</option>
        </select>

        {/* Payment Status Filter */}
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 focus:border-brand-orange rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 shadow-xs focus:outline-none cursor-pointer"
          data-testid="filter-payment-status"
        >
          <option value="all">All Payment Statuses</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
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
                    {ord.hostelBlock}, Room {ord.roomNumber} • 📞 {ord.studentPhone}
                  </div>
                </div>

                {/* Payment Badge Row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {renderPaymentMethodBadge(ord.paymentMethod)}
                  {renderPaymentStatusBadge(ord.paymentStatus)}
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
                      setPaymentStatusToUpdate(ord.paymentStatus);
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
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400 text-xs">
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
                        <div>{ord.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          {ord.studentPhone}
                        </div>
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
                        <div className="flex flex-col gap-1 items-start">
                          {renderPaymentMethodBadge(ord.paymentMethod)}
                          {renderPaymentStatusBadge(ord.paymentStatus)}
                        </div>
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
                            setPaymentStatusToUpdate(ord.paymentStatus);
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
                <div className="flex items-center space-x-2 pt-0.5 flex-wrap gap-1">
                  <span className="text-slate-600 font-medium">Payment:</span>
                  {renderPaymentMethodBadge(selectedOrder.paymentMethod)}
                  {renderPaymentStatusBadge(selectedOrder.paymentStatus)}
                </div>
                {selectedOrder.deliveryNotes && (
                  <div className="text-amber-800 text-[11px] bg-amber-50 p-1.5 rounded-lg border border-amber-200/50 mt-1">
                    Note: "{selectedOrder.deliveryNotes}"
                  </div>
                )}
              </div>
            </div>

            {/* UPI Payment Verification Card for Admins */}
            {(selectedOrder.paymentMethod === 'upi' || selectedOrder.paymentMethod === 'upi_on_delivery') && (
              <div
                className={`my-3 p-3.5 rounded-2xl border ${
                  selectedOrder.paymentStatus === 'pending_verification'
                    ? 'bg-amber-50/90 border-amber-200'
                    : 'bg-emerald-50/80 border-emerald-200'
                }`}
                data-testid="admin-payment-verification-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      {selectedOrder.paymentStatus === 'pending_verification' ? (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span className="text-xs font-black text-slate-900">
                        {selectedOrder.paymentStatus === 'pending_verification'
                          ? 'UPI Payment Awaiting Admin Verification'
                          : 'UPI Payment Confirmed & Verified'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Customer confirmed UPI transfer of{' '}
                      <strong className="text-brand-orange font-bold">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </strong>{' '}
                      to <strong className="text-slate-800 font-bold">Dheeraj</strong> (
                      <span className="font-mono text-slate-700">dheerajbhardwaj621@oksbi</span>).
                    </p>
                  </div>

                  {selectedOrder.paymentStatus === 'pending_verification' && (
                    <button
                      onClick={() => handleVerifyPayment(selectedOrder._id)}
                      disabled={updating}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                      data-testid="admin-verify-payment-btn"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{updating ? 'Verifying...' : 'Verify UPI Payment'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

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
                  <span className="font-bold text-slate-900" data-testid="admin-order-subtotal">
                    {formatCurrency(selectedOrder.subtotal ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between space-x-8 text-slate-600">
                  <span>Delivery Charge:</span>
                  <span
                    className={`font-bold ${selectedOrder.deliveryFee === 0 ? 'text-emerald-600' : 'text-slate-900'}`}
                    data-testid="admin-order-delivery-fee"
                  >
                    {selectedOrder.deliveryFee === 0 ? 'FREE (₹0)' : formatCurrency(selectedOrder.deliveryFee ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between space-x-8 text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total:</span>
                  <span className="text-brand-orange" data-testid="admin-order-total-amount">
                    {formatCurrency(selectedOrder.totalAmount ?? 0)}
                  </span>
                </div>
              </div>

              {/* Status & Payment Update Controls */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={statusToUpdate}
                    onChange={(e) => setStatusToUpdate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer flex-1"
                    data-testid="admin-select-order-status"
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
                    className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-yellow text-black font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                    data-testid="admin-update-status-btn"
                  >
                    {updating ? '...' : 'Update Status'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={paymentStatusToUpdate}
                    onChange={(e) => setPaymentStatusToUpdate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer flex-1"
                    data-testid="admin-select-payment-status"
                  >
                    <option value="pending_verification">Pending Verification</option>
                    <option value="paid">Paid (Verified)</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>

                  <button
                    onClick={() => handleUpdatePaymentStatus(selectedOrder._id, paymentStatusToUpdate)}
                    disabled={updating}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                    data-testid="admin-update-payment-btn"
                  >
                    {updating ? '...' : 'Set Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
