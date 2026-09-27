import React, { useState } from 'react';
import { Filter, Search, Plus, MessageSquare, MoreVertical, Trash2 } from 'lucide-react';
import { AvatarGroup } from '../components/AvatarGroup';
import { Expense, TripMember } from '../types';

interface ExpenseListPageProps {
  expenses: Expense[];
  members: TripMember[];
  onNavigate: (tab: string) => void;
  onOpenWhatsApp: (vendorName: string, vendorPhone: string, expenseTitle: string, amount: number) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpenseListPage: React.FC<ExpenseListPageProps> = ({
  expenses,
  members,
  onNavigate,
  onOpenWhatsApp,
  onDeleteExpense
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Action Bar matching Image 2 */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-amber-100/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 pr-8 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all focus:outline-none"
            >
              <option value="ALL">Filter Category</option>
              <option value="Food">Food</option>
              <option value="Hotel">Hotel</option>
              <option value="Transport">Transport</option>
              <option value="Activities">Activities</option>
            </select>
            <Filter className="w-3.5 h-3.5 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
            />
          </div>
        </div>

        {/* Add Expense Button */}
        <button
          onClick={() => onNavigate('add-expense')}
          className="w-full md:w-auto px-6 py-2.5 rounded-2xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Expense List Data Table matching Image 2 */}
      <div className="bg-white rounded-3xl shadow-sm border border-amber-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="p-4 pl-6">Category (Icon)</th>
                <th className="p-4">Expense Name</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Date</th>
                <th className="p-4">Paid By</th>
                <th className="p-4">Participants Shared</th>
                <th className="p-4">Notes</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-amber-50/30 transition-all font-medium">
                  {/* Category Icon */}
                  <td className="p-4 pl-6">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#3D1B5B] flex items-center justify-center font-bold text-lg shadow-sm">
                      {e.category === 'Hotel' ? '🏨' : e.category === 'Food' ? '🍕' : e.category === 'Transport' ? '🚕' : '🎟️'}
                    </div>
                  </td>

                  {/* Expense Name */}
                  <td className="p-4 font-bold text-[#2D1344] text-sm">
                    {e.title}
                  </td>

                  {/* Amount */}
                  <td className="p-4 font-extrabold text-slate-900 text-sm">
                    ₹{e.amount.toLocaleString()}
                  </td>

                  {/* Date */}
                  <td className="p-4 text-slate-500 font-mono">
                    {new Date(e.date).toLocaleDateString('en-GB')}
                  </td>

                  {/* Paid By */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={e.paidByMember?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(e.paidByMember?.name || 'Rahul')}`}
                        alt="Payer"
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-purple-100"
                      />
                      <span className="font-semibold text-slate-700">Paid by {e.paidByMember?.name || 'Rahul'}</span>
                    </div>
                  </td>

                  {/* Participants Shared Avatar Stack */}
                  <td className="p-4">
                    <AvatarGroup members={members} maxDisplay={3} size="sm" />
                  </td>

                  {/* Notes */}
                  <td className="p-4 text-slate-500 max-w-xs truncate">
                    {e.notes || 'Group trip expense'}
                  </td>

                  {/* WhatsApp Action & Options */}
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onOpenWhatsApp(e.vendorName || e.title, e.vendorPhone || '', e.title, e.amount)}
                        className="px-3 py-1.5 rounded-full bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Whatsapp Vendor
                      </button>
                      <button
                        onClick={() => onDeleteExpense(e.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
