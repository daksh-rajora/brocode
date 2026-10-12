import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ArrowLeft, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../hooks/useCart';
import { apiService } from '../services/api';
import { DEFAULT_HOSTEL_BLOCKS, PAYMENT_METHODS } from '../data/hostelConfig';
import { formatCurrency } from '../utils/formatters';

export const CheckoutPage = () => {
  const { items, subtotal, totalItems, deliveryInfo, updateDeliveryInfo, clearCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' or 'pickup'
  const [formData, setFormData] = useState({
    studentName: deliveryInfo?.studentName || '',
    studentPhone: deliveryInfo?.studentPhone || localStorage.getItem('brocode_student_phone') || '',
    hostelBlock:
      deliveryInfo?.hostelBlock && DEFAULT_HOSTEL_BLOCKS.includes(deliveryInfo.hostelBlock)
        ? deliveryInfo.hostelBlock
        : 'BH1',
    roomNumber: deliveryInfo?.roomNumber || '',
    deliveryNotes: deliveryInfo?.deliveryNotes || '',
    paymentMethod: deliveryInfo?.paymentMethod || 'cash_on_delivery',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await apiService.getSettings();
      setSettings(res.data);
    } catch (err) {
      console.warn('Could not load store settings, using standard fee:', err);
    }
  };

  const configuredDeliveryFee = settings?.deliveryFee ?? 10;
  const deliveryCharge = orderType === 'pickup' ? 0 : configuredDeliveryFee;
  const totalAmount = subtotal + deliveryCharge;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    updateDeliveryInfo({ [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.studentName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!formData.studentPhone.trim() || formData.studentPhone.trim().length < 7) {
      toast.error('Please enter a valid mobile number');
      return;
    }
    if (!formData.roomNumber.trim()) {
      toast.error('Please specify your hostel room number');
      return;
    }

    if (items.length === 0) {
      toast.error('Cart is empty');
      navigate('/menu');
      return;
    }

    if (settings && subtotal < settings.minOrderAmount) {
      toast.error(`Minimum order amount is ₹${settings.minOrderAmount}`);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        studentName: formData.studentName.trim(),
        studentPhone: formData.studentPhone.trim(),
        hostelBlock: formData.hostelBlock,
        roomNumber: formData.roomNumber.trim(),
        deliveryNotes: formData.deliveryNotes.trim(),
        paymentMethod: formData.paymentMethod,
        orderType,
        items: items.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
      };

      // Server recalculates totals and validates inventory
      const response = await apiService.createOrder(payload);
      const createdOrder = response.data;

      // Persist verified customer identity for My Orders retrieval
      try {
        localStorage.setItem('brocode_student_phone', formData.studentPhone.trim());
      } catch (err) {
        console.warn('Could not save phone in local storage');
      }

      toast.success('Order placed successfully! Preparing snacks.');
      clearCart();
      navigate(`/order-success/${createdOrder.orderNumber}`, { state: { order: createdOrder } });
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to place order. Check product stock.');
    } finally {
      setLoading(false);
    }
  };

  if (totalItems === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 min-h-[85vh]">
      <div className="bg-[#181818] rounded-3xl border border-[#262626] p-5 sm:p-7 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/cart')}
              className="p-1 rounded-full hover:bg-[#252525] text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black text-white">Checkout</h1>
          </div>
        </div>

        {/* 3 Steps indicator */}
        <div className="flex items-center justify-between px-4 py-4 my-2 border-b border-[#262626]">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-brand-orange text-black font-black text-xs flex items-center justify-center">
              1
            </div>
            <span className="text-[10px] font-bold text-white mt-1">Details</span>
          </div>
          <div className="flex-1 h-0.5 bg-[#2A2A2A] mx-2 -mt-3" />
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-[#222222] border border-[#2E2E2E] text-slate-500 font-bold text-xs flex items-center justify-center">
              2
            </div>
            <span className="text-[10px] font-medium text-slate-500 mt-1">Payment</span>
          </div>
          <div className="flex-1 h-0.5 bg-[#2A2A2A] mx-2 -mt-3" />
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-[#222222] border border-[#2E2E2E] text-slate-500 font-bold text-xs flex items-center justify-center">
              3
            </div>
            <span className="text-[10px] font-medium text-slate-500 mt-1">Confirm</span>
          </div>
        </div>

        {/* Service Type Selection (Delivery vs Pickup) */}
        <div className="pt-2 pb-4">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Fulfillment Method
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setOrderType('delivery')}
              className={`p-3 rounded-2xl border flex items-center space-x-3 transition-all ${
                orderType === 'delivery'
                  ? 'border-brand-orange bg-[#261E14] text-white shadow-xs'
                  : 'border-[#2E2E2E] bg-[#222222] text-slate-400 hover:text-white'
              }`}
            >
              <Truck className={`w-5 h-5 ${orderType === 'delivery' ? 'text-brand-orange' : 'text-slate-500'}`} />
              <div className="text-left">
                <div className="text-xs font-black">Room Delivery</div>
                <div className="text-[10px] opacity-80">+{formatCurrency(configuredDeliveryFee)} fee</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('pickup')}
              className={`p-3 rounded-2xl border flex items-center space-x-3 transition-all ${
                orderType === 'pickup'
                  ? 'border-brand-orange bg-[#261E14] text-white shadow-xs'
                  : 'border-[#2E2E2E] bg-[#222222] text-slate-400 hover:text-white'
              }`}
            >
              <PackageCheck className={`w-5 h-5 ${orderType === 'pickup' ? 'text-brand-orange' : 'text-slate-500'}`} />
              <div className="text-left">
                <div className="text-xs font-black">Self Pickup</div>
                <div className="text-[10px] text-emerald-400 font-bold">₹0 Free</div>
              </div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section: Delivery Details */}
          <div>
            <h2 className="text-sm font-black text-white mb-3">Hostel Details</h2>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  className="w-full bg-[#222222] border border-[#2E2E2E] focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hostel Name
                </label>
                <select
                  name="hostelBlock"
                  value={formData.hostelBlock}
                  onChange={handleChange}
                  className="w-full bg-[#222222] border border-[#2E2E2E] focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  {DEFAULT_HOSTEL_BLOCKS.map((block, idx) => (
                    <option key={idx} value={block} className="bg-[#181818] text-white">
                      {block}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. 306"
                    required
                    className="w-full bg-[#222222] border border-[#2E2E2E] focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="studentPhone"
                    value={formData.studentPhone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    required
                    className="w-full bg-[#222222] border border-[#2E2E2E] focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Order Notes (Optional)
                </label>
                <input
                  type="text"
                  name="deliveryNotes"
                  value={formData.deliveryNotes}
                  onChange={handleChange}
                  placeholder="e.g. Call before knocking, extra spoons..."
                  className="w-full bg-[#222222] border border-[#2E2E2E] focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Payment Method */}
          <div className="pt-3 border-t border-[#262626]">
            <h2 className="text-sm font-black text-white mb-3">Payment Method</h2>

            <div className="space-y-2">
              <label
                onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'cash_on_delivery' } })}
                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  formData.paymentMethod === 'cash_on_delivery'
                    ? 'border-brand-orange bg-[#261E14]'
                    : 'border-[#2E2E2E] bg-[#222222] hover:bg-[#252525]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={formData.paymentMethod === 'cash_on_delivery'}
                  onChange={handleChange}
                  className="text-brand-orange focus:ring-brand-orange"
                />
                <div>
                  <div className="text-xs font-bold text-white">Cash on Delivery</div>
                  <div className="text-[10px] text-slate-400">Pay cash upon delivery at your door</div>
                </div>
              </label>

              <label
                onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'upi_on_delivery' } })}
                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  formData.paymentMethod === 'upi_on_delivery'
                    ? 'border-brand-orange bg-[#261E14]'
                    : 'border-[#2E2E2E] bg-[#222222] hover:bg-[#252525]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi_on_delivery"
                  checked={formData.paymentMethod === 'upi_on_delivery'}
                  onChange={handleChange}
                  className="text-brand-orange focus:ring-brand-orange"
                />
                <div>
                  <div className="text-xs font-bold text-white">UPI on Delivery</div>
                  <div className="text-[10px] text-slate-400">Scan QR code via GPay / PhonePe / Paytm</div>
                </div>
              </label>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="pt-3 border-t border-[#262626] text-xs space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{orderType === 'pickup' ? 'Self Pickup:' : 'Hostel Delivery Fee:'}</span>
              <span className={`font-bold ${orderType === 'pickup' ? 'text-emerald-400' : 'text-white'}`}>
                {orderType === 'pickup' ? 'FREE (₹0)' : formatCurrency(configuredDeliveryFee)}
              </span>
            </div>
          </div>

          {/* Total & Submit */}
          <div className="pt-4 border-t border-[#262626] flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold">Total Amount</div>
              <div className="text-lg font-black text-brand-orange">
                {formatCurrency(totalAmount)}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3 px-8 rounded-full bg-brand-orange hover:bg-brand-yellow text-black font-black text-sm flex items-center space-x-2 shadow-brand transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Placing Order...' : 'Confirm Order'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
