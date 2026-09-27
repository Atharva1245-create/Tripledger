import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, MapPin, Sparkles } from 'lucide-react';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated: () => void;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onTripCreated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestMembers, setGuestMembers] = useState<{ name: string; email?: string }[]>([
    { name: 'Rohit (Guest)' }
  ]);
  const [newGuestName, setNewGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddGuest = () => {
    if (!newGuestName.trim()) return;
    setGuestMembers([...guestMembers, { name: newGuestName.trim() }]);
    setNewGuestName('');
  };

  const handleRemoveGuest = (index: number) => {
    setGuestMembers(guestMembers.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('tripledger_token');
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          currency: 'INR',
          budget: budget ? parseFloat(budget) : null,
          startDate: startDate || null,
          endDate: endDate || null,
          guestMembers
        })
      });

      if (res.ok) {
        onTripCreated();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-purple-100 space-y-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3D1B5B] to-[#8E58A6] text-white flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#2D1344]">Create New Trip</h3>
              <p className="text-xs text-slate-500 font-medium">Add members & optional budget</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Trip Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Goa Trip 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Budget (INR)</label>
            <input
              type="number"
              placeholder="50000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          {/* Add Guest Members Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-semibold text-slate-600 block">Add Guest Members</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Guest Member Name"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <button
                type="button"
                onClick={handleAddGuest}
                className="px-4 py-2 rounded-xl bg-[#3D1B5B] text-white font-bold text-xs hover:bg-[#2D1344]"
              >
                + Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {guestMembers.map((g, idx) => (
                <span key={idx} className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  {g.name}
                  <button type="button" onClick={() => handleRemoveGuest(idx)} className="text-slate-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white font-bold transition-all shadow-md text-sm mt-2"
          >
            {submitting ? 'Creating Trip...' : 'Create Trip'}
          </button>
        </form>
      </div>
    </div>
  );
};
