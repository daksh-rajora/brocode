import React, { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  DollarSign,
  Phone,
  Mail,
  CheckCircle2,
  Building,
  Save,
  Truck,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [savedSettings, setSavedSettings] = useState(null);
  const [deliveryError, setDeliveryError] = useState('');

  const [form, setForm] = useState({
    storeName: 'Bro Code',
    tagline: 'Hostel Ki Bhook, Bro Code Ke Naam!',
    contactNumber: '+91 98765 43210',
    email: 'brocode@hostel.in',
    deliveryCharge: 10,
    freeDeliveryAbove: 150,
    minOrderAmount: 0,
    openTime: '10:00 PM',
    closeTime: '04:30 AM',
    acceptOrders: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await apiService.getSettings();
      if (res.data) {
        setSavedSettings(res.data);
        const fee = typeof res.data.deliveryFee === 'number' ? res.data.deliveryFee : 10;
        setForm((prev) => ({
          ...prev,
          storeName: res.data.storeName || 'Bro Code',
          tagline: res.data.tagline || 'Hostel Ki Bhook, Bro Code Ke Naam!',
          contactNumber: res.data.supportPhone || '+91 98765 43210',
          email: res.data.supportEmail || 'brocode@hostel.in',
          deliveryCharge: fee,
          freeDeliveryAbove: res.data.freeDeliveryAbove ?? 150,
          minOrderAmount: res.data.minOrderAmount ?? 0,
          acceptOrders: res.data.isOpen ?? true,
        }));
      }
    } catch (error) {
      toast.error('Failed to load store settings from server');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'deliveryCharge') {
      const num = Number(value);
      if (value !== '' && (isNaN(num) || num < 0)) {
        setDeliveryError('Delivery charge cannot be negative. Enter 0 for free delivery.');
      } else {
        setDeliveryError('');
      }
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateDeliveryCharge = () => {
    if (form.deliveryCharge === '' || form.deliveryCharge === null || form.deliveryCharge === undefined) {
      setDeliveryError('Please enter a delivery charge (enter 0 for free delivery).');
      return null;
    }
    const charge = Number(form.deliveryCharge);
    if (isNaN(charge)) {
      setDeliveryError('Delivery charge must be a valid number.');
      return null;
    }
    if (charge < 0) {
      setDeliveryError('Delivery charge cannot be negative. Enter 0 for free delivery.');
      return null;
    }
    setDeliveryError('');
    return charge;
  };

  // Dedicated Save Changes button handler for Delivery Settings
  const handleSaveDeliverySettings = async (e) => {
    if (e) e.preventDefault();
    const charge = validateDeliveryCharge();
    if (charge === null) {
      toast.error(deliveryError || 'Invalid delivery charge. Enter 0 for free delivery.');
      return;
    }

    try {
      setSavingDelivery(true);
      const res = await apiService.updateSettings({
        deliveryFee: charge,
        freeDeliveryAbove: Number(form.freeDeliveryAbove) || 0,
        minOrderAmount: Number(form.minOrderAmount) || 0,
      });
      setSavedSettings(res.data);
      toast.success(
        charge === 0
          ? 'Delivery charge set to ₹0 (Free Delivery)!'
          : `Delivery charge updated to ₹${charge} successfully!`
      );
    } catch (err) {
      const errMsg = err.message || err.errors?.[0]?.message || 'Failed to save delivery settings';
      toast.error(errMsg);
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const charge = validateDeliveryCharge();
    if (charge === null) {
      toast.error(deliveryError || 'Invalid delivery charge. Enter 0 for free delivery.');
      return;
    }

    try {
      setSaving(true);
      const res = await apiService.updateSettings({
        storeName: form.storeName,
        tagline: form.tagline,
        supportPhone: form.contactNumber,
        supportEmail: form.email,
        deliveryFee: charge,
        freeDeliveryAbove: Number(form.freeDeliveryAbove) || 0,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        isOpen: form.acceptOrders,
        midnightHours: `${form.openTime} - ${form.closeTime}`,
      });
      setSavedSettings(res.data);
      toast.success('Store settings saved successfully!');
    } catch (err) {
      const errMsg = err.message || err.errors?.[0]?.message || 'Failed to save settings';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading store configuration..." />;
  }

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl mx-auto min-w-0">
      {/* Header matching Bottom-Right of Mockup */}
      <div className="pb-3.5 sm:pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Store Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your store information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {/* Card 1: Basic Information matching Mockup */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Store Name *
              </label>
              <input
                type="text"
                name="storeName"
                value={form.storeName}
                onChange={handleChange}
                placeholder="Bro Code"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tagline
              </label>
              <input
                type="text"
                name="tagline"
                value={form.tagline}
                onChange={handleChange}
                placeholder="Hostel Ki Bhook, Bro Code Ke Naam!"
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Number
              </label>
              <input
                type="text"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="brocode@hostel.in"
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Delivery Settings matching Mockup */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-brand-orange" />
              <h2 className="text-sm font-black text-slate-900">Delivery Settings</h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-500">Current Charge:</span>
              <span
                data-testid="current-delivery-charge-display"
                className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-900 text-brand-orange"
              >
                {savedSettings?.deliveryFee !== undefined
                  ? savedSettings.deliveryFee === 0
                    ? 'Free Delivery (₹0)'
                    : `₹${savedSettings.deliveryFee}`
                  : `₹${form.deliveryCharge}`}
              </span>
            </div>
          </div>

          {/* Current Saved Delivery Charge Status & Quick Save Button */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">
                  Storefront Active Charge:{' '}
                  <span className="text-brand-orange font-black" data-testid="saved-delivery-fee-badge">
                    {savedSettings?.deliveryFee === 0
                      ? 'FREE (₹0)'
                      : `₹${savedSettings?.deliveryFee ?? form.deliveryCharge}`}
                  </span>
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                    (savedSettings?.deliveryFee ?? Number(form.deliveryCharge)) === 0
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {(savedSettings?.deliveryFee ?? Number(form.deliveryCharge)) === 0
                    ? 'Free Delivery Active'
                    : 'Standard Delivery Active'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Saved changes take effect immediately for all subsequent customer orders. Enter ₹0 for free delivery.
              </p>
            </div>

            <button
              type="button"
              data-testid="save-delivery-charge-btn"
              onClick={handleSaveDeliverySettings}
              disabled={savingDelivery || saving || Boolean(deliveryError)}
              className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-yellow text-black font-black text-xs shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center space-x-1.5 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingDelivery ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div>
              <label htmlFor="deliveryCharge" className="block text-xs font-bold text-slate-700 mb-1">
                Default Delivery Charge (₹) *
              </label>
              <input
                type="number"
                id="deliveryCharge"
                name="deliveryCharge"
                data-testid="delivery-charge-input"
                value={form.deliveryCharge}
                onChange={handleChange}
                min="0"
                step="1"
                required
                placeholder="0"
                className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none transition-colors ${
                  deliveryError
                    ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                    : 'border-slate-200 focus:border-brand-orange'
                }`}
              />
              {deliveryError ? (
                <div
                  className="flex items-center space-x-1 text-[11px] text-rose-500 font-semibold mt-1"
                  data-testid="delivery-charge-error"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{deliveryError}</span>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter 0 for free delivery. Negative values are blocked.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="freeDeliveryAbove" className="block text-xs font-bold text-slate-700 mb-1">
                Free Delivery Above (₹)
              </label>
              <input
                type="number"
                id="freeDeliveryAbove"
                name="freeDeliveryAbove"
                value={form.freeDeliveryAbove}
                onChange={handleChange}
                min="0"
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Optional threshold for zero shipping
              </p>
            </div>

            <div>
              <label htmlFor="minOrderAmount" className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Order Amount (₹)
              </label>
              <input
                type="number"
                id="minOrderAmount"
                name="minOrderAmount"
                value={form.minOrderAmount}
                onChange={handleChange}
                min="0"
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Checkout blocked below this subtotal
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Operating Hours matching Mockup */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
            Operating Hours
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Open Time *
              </label>
              <input
                type="text"
                name="openTime"
                value={form.openTime}
                onChange={handleChange}
                placeholder="08:00 AM"
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Close Time *
              </label>
              <input
                type="text"
                name="closeTime"
                value={form.closeTime}
                onChange={handleChange}
                placeholder="03:00 AM"
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-2.5">
            <input
              type="checkbox"
              id="acceptOrders"
              name="acceptOrders"
              checked={form.acceptOrders}
              onChange={handleChange}
              className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange cursor-pointer"
            />
            <label htmlFor="acceptOrders" className="text-xs font-bold text-slate-800 cursor-pointer">
              Accept Orders (Turn off to show kitchen resting banner)
            </label>
          </div>
        </div>

        {/* Save Settings Orange CTA */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-brand-orange hover:bg-brand-yellow text-black font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 text-center"
          >
            {saving ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
