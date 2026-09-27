import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('rahul@tripledger.com');
  const [password, setPassword] = useState('password123');
  const [upiId, setUpiId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { name, email, password, upiId } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('tripledger_token', data.token);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#FAF2EA] via-[#F3E5D8] to-[#EBD9C8]">
      {/* Centered Split Card matching Image 5 */}
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-amber-100/50 min-h-[500px]">
        {/* Left Side: Mauve / Plum Brand Panel */}
        <div className="md:w-1/2 bg-gradient-to-br from-[#E6D4E7] via-[#D8BFDB] to-[#C8A8CF] p-12 flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#3D1B5B] text-white flex items-center justify-center shadow-xl shadow-[#3D1B5B]/30">
            <Sparkles className="w-9 h-9 fill-current text-[#D5BD97]" />
          </div>
          <h1 className="text-4xl font-extrabold text-[#3D1B5B] tracking-tight">
            TripLedger
          </h1>
          <p className="text-sm font-medium text-[#4D2375] max-w-xs leading-relaxed opacity-90">
            "Your trip. Your expenses. One smart ledger."
          </p>
          <div className="pt-4 flex gap-2">
            <span className="px-3 py-1 bg-white/40 text-[#3D1B5B] rounded-full text-xs font-semibold">AI Receipt OCR</span>
            <span className="px-3 py-1 bg-white/40 text-[#3D1B5B] rounded-full text-xs font-semibold">UPI Settlement</span>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-bold text-[#2D1344] mb-6">
            {isRegister ? 'Create Account' : 'Login'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Username/Email</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="Username/Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">UPI ID (Optional)</label>
                <input
                  type="text"
                  placeholder="rahul@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white font-bold transition-all shadow-lg shadow-[#3D1B5B]/20 text-sm mt-2"
            >
              {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {!isRegister && (
              <a href="#forgot" className="text-xs text-slate-500 hover:text-[#3D1B5B] block">
                Forgot Password?
              </a>
            )}
            <p className="text-xs text-slate-600">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="font-bold text-[#3D1B5B] hover:underline"
              >
                {isRegister ? 'Login' : 'Register'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
