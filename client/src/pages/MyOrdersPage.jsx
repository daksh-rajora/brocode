import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  Search,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  X,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useSocketEvent } from '../hooks/useSocket';

const TABS = ['all', 'pending', 'completed', 'cancelled'];

export const MyOrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [studentPhone, setStudentPhone] = useState(
    initialQuery || localStorage.getItem('brocode_student_phone') || ''
  );
  const [phoneInput, setPhoneInput] = useState(
    initialQuery || localStorage.getItem('brocode_student_phone') || ''
  );
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchCustomerOrders = useCallback(async (queryToSearch) => {
    if (!queryToSearch || !queryToSearch.trim()) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await apiService.trackOrder(queryToSearch.trim());
      setOrders(res.data || []);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (studentPhone) {
      fetchCustomerOrders(studentPhone);
    } else {
      setLoading(false);
    }
  }, [studentPhone, fetchCustomerOrders]);

  // Real-time synchronization for customer order updates
  useSocketEvent('order:updated', (updatedOrder) => {
    if (orders.some((o) => o._id === updatedOrder._id || o.orderNumber === updatedOrder.orderNumber)) {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
      if (selectedOrder?._id === updatedOrder._id) {
        setSelectedOrder(updatedOrder);
      }
      toast.success(`Order ${updatedOrder.orderNumber} status updated to ${updatedOrder.status}!`);
    }
  });

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!phoneInput.trim() || phoneInput.trim().length < 7) {
      toast.error('Please enter a valid phone number');
      return;
    }

    const clean = phoneInput.trim();
    setStudentPhone(clean);
    setSearchParams({ query: clean });
    localStorage.setItem('brocode_student_phone', clean);
    fetchCustomerOrders(clean);
  };

  const filteredOrders = orders.filter((ord) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending')
      return ['placed', 'preparing', 'out_for_delivery'].includes(ord.status);
    if (activeTab === 'completed') return ord.status === 'delivered';
    if (activeTab === 'cancelled') return ord.status === 'cancelled';
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 min-h-[85vh] text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">My Orders</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time status of your midnight hostel snacks
          </p>
        </div>

        {studentPhone && (
          <button
            onClick={() => fetchCustomerOrders(studentPhone)}
            className="p-2 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B] text-slate-400 hover:text-white hover:border-brand-orange transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Verified Identity / Phone Lookup */}
      <form onSubmit={handlePhoneSubmit} className="mb-6">
        <div className="bg-[#181818] border border-[#262626] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-2.5 min-w-0">
            <Phone className="w-4 h-4 text-brand-orange shrink-0" />
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Enter mobile number to view orders..."
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-yellow text-black font-extrabold text-xs shrink-0 transition-transform active:scale-95"
          >
            Search Orders
          </button>
        </div>
      </form>

      {/* Tabs */}
      {studentPhone && orders.length > 0 && (
        <div className="flex items-center space-x-2 mb-6 border-b border-[#262626] pb-3 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-brand-orange text-black font-black'
                  : 'bg-[#1A1A1A] text-slate-400 hover:text-white border border-[#2B2B2B]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Orders List / Empty State */}
      {loading ? (
        <LoadingSpinner text="Checking live orders from database..." />
      ) : !studentPhone ? (
        <div className="bg-[#181818] rounded-3xl border border-[#262626] p-12 text-center">
          <Phone className="w-10 h-10 text-brand-orange mx-auto mb-3" />
          <h2 className="text-sm font-black text-white">Enter Your Mobile Number</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Provide the phone number used during checkout to retrieve your actual hostel orders directly from the database.
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[#181818] rounded-3xl border border-[#262626] p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h2 className="text-sm font-black text-white">No orders have been placed yet.</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            No active or past midnight snack orders found for <span className="text-white font-mono">{studentPhone}</span>.
          </p>
          <div className="mt-5">
            <Link
              to="/menu"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-brand-orange text-black font-black text-xs shadow-brand"
            >
              <span>Browse Snacks</span>
            </Link>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#181818] rounded-3xl border border-[#262626] p-8 text-center text-xs text-slate-400">
          No orders match the selected "{activeTab}" filter.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((ord) => {
            const itemCount = ord.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0;
            const isPickup = ord.orderType === 'pickup';

            return (
              <div
                key={ord._id || ord.orderNumber}
                onClick={() => setSelectedOrder(ord)}
                className="bg-[#181818] hover:bg-[#1C1C1C] rounded-2xl border border-[#262626] hover:border-brand-orange/60 p-4 sm:p-5 transition-all cursor-pointer shadow-md"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-white text-xs sm:text-sm">
                      {ord.orderNumber}
                    </span>
                    <StatusBadge status={ord.status} />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatDate(ord.createdAt)}
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-slate-300 font-semibold">
                      {itemCount} {itemCount === 1 ? 'snack item' : 'snack items'} •{' '}
                      <span className="text-brand-yellow">{isPickup ? 'Self Pickup' : 'Hostel Delivery'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {ord.hostelBlock}, Rm {ord.roomNumber}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-white">
                      {formatCurrency(ord.totalAmount)}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {ord.paymentMethod?.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-xs text-brand-orange font-bold">
                  <span>View Delivery Tracker</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#181818] rounded-3xl border border-[#2B2B2B] max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative text-white">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#242424] text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-3 border-b border-[#262626]">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-black text-sm sm:text-base text-white">
                  {selectedOrder.orderNumber}
                </span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Placed on {formatDate(selectedOrder.createdAt)}
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs border-b border-[#262626]">
              <div className="bg-[#202020] p-3 rounded-xl border border-[#2B2B2B]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Destination
                </div>
                <div className="font-bold text-white">{selectedOrder.studentName}</div>
                <div className="text-slate-300">
                  {selectedOrder.hostelBlock}, Room {selectedOrder.roomNumber}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  📞 {selectedOrder.studentPhone}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Items ({selectedOrder.items?.length || 0})
                </div>
                <div className="divide-y divide-[#262626]">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-200">{item.name}</span>
                        <span className="text-[11px] text-slate-400 ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-black text-white">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 text-xs space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-white font-bold">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="text-white font-bold">{formatCurrency(selectedOrder.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-[#262626]">
                <span>Total Amount:</span>
                <span className="text-brand-orange">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="mt-5">
              <Link
                to={`/track/${selectedOrder.orderNumber}`}
                className="w-full py-2.5 rounded-full bg-brand-orange text-black font-black text-xs flex items-center justify-center space-x-2 shadow-brand"
              >
                <span>Track Live Delivery Progress</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
