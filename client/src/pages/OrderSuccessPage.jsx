import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Check, ArrowRight, Package } from 'lucide-react';
import { apiService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const OrderSuccessPage = () => {
  const { orderNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (!order && orderNumber) {
      loadOrder();
    }
  }, [orderNumber]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await apiService.trackOrder(orderNumber);
      if (res.data && res.data.length > 0) {
        setOrder(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load order info:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Fetching order confirmation..." />;
  }

  const orderNum = order?.orderNumber || orderNumber;

  return (
    <div className="max-w-md mx-auto px-4 py-10 min-h-[85vh] flex flex-col justify-center">
      <div className="bg-[#111111] text-white rounded-3xl p-6 sm:p-8 border border-[#222222] text-center shadow-2xl relative overflow-hidden">
        {/* Celebration Badge matching Screenshot 7 */}
        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Your cravings are on the way. Keep chilling!
        </p>

        {/* Mascot / Snack emoji badge */}
        <div className="my-5 py-4 bg-[#1A1A1A] rounded-2xl border border-[#2B2B2B] flex items-center justify-center space-x-3">
          <span className="text-3xl">🍜 🍟 🥤</span>
          <div className="text-left">
            <div className="text-xs font-black text-brand-orange uppercase">
              Hostel Express Delivery
            </div>
            <div className="text-[11px] text-slate-400">Arriving in 15 - 20 minutes</div>
          </div>
        </div>

        {/* Order Details Table matching Screenshot 7 */}
        <div className="bg-[#181818] rounded-2xl p-4 border border-[#282828] text-xs space-y-2 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-[#282828]">
            <span className="text-slate-400">Order ID</span>
            <span className="font-mono font-bold text-white">{orderNum}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#282828]">
            <span className="text-slate-400">Order Date</span>
            <span className="font-medium text-slate-200">
              {formatDate(order?.createdAt || new Date())}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#282828]">
            <span className="text-slate-400">Items</span>
            <span className="font-medium text-slate-200">
              {order?.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0} items
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#282828]">
            <span className="text-slate-400">Total Amount</span>
            <span className="font-black text-brand-orange text-sm">
              {formatCurrency(order?.totalAmount ?? 0)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#282828]">
            <span className="text-slate-400">Payment Method</span>
            <span className="font-semibold text-slate-200 capitalize">
              {(order?.paymentMethod || 'cash_on_delivery').replace(/_/g, ' ')}
            </span>
          </div>

          {order?.hostelBlock && (
            <div className="flex items-center justify-between pb-2 border-b border-[#282828]">
              <span className="text-slate-400">Hostel & Room</span>
              <span className="font-bold text-white">
                {order.hostelBlock}{order.roomNumber ? `, Room ${order.roomNumber}` : ''}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400">Status</span>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] border border-amber-500/30 uppercase">
              {order?.status ? order.status.replace(/_/g, ' ') : 'Placed'}
            </span>
          </div>
        </div>


        {/* Action Buttons matching Screenshot 7 */}
        <div className="mt-6 space-y-2.5">
          <Link
            to="/orders"
            className="w-full py-3 rounded-full bg-brand-orange hover:bg-brand-yellow text-black font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-transform active:scale-95 shadow-brand"
          >
            <span>View My Orders</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </Link>

          <Link
            to="/"
            className="w-full py-2.5 rounded-full bg-transparent hover:bg-white/10 text-slate-300 border border-white/20 font-bold text-xs flex items-center justify-center transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};
