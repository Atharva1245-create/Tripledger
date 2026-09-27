import React, { useState } from 'react';
import { User, QrCode, Shield, Check, Save } from 'lucide-react';

interface ProfilePageProps {
  user: any;
  onUserUpdated?: (updatedUser: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUserUpdated }) => {
  const [upiId, setUpiId] = useState(user?.upiId || 'rahul@upi');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('tripledger_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ upiId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update UPI ID');
      }

      setSaved(true);
      if (onUserUpdated && data.user) {
        onUserUpdated(data.user);
      }
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl p-8 shadow-card border border-amber-100/60 space-y-6">
        <div className="flex items-center gap-5 border-b pb-6">
          <img
            src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"}
            alt="User Avatar"
            className="w-20 h-20 rounded-3xl object-cover ring-4 ring-amber-100 shadow-md"
          />
          <div>
            <h2 className="text-2xl font-bold text-[#2D1344]">{user?.name || "Rahul"}</h2>
            <p className="text-xs text-slate-500 font-medium">{user?.email || "rahul@tripledger.com"}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-[#3D1B5B] rounded-full text-xs font-bold">
              Trip Organizer
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Your UPI ID for Settlements</label>
            <div className="relative">
              <QrCode className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. rahul@upi"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Used when group members send you settlement payments directly via UPI.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            {loading ? 'Saving...' : saved ? 'UPI ID Updated!' : 'Save UPI Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

