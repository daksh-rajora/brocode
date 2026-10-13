import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ArrowLeft,
  Truck,
  PackageCheck,
  AlertCircle,
  QrCode,
  Copy,
  Info,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import qrCodeImg from '../assets/qr.jpeg';
import { useCart } from '../hooks/useCart';
import { apiService } from '../services/api';
import { DEFAULT_HOSTEL_BLOCKS, PAYMENT_METHODS, UPI_CONFIG } from '../data/hostelConfig';
import { formatCurrency } from '../utils/formatters';
import { useSocketEvent } from '../hooks/useSocket';

export const CheckoutPage = () => {
  const { items, subtotal, totalItems, deliveryInfo, updateDeliveryInfo, clearCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' or 'pickup'
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [formData, setFormData] = useState({
    studentName: deliveryInfo?.studentName || '',
    studentPhone: deliveryInfo?.studentPhone || localStorage.getItem('brocode_student_phone') || '',
    hostelBlock:
      deliveryInfo?.hostelBlock && DEFAULT_HOSTEL_BLOCKS.includes(deliveryInfo.hostelBlock)
        ? deliveryInfo.hostelBlock
        : 'BH1',
    roomNumber: deliveryInfo?.roomNumber || '',
    deliveryNotes: deliveryInfo?.deliveryNotes || '',
    paymentMethod:
      deliveryInfo?.paymentMethod === 'cash_on_delivery' ? 'cash_on_delivery' : 'upi',
  });

  const unavailableCartItem = items.find(
    (item) => item.product.isAvailable === false || Number(item.product.stock) <= 0
  );

  const loadSettings = async () => {
    try {
      const res = await apiService.getSettings();
      setSettings(res.data);
    } catch (err) {
      console.warn('Could not load store settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener('focus', loadSettings);
    return () => window.removeEventListener('focus', loadSettings);
  }, []);

  useEffect(() => {
    if (unavailableCartItem) {
      toast.error(`"${unavailableCartItem.product.name}" is out of stock. Please remove it from your cart.`);
      navigate('/cart');
    }
  }, [items]);

  // Real-time update when admin updates delivery settings
  useSocketEvent('settings:updated', (updated) => {
    if (updated) {
      setSettings(updated);
    }
  });

  const configuredDeliveryFee =
    typeof settings?.deliveryFee === 'number' && settings.deliveryFee >= 0
      ? settings.deliveryFee
      : 0;
  const deliveryCharge = orderType === 'pickup' ? 0 : configuredDeliveryFee;
  const totalAmount = subtotal + deliveryCharge;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    updateDeliveryInfo({ [name]: value });
  };

  const handleCopyUpi = (e) => {
    e.preventDefault();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(UPI_CONFIG.upiId);
    }
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (unavailableCartItem) {
      toast.error(`"${unavailableCartItem.product.name}" is out of stock. Please remove it from your cart.`);
      navigate('/cart');
      return;
    }

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

    if (formData.paymentMethod === 'upi' && !paymentConfirmed) {
      toast.error('Please complete the UPI payment and confirm above before placing the order.');
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
                <div className="text-[10px] opacity-80" data-testid="room-delivery-fee-badge">
                  {configuredDeliveryFee === 0 ? 'FREE delivery' : `+${formatCurrency(configuredDeliveryFee)} fee`}
                </div>
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
                  <div className="text-[10px] text-slate-400">Pay cash upon delivery at your room door</div>
                </div>
              </label>

              <label
                onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'upi' } })}
                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  formData.paymentMethod === 'upi'
                    ? 'border-brand-orange bg-[#261E14]'
                    : 'border-[#2E2E2E] bg-[#222222] hover:bg-[#252525]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={formData.paymentMethod === 'upi'}
                  onChange={handleChange}
                  className="text-brand-orange focus:ring-brand-orange"
                />
                <div>
                  <div className="text-xs font-bold text-white">UPI</div>
                  <div className="text-[10px] text-slate-400">Scan QR code & pay instantly with any UPI app</div>
                </div>
              </label>
            </div>
          </div>

          {/* UPI QR Payment Flow (Shown only when UPI is selected) */}
          {formData.paymentMethod === 'upi' && (
            <div
              className="p-4 sm:p-5 rounded-2xl bg-[#201D1A] border border-[#3E3224] space-y-4 animate-fade-in"
              data-testid="upi-qr-section"
            >
              {/* Header and Instructions */}
              <div className="flex items-start space-x-2.5">
                <div className="p-2 rounded-xl bg-brand-orange/20 text-brand-orange shrink-0 mt-0.5">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Instant UPI QR Payment
                  </h3>
                  <p className="text-[11px] text-amber-200/90 font-medium leading-relaxed mt-0.5" data-testid="upi-instructions">
                    {UPI_CONFIG.instruction}
                  </p>
                </div>
              </div>

              {/* QR Image Card - Clean High-Contrast White Background & Mobile-Friendly Size */}
              <div className="bg-white rounded-2xl p-4 shadow-xl text-center max-w-xs mx-auto border border-slate-200">
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">
                  GPay • PhonePe • Paytm • BHIM • Cred
                </div>

                <div className="w-52 h-52 sm:w-60 sm:h-60 mx-auto bg-white rounded-xl flex items-center justify-center p-1.5 overflow-hidden shadow-xs border border-slate-100">
                  <img
                    src={qrCodeImg}
                    alt="UPI QR Code - Bro Code"
                    className="w-full h-full object-contain"
                    data-testid="upi-qr-image"
                  />
                </div>

                {/* Verified Recipient Details from Actual QR Configuration */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-left text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-semibold">Recipient:</span>
                    <span className="font-extrabold text-slate-900" data-testid="upi-recipient-name">
                      {UPI_CONFIG.recipientName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-slate-500 font-semibold">UPI ID:</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-mono font-bold text-slate-900 text-[11px]" data-testid="upi-id-display">
                        {UPI_CONFIG.upiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-black transition-colors"
                        title="Copy UPI ID"
                        aria-label="Copy UPI ID"
                        data-testid="upi-copy-btn"
                      >
                        {copiedUpi ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-100">
                    <span className="text-[11px] text-slate-600">Total Payable:</span>
                    <span className="text-sm font-black text-brand-orange" data-testid="upi-payable-amount">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Safe Flow Notice Explaining Pending Verification Limitation */}
              <div className="bg-[#181818] border border-[#2E2E2E] rounded-xl p-3 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center space-x-1.5 text-brand-orange font-bold text-xs">
                  <Info className="w-3.5 h-3.5" />
                  <span>Pending Verification Process</span>
                </div>
                <p className="text-slate-400 leading-normal">
                  Static QR scanning does not provide automatic instant bank webhooks. Once submitted, your order will be placed with{' '}
                  <span className="text-amber-300 font-bold">"Pending Verification"</span> status until verified by our hostel delivery bro.
                </p>
              </div>

              {/* Customer Payment Confirmation */}
              <label className="flex items-start space-x-3 p-3 bg-[#181818] border border-[#2E2E2E] hover:border-brand-orange/50 rounded-xl cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={paymentConfirmed}
                  onChange={(e) => setPaymentConfirmed(e.target.checked)}
                  className="mt-0.5 text-brand-orange focus:ring-brand-orange rounded w-4 h-4 cursor-pointer"
                  data-testid="upi-payment-confirm-checkbox"
                />
                <div className="text-xs">
                  <div className="font-bold text-white">
                    I have completed the UPI payment of {formatCurrency(totalAmount)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Check this box to confirm and submit your order for delivery verification.
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Bill Summary */}
          <div className="pt-3 border-t border-[#262626] text-xs space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-bold text-white" data-testid="checkout-subtotal">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{orderType === 'pickup' ? 'Self Pickup:' : 'Hostel Delivery Fee:'}</span>
              <span
                className={`font-bold ${deliveryCharge === 0 ? 'text-emerald-400' : 'text-white'}`}
                data-testid="checkout-delivery-charge"
              >
                {deliveryCharge === 0 ? 'FREE (₹0)' : formatCurrency(deliveryCharge)}
              </span>
            </div>
          </div>

          {/* Total & Submit */}
          <div className="pt-4 border-t border-[#262626] flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold">Total Amount</div>
              <div className="text-lg font-black text-brand-orange" data-testid="checkout-total-amount">
                {formatCurrency(totalAmount)}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3 px-8 rounded-full bg-brand-orange hover:bg-brand-yellow text-black font-black text-sm flex items-center space-x-2 shadow-brand transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>
                {loading
                  ? 'Placing Order...'
                  : formData.paymentMethod === 'upi'
                  ? 'Confirm Order (Pending Verification)'
                  : 'Confirm Order'}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
