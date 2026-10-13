import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { apiService } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';

export const MainLayout = () => {
  const [settings, setSettings] = useState(null);

  const fetchSettings = async () => {
    try {
      const response = await apiService.getSettings();
      setSettings(response.data);
    } catch (error) {
      setSettings({
        isOpen: true,
        midnightHours: '10:00 PM - 04:30 AM',
        deliveryFee: 0,
        minOrderAmount: 0,
      });
    }
  };

  useEffect(() => {
    fetchSettings();
    window.addEventListener('focus', fetchSettings);
    return () => window.removeEventListener('focus', fetchSettings);
  }, []);

  useSocketEvent('settings:updated', (updated) => {
    if (updated) {
      setSettings(updated);
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-slate-100 font-sans selection:bg-brand-orange selection:text-black">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#181818',
            color: '#FFFFFF',
            border: '1px solid #333333',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '600',
            padding: '10px 18px',
          },
          success: {
            iconTheme: {
              primary: '#FF9F0D',
              secondary: '#000000',
            },
          },
        }}
      />

      {/* Store Closed Warning Banner (only if admin marked store closed) */}
      {settings && !settings.isOpen && (
        <div className="bg-rose-950 text-rose-200 text-xs py-2 px-4 text-center font-bold">
          ⚠️ Bro Code Kitchen is currently resting. Midnight delivery resumes tonight!
        </div>
      )}

      {/* Primary Header Navbar */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet context={{ settings, refreshSettings: fetchSettings }} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
