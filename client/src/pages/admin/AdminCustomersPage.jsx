import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, MapPin, ShoppingBag, ArrowRight } from 'lucide-react';
import { apiService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminCustomersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAllOrders({ limit: 100 });
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading hostel student directory..." />;
  }

  // Aggregate customers by phone/name
  const customerMap = {};
  orders.forEach((ord) => {
    const key = ord.studentPhone || ord.studentName || 'Anonymous';
    if (!customerMap[key]) {
      customerMap[key] = {
        name: ord.studentName || 'Student',
        phone: ord.studentPhone || 'N/A',
        hostel: ord.hostelBlock || 'Hostel Block',
        room: ord.roomNumber || 'N/A',
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: ord.createdAt,
      };
    }
    customerMap[key].totalOrders += 1;
    customerMap[key].totalSpent += ord.totalAmount || 0;
    if (new Date(ord.createdAt) > new Date(customerMap[key].lastOrderDate)) {
      customerMap[key].lastOrderDate = ord.createdAt;
      customerMap[key].room = ord.roomNumber || customerMap[key].room;
      customerMap[key].hostel = ord.hostelBlock || customerMap[key].hostel;
    }
  });

  const customerList = Object.values(customerMap).filter((c) => {
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      c.hostel.toLowerCase().includes(search.toLowerCase()) ||
      c.room.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hostel Customers</h1>
        <p className="text-xs text-slate-500 mt-1">
          Directory of hostel residents ordering midnight snacks across campus blocks.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer by name, room or phone..."
          className="w-full bg-white border border-slate-200 focus:border-brand-orange rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none"
        />
      </div>

      {/* MOBILE VIEW (< md): Student Customer Cards */}
      <div className="md:hidden space-y-3">
        {customerList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-700">No customer orders recorded yet.</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Hostel residents will appear in this directory as they place midnight snack orders.
            </p>
          </div>
        ) : (
          customerList.map((c, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.phone}</div>
                  </div>
                </div>

                <span className="text-sm font-black text-brand-orange">
                  {formatCurrency(c.totalSpent)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                <span>{c.hostel}, Rm {c.room}</span>
                <span className="font-bold text-slate-800">
                  {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP/TABLET VIEW (>= md): Customers Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Hostel & Room</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Orders Placed</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-xs">
                    No customer orders recorded yet.
                  </td>
                </tr>
              ) : (
                customerList.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {c.hostel}, Room {c.room}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{c.phone}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px]">
                        {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-brand-orange">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(c.lastOrderDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
