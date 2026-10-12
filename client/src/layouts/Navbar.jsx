import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  X,
  Home,
  Grid,
  Package,
  ShieldCheck,
  ChevronRight,
  Flame,
  Phone,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';

export const Navbar = () => {
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#111111] text-white border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Top Bar (< sm): ONLY Centered BroCode Logo */}
          <div className="sm:hidden flex items-center justify-center h-14 w-full">
            <Logo theme="dark" />
          </div>

          {/* Desktop & Tablet Top Bar (>= sm): Full Navigation */}
          <div className="hidden sm:flex items-center justify-between h-14 sm:h-16">
            {/* Left: Tablet Menu Drawer Toggle + Logo */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-white hover:text-brand-orange hover:bg-[#1E1E1E] transition-colors"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-6 h-6 stroke-[2.4]" />
              </button>

              <Logo theme="dark" />
            </div>

            {/* Desktop Center Links */}
            <nav className="hidden md:flex items-center space-x-6 text-xs sm:text-sm font-bold text-slate-300">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? 'text-brand-orange transition-colors'
                    : 'hover:text-white transition-colors'
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/menu"
                className={({ isActive }) =>
                  isActive
                    ? 'text-brand-orange transition-colors'
                    : 'hover:text-white transition-colors'
                }
              >
                All Snacks
              </NavLink>
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  isActive
                    ? 'text-brand-orange transition-colors'
                    : 'hover:text-white transition-colors'
                }
              >
                My Orders
              </NavLink>
            </nav>

            {/* Right: Shopping Cart Icon with Orange Badge matching Image 2 */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Desktop Search input */}
              <form
                onSubmit={handleSearchSubmit}
                className="hidden lg:flex items-center relative w-48 xl:w-60"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search snacks..."
                  className="w-full bg-[#1E1E1E] border border-[#2E2E2E] focus:border-brand-orange rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
              </form>

              {/* Shopping Cart Icon */}
              <Link
                to="/cart"
                className="relative p-1.5 text-white hover:text-brand-orange transition-colors flex items-center justify-center"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-6 h-6 stroke-[2.2] text-white" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#FF5500] text-white font-black text-[10px] flex items-center justify-center shadow-md animate-scale-in">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Desktop Admin button */}
              {isAuthenticated ? (
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center space-x-1 px-3 py-1 rounded-full bg-[#241F14] border border-brand-orange/40 text-brand-orange text-xs font-bold hover:bg-brand-orange hover:text-black transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              ) : (
                <Link
                  to="/admin/login"
                  className="hidden sm:flex p-1.5 text-slate-400 hover:text-white transition-colors"
                  title="Admin"
                >
                  <User className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Sidebar Drawer when Hamburger '☰' is clicked */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-fade-in">
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] bg-[#111111] text-white h-full p-6 flex flex-col justify-between shadow-2xl z-10 border-r border-[#222222]">
            <div>
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[#222222] mb-6">
                <Logo theme="dark" />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[#222222] text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="space-y-1.5 text-sm font-bold">
                <Link
                  to="/"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#1E1E1E] text-slate-200 hover:text-brand-orange transition-colors"
                >
                  <span>Home</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
                <Link
                  to="/menu"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#1E1E1E] text-slate-200 hover:text-brand-orange transition-colors"
                >
                  <span>All Snacks & Drinks</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#1E1E1E] text-slate-200 hover:text-brand-orange transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span>Cart</span>
                    {totalItems > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FF5500] text-white text-[10px] font-black">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#1E1E1E] text-slate-200 hover:text-brand-orange transition-colors"
                >
                  <span>My Orders</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
                <Link
                  to="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#1E1E1E] text-brand-orange transition-colors"
                >
                  <span>Admin Hub</span>
                  <ShieldCheck className="w-4 h-4" />
                </Link>
              </nav>
            </div>

            {/* Footer inside drawer */}
            <div className="pt-4 border-t border-[#222222] text-xs text-slate-400 space-y-2">
              <div className="text-[11px] font-semibold text-slate-300">
                Hostel Midnight Helpline
              </div>
              <div className="text-[11px] text-brand-orange font-bold flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>+91 98765 43210</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1">
                Delivering 10:00 PM – 4:30 AM
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (SLEEK DARK BACKGROUND) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111111] border-t border-[#222222] text-slate-400 flex items-center justify-around py-1.5 px-2 shadow-2xl backdrop-blur-md">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] font-bold py-1 px-3 ${
              isActive ? 'text-brand-orange' : 'hover:text-white text-slate-400'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/menu"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] font-bold py-1 px-3 ${
              isActive ? 'text-brand-orange' : 'hover:text-white text-slate-400'
            }`
          }
        >
          <Grid className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          <span>Snacks</span>
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `relative flex flex-col items-center text-[10px] font-bold py-1 px-3 ${
              isActive ? 'text-brand-orange' : 'hover:text-white text-slate-400'
            }`
          }
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 mb-0.5 stroke-[2.2]" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-[#FF5500] text-white font-black text-[9px] flex items-center justify-center shadow-md">
                {totalItems}
              </span>
            )}
          </div>
          <span>Cart</span>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] font-bold py-1 px-3 ${
              isActive ? 'text-brand-orange' : 'hover:text-white text-slate-400'
            }`
          }
        >
          <Package className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          <span>Orders</span>
        </NavLink>

        <NavLink
          to={isAuthenticated ? '/admin' : '/admin/login'}
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] font-bold py-1 px-3 ${
              isActive ? 'text-brand-orange' : 'hover:text-white text-slate-400'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </>
  );
};
