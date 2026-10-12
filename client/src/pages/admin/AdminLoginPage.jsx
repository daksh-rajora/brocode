import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, ShieldCheck, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminLoginPage = () => {
  const { login, bootstrapAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [hasAdmin, setHasAdmin] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await apiService.checkAdminExists();
        setHasAdmin(response.data?.hasAdmin ?? true);
      } catch (error) {
        console.error('Failed to check admin status:', error);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkStatus();
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      if (!hasAdmin) {
        // First run setup
        if (!form.name.trim()) {
          toast.error('Please enter your name');
          setLoading(false);
          return;
        }
        await bootstrapAdmin({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        toast.success('Admin account created! Welcome to Bro Code Admin Hub.');
      } else {
        await login(form.email.trim(), form.password);
        toast.success('Admin login successful!');
      }
      navigate('/admin');
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return <LoadingSpinner text="Checking system configuration..." />;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-midnight-900 border border-slate-800 rounded-3xl p-8 shadow-2xl glass-panel">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-brand-amber to-brand-orange flex items-center justify-center text-midnight-950 font-black shadow-neon mb-4">
            <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h1 className="text-2xl font-black text-white">
            {hasAdmin ? 'Admin & Warden Portal' : 'Initialize First Admin Account'}
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            {hasAdmin
              ? 'Sign in to manage midnight orders, snack stock, and store operations.'
              : 'No administrator account exists yet. Create the initial administrative account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!hasAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Hostel Warden / Manager"
                  required
                  className="w-full bg-midnight-950 border border-slate-800 focus:border-brand-amber rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@brocode.hostel"
                required
                className="w-full bg-midnight-950 border border-slate-800 focus:border-brand-amber rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••••••"
                required
                className="w-full bg-midnight-950 border border-slate-800 focus:border-brand-amber rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-amber to-brand-orange text-midnight-950 font-black text-sm flex items-center justify-center space-x-2 shadow-neon hover:opacity-95 transition-opacity disabled:opacity-50 mt-6"
          >
            <span>{loading ? 'Authenticating...' : hasAdmin ? 'Sign In as Admin' : 'Create Admin Account'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
