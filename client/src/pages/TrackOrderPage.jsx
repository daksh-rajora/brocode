import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  ChefHat,
  PackageCheck,
  AlertCircle,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';
import { ORDER_STATUS_CONFIG } from '../data/hostelConfig';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useSocketEvent, useOrderSocket } from '../hooks/useSocket';

const STEPS = [
  { id: 'placed', label: 'Order Placed', icon: Clock, desc: 'Received & queued' },
  { id: 'preparing', label: 'In The Kitchen', icon: ChefHat, desc: 'Cooking & packaging' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, desc: 'Heading to your room' },
  { id: 'delivered', label: 'Delivered', icon: PackageCheck, desc: 'Enjoy your midnight snacks!' },
];

export const TrackOrderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('query') || '';

  const [searchInput, setSearchInput] = useState(urlQuery);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useOrderSocket(selectedOrder?.orderNumber);

  useSocketEvent('order:updated', (updated) => {
    if (updated.orderNumber === selectedOrder?.orderNumber || updated._id === selectedOrder?._id) {
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      toast.success(`Order ${updated.orderNumber} updated to ${updated.status}!`);
    }
  });

  useEffect(() => {
    if (urlQuery) {
      setSearchInput(urlQuery);
      performSearch(urlQuery);
    }
  }, [urlQuery]);


  const performSearch = async (queryToSearch) => {
    if (!queryToSearch || !queryToSearch.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);
      const response = await apiService.trackOrder(queryToSearch.trim());
      const data = response.data || [];
      setOrders(data);
      if (data.length > 0) {
        setSelectedOrder(data[0]);
      } else {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Tracking query failed:', error);
      toast.error(error.message || 'No orders found matching your search.');
      setOrders([]);
      setSelectedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      toast.error('Please enter an Order ID or Phone Number');
      return;
    }
    setSearchParams({ query: searchInput.trim() });
    performSearch(searchInput.trim());
  };

  const refreshCurrentOrder = () => {
    if (selectedOrder?.orderNumber) {
      performSearch(selectedOrder.orderNumber);
      toast.success('Live status refreshed');
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'placed':
        return 0;
      case 'preparing':
        return 1;
      case 'out_for_delivery':
        return 2;
      case 'delivered':
        return 3;
      default:
        return -1;
    }
  };

  const currentStepIdx = selectedOrder ? getStepIndex(selectedOrder.status) : -1;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-amber/10 border border-brand-amber/30 text-brand-amber text-xs font-bold mb-3">
          <Truck className="w-3.5 h-3.5" />
          <span>Real-time Hostel Order Tracker</span>
        </div>
        <h1 className="text-3xl font-black text-white">Track Your Midnight Bites</h1>
        <p className="text-sm text-slate-400 mt-2">
          Enter your Order ID (e.g. BRO-...) or your phone number to see live prep and delivery progress.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex items-center gap-2 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. BRO-261012-7A91 or 9876543210"
              className="w-full bg-midnight-900 border border-slate-800 focus:border-brand-amber rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-amber to-brand-orange text-midnight-950 font-black text-sm shadow-neon hover:opacity-95 transition-opacity disabled:opacity-50 shrink-0"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {/* Multiple orders selector if matched by phone */}
      {orders.length > 1 && (
        <div className="mb-6 bg-midnight-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            Found {orders.length} orders for this phone number:
          </div>
          <div className="flex flex-wrap gap-2">
            {orders.map((ord) => (
              <button
                key={ord._id}
                onClick={() => setSelectedOrder(ord)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-2 ${
                  selectedOrder?._id === ord._id
                    ? 'bg-brand-amber text-midnight-950 border-brand-amber'
                    : 'bg-midnight-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{ord.orderNumber}</span>
                <span className="text-[10px] opacity-80">({formatCurrency(ord.totalAmount)})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order Status Presentation */}
      {loading ? (
        <LoadingSpinner text="Searching order status..." />
      ) : selectedOrder ? (
        <div className="space-y-6">
          {/* Main Status Card */}
          <div className="bg-midnight-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative shadow-2xl glass-panel">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-black text-white font-mono">
                    {selectedOrder.orderNumber}
                  </h2>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                  <span>Placed: {formatDate(selectedOrder.createdAt)}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(selectedOrder.createdAt)}</span>
                </div>
              </div>

              <button
                onClick={refreshCurrentOrder}
                className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-midnight-950 hover:bg-midnight-850 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-brand-amber" />
                <span>Refresh Status</span>
              </button>
            </div>

            {/* Cancelled State Warning */}
            {selectedOrder.status === 'cancelled' ? (
              <div className="my-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-200 text-sm flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong>Order Cancelled:</strong> This order was cancelled. Any settlement will be resolved by the hostel warden or kitchen desk.
                </div>
              </div>
            ) : (
              /* Step Timeline Indicator */
              <div className="py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                  {STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isCompleted = currentStepIdx > idx || selectedOrder.status === 'delivered';
                    const isCurrent = currentStepIdx === idx && selectedOrder.status !== 'delivered';

                    return (
                      <div
                        key={step.id}
                        className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-midnight-850 border-brand-amber/60 shadow-neon'
                            : isCompleted
                            ? 'bg-midnight-950/80 border-emerald-500/30 text-emerald-300'
                            : 'bg-midnight-950/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                            isCurrent
                              ? 'bg-brand-amber text-midnight-950 shadow-neon animate-pulse-subtle'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-midnight-800 text-slate-600'
                          }`}
                        >
                          <StepIcon className="w-6 h-6 stroke-[2]" />
                        </div>
                        <div
                          className={`text-xs font-extrabold ${
                            isCurrent ? 'text-brand-amber' : isCompleted ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {step.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Details Split: Hostel Destination & Ordered Snacks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
              {/* Hostel Delivery Info */}
              <div className="bg-midnight-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-amber" />
                  <span>Hostel Destination</span>
                </h3>
                <div className="text-sm space-y-1.5">
                  <div className="text-white font-bold">{selectedOrder.studentName}</div>
                  <div className="text-slate-300">
                    {selectedOrder.hostelBlock}, <strong className="text-white">{selectedOrder.roomNumber}</strong>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-amber" />
                    <span>{selectedOrder.studentPhone}</span>
                  </div>
                  {selectedOrder.deliveryNotes && (
                    <div className="text-xs text-amber-300/90 bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/20 mt-2">
                      <strong>Hostel Note:</strong> {selectedOrder.deliveryNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="bg-midnight-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Ordered Snacks ({selectedOrder.items?.length || 0})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">
                        <strong className="text-white">{item.quantity}×</strong> {item.name}
                      </span>
                      <span className="text-white font-bold">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-medium">Total Settlement</span>
                  <span className="text-base font-black text-brand-amber">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status History Timeline Log */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-amber" />
                  <span>Activity Audit Log</span>
                </h3>
                <div className="space-y-3">
                  {selectedOrder.statusHistory.map((entry, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-brand-amber mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white capitalize">
                            {entry.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{formatDate(entry.timestamp)}</span>
                        </div>
                        {entry.note && (
                          <p className="text-slate-400 mt-0.5">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : hasSearched ? (
        <div className="text-center py-12 bg-midnight-900 border border-slate-800 rounded-3xl p-8">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Order Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            We couldn't find any orders matching "{searchInput}". Please double check your order number or phone number.
          </p>
        </div>
      ) : null}
    </div>
  );
};
