import React from 'react';
import {
  Sparkles,
  Flame,
  Cookie,
  Zap,
  CupSoda,
  Candy,
  Sandwich,
  Package,
} from 'lucide-react';
import { SNACK_CATEGORIES } from '../data/hostelConfig';

const iconMap = {
  Sparkles,
  Flame,
  Cookie,
  Zap,
  CupSoda,
  Candy,
  Sandwich,
  Package,
};

export const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 scrollbar-none py-1">
      {SNACK_CATEGORIES.map((cat) => {
        const IconComponent = iconMap[cat.icon] || Sparkles;
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 border ${
              isSelected
                ? 'bg-brand-amber text-midnight-950 font-bold border-brand-amber shadow-neon scale-[1.02]'
                : 'bg-midnight-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700 hover:bg-midnight-850'
            }`}
          >
            <IconComponent className={`w-4 h-4 ${isSelected ? 'stroke-[2.5]' : 'text-brand-amber'}`} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
