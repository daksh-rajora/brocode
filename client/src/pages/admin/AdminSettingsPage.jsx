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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setForm((prev) => ({
          ...prev,
          storeName: res.data.storeName || 'Bro Code',
          tagline: res.data.tagline || 'Hostel Ki Bhook, Bro Code Ke Naam!',
          contactNumber: res.data.supportPhone || '+91 98765 43210',
          email: res.data.supportEmail || 'brocode@hostel.in',
          deliveryCharge: res.data.deliveryFee ?? 10,
          minOrderAmount: res.data.minOrderAmount ?? 0,
          acceptOrders: res.data.isOpen ?? true,
        }));
      }
    } catch (error) {
      // Use standard default settings matching mockup
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiService.updateSettings({
        storeName: form.storeName,
        tagline: form.tagline,
        supportPhone: form.contactNumber,
        supportEmail: form.email,
        deliveryFee: parseFloat(form.deliveryCharge) || 10,
        minOrderAmount: parseFloat(form.minOrderAmount) || 0,
        isOpen: form.acceptOrders,
        midnightHours: `${form.openTime} - ${form.closeTime}`,
      });
      toast.success('Store settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
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
          <h2 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
            Delivery Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Charge (₹)
              </label>
              <input
                type="number"
                name="deliveryCharge"
                value={form.deliveryCharge}
                onChange={handleChange}
                min="0"
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Free Delivery Above (₹)
              </label>
              <input
                type="number"
                name="freeDeliveryAbove"
                value={form.freeDeliveryAbove}
                onChange={handleChange}
                min="0"
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Order Amount (₹)
              </label>
              <input
                type="number"
                name="minOrderAmount"
                value={form.minOrderAmount}
                onChange={handleChange}
                min="0"
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-orange rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
              />
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
