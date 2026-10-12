import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Grid,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Bell,
  Boxes,
  Layers,
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: Grid, end: true },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { path: '/admin/customers', label: 'Customers', icon: Users },
  { path: '/admin/reports', label: 'Reports', icon: TrendingUp },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export const AdminLayout = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileDrawerOpen]);

  if (isLoading) {
    return <LoadingSpinner text="Loading admin portal..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Derive current page title for mobile top header
  const currentNavItem = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );
  const pageTitle = currentNavItem ? currentNavItem.label : 'Admin Portal';

  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans antialiased text-slate-800">
      {/* ======================================================== */}
      {/* 1. MOBILE TOP HEADER (Below 768px - md:hidden) */}
      {/* ======================================================== */}
      <header className="md:hidden sticky top-0 z-40 bg-[#141414] border-b border-[#242424] px-4 py-3 flex items-center justify-between shadow-md">
        {/* Left: Hamburger & Page Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-[#222222] transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-white font-black text-sm tracking-tight">Bro Code</span>
            <span className="text-slate-500 text-xs">/</span>
            <span className="text-brand-orange font-bold text-xs">{pageTitle}</span>
          </div>
        </div>

        {/* Right: Notifications & Admin Avatar */}
        <div className="flex items-center space-x-2.5">
          <button
            title="Notifications"
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#222222] transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute 1.5 top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#141414]" />
          </button>

          <div className="w-8 h-8 rounded-full bg-[#242424] border border-amber-400/80 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
            A
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MOBILE SLIDE-OUT NAVIGATION DRAWER */}
      {/* ======================================================== */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <aside className="fixed top-0 bottom-0 left-0 w-[280px] sm:w-[320px] max-w-[85vw] bg-[#141414] text-slate-300 p-5 flex flex-col justify-between shadow-2xl z-50 border-r border-[#242424] animate-slide-right overflow-y-auto">
            <div>
              {/* Drawer Header: Logo + Close Button */}
              <div className="pb-5 border-b border-[#242424] mb-5 flex items-center justify-between">
                <Logo theme="dark" />
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#222222] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1 text-xs font-bold" aria-label="Mobile Navigation">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                          isActive
                            ? 'bg-brand-orange text-white shadow-md font-extrabold'
                            : 'text-slate-400 hover:text-white hover:bg-[#1E1E1E]'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer: Admin Profile & Student Store */}
            <div className="pt-5 border-t border-[#242424] space-y-3 mt-6">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1C1C] border border-[#282828]">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#FF5500] text-white font-black text-xs flex items-center justify-center shrink-0">
                    A
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-xs font-black text-white truncate">
                      {user?.name || 'Admin'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {user?.email || 'admin@brocode.in'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    navigate('/admin/login');
                  }}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center space-x-1.5 py-2 text-xs text-slate-400 hover:text-brand-orange font-bold transition-colors rounded-xl hover:bg-[#1E1E1E]"
              >
                <span>View Student Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </aside>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DESKTOP FIXED SIDEBAR (md:flex - 768px and above) */}
      {/* ======================================================== */}
      <aside className="hidden md:flex md:w-60 lg:w-64 md:fixed md:inset-y-0 bg-[#141414] text-slate-300 p-5 flex-col justify-between shrink-0 border-r border-[#222222] z-30 overflow-y-auto">
        <div>
          {/* Logo with Crowns matching Mockup */}
          <div className="pb-6 border-b border-[#242424] mb-6 flex items-center justify-between">
            <Logo theme="dark" />
          </div>

          {/* Navigation items matching Mockup */}
          <nav className="space-y-1 text-xs font-bold" aria-label="Desktop Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-brand-orange text-white shadow-md font-extrabold'
                        : 'text-slate-400 hover:text-white hover:bg-[#1E1E1E]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom user profile card matching Mockup */}
        <div className="pt-5 border-t border-[#242424] space-y-3">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#1C1C1C] border border-[#282828]">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#FF5500] text-white font-black text-xs flex items-center justify-center shrink-0">
                A
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-black text-white truncate">
                  {user?.name || 'Admin'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user?.email || 'admin@brocode.in'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center space-x-1.5 py-1.5 text-[11px] text-slate-400 hover:text-brand-orange font-bold transition-colors"
          >
            <span>View Student Store</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 4. MAIN CONTENT CANVAS */}
      {/* ======================================================== */}
      <div className="md:pl-60 lg:pl-64 flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden bg-[#FAF8F5]">
        <main className="p-4 sm:p-6 md:p-8 flex-1 min-w-0 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
