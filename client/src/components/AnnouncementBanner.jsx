import React from 'react';
import { AlertCircle, Clock, Moon, Sparkles } from 'lucide-react';

export const AnnouncementBanner = ({ settings }) => {
  if (!settings) return null;

  const { isOpen, midnightHours, announcementBanner } = settings;

  if (!isOpen) {
    return (
      <div className="bg-rose-950/80 border-b border-rose-500/30 text-rose-200 px-4 py-2.5 text-center text-xs md:text-sm font-medium flex items-center justify-center space-x-2">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
        <span>
          <strong>Store currently closed:</strong> Bro Code kitchen is resting. Orders reopen at midnight ({midnightHours || '10:00 PM - 04:30 AM'}). You can still browse the menu!
        </span>
      </div>
    );
  }

  return (
    <div className="bg-midnight-900 border-b border-brand-amber/20 text-slate-200 px-4 py-2 text-xs md:text-sm flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      <div className="flex items-center space-x-1.5 text-brand-amber font-semibold">
        <Moon className="w-3.5 h-3.5 fill-current" />
        <span>Hostel Midnight Delivery Active</span>
      </div>
      <div className="hidden sm:inline text-slate-600">•</div>
      <div className="flex items-center space-x-1 text-slate-300">
        <Clock className="w-3.5 h-3.5 text-brand-yellow" />
        <span>Hours: {midnightHours || '10:00 PM - 04:30 AM'}</span>
      </div>
      {announcementBanner && (
        <>
          <div className="hidden md:inline text-slate-600">•</div>
          <div className="text-slate-400 truncate max-w-md hidden md:flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-amber shrink-0" />
            <span className="truncate">{announcementBanner}</span>
          </div>
        </>
      )}
    </div>
  );
};
