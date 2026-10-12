export const SNACK_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'Sparkles' },
  { id: 'chips', label: 'Chips', icon: 'Cookie' },
  { id: 'chocolates', label: 'Chocolates', icon: 'Candy' },
  { id: 'noodles', label: 'Noodles', icon: 'Flame' },
  { id: 'drinks', label: 'Cold Drinks', icon: 'CupSoda' },
  { id: 'biscuits', label: 'Biscuits', icon: 'Package' },
  { id: 'munchies', label: 'Munchies', icon: 'Zap' },
  { id: 'essentials', label: 'Daily Essentials', icon: 'ShieldCheck' },
];

export const HOME_CATEGORY_CARDS = [
  {
    id: 'chips',
    title: 'Chips',
    image: '/packs/lays.jpg',
  },
  {
    id: 'chocolates',
    title: 'Chocolates',
    image: '/packs/dairy_milk.jpg',
  },
  {
    id: 'biscuits',
    title: 'Biscuits',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'noodles',
    title: 'Noodles',
    image: '/packs/maggi.jpg',
  },
  {
    id: 'drinks',
    title: 'Cold Drinks',
    image: '/packs/coke.jpg',
  },
  {
    id: 'all',
    title: 'All Snacks',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80',
  },
];

export const DEFAULT_HOSTEL_BLOCKS = [
  'BH1',
  'BH2',
  'BH3-A',
  'BH3-B',
];

export const PAYMENT_METHODS = [
  {
    id: 'cash_on_delivery',
    label: 'Cash on Delivery',
    subtitle: 'Pay exact cash when delivery bro arrives at room',
    badge: 'Popular',
  },
  {
    id: 'upi_on_delivery',
    label: 'UPI (Optional)',
    subtitle: 'Scan QR at room door (GPay / PhonePe / Paytm)',
    badge: 'Instant',
  },
];

export const ORDER_STATUS_CONFIG = {
  placed: {
    label: 'Pending',
    color: 'bg-amber-950/70 text-amber-300 border-amber-800',
    dotColor: 'bg-amber-400',
    step: 1,
  },
  preparing: {
    label: 'In Kitchen',
    color: 'bg-blue-950/70 text-blue-300 border-blue-800',
    dotColor: 'bg-blue-400',
    step: 2,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'bg-purple-950/70 text-purple-300 border-purple-800',
    dotColor: 'bg-purple-400',
    step: 3,
  },
  delivered: {
    label: 'Completed',
    color: 'bg-emerald-950/70 text-emerald-300 border-emerald-800',
    dotColor: 'bg-emerald-400',
    step: 4,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-rose-950/70 text-rose-300 border-rose-800',
    dotColor: 'bg-rose-400',
    step: 0,
  },
};
