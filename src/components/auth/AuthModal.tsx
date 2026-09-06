import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Briefcase,
  Zap
} from 'lucide-react';
import { UserProfile } from '../../types';
import { soundEngine } from '../../utils/quantEngine';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogin: (updatedUser: UserProfile) => void;
  isDark: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogin,
  isDark,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState(user.email || 'alex.mercer@citadel-quant.ai');
  const [name, setName] = useState(user.name || 'Alex Mercer');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedPreset, setSelectedPreset] = useState<'institutional' | 'junior' | 'student'>('institutional');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: 'institutional' | 'junior' | 'student') => {
    setSelectedPreset(preset);
    if (preset === 'institutional') {
      setName('Dr. Evelyn Vance');
      setEmail('evelyn.vance@two-sigma-alpha.com');
    } else if (preset === 'junior') {
      setName('Alex Mercer');
      setEmail('alex.mercer@quant-research.io');
    } else {
      setName('Leo Zhang');
      setEmail('leo.zhang@berkeley-mfe.edu');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let balance = 100000;
    let level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'INTERMEDIATE';
    let xp = 450;

    if (selectedPreset === 'institutional') {
      balance = 500000;
      level = 'ADVANCED';
      xp = 1850;
    } else if (selectedPreset === 'student') {
      balance = 25000;
      level = 'BEGINNER';
      xp = 100;
    }

    const updated: UserProfile = {
      ...user,
      name,
      email,
      balanceUsd: balance,
      level,
      xpPoints: xp,
    };

    onLogin(updated);
    soundEngine.playAlert('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl border ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      } shadow-2xl p-6 relative`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {isRegister ? 'Create QuantEdge Account' : 'Secure Trader Authentication'}
            </h2>
            <p className="text-xs text-slate-400">
              Personalized strategy tracking, paper balance, & learning progress
            </p>
          </div>
        </div>

        {/* One-Click Demo Presets */}
        <div className="my-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            Quick One-Click Persona Presets:
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              { id: 'institutional', label: 'Hedge Fund Lead', bal: '$500K' },
              { id: 'junior', label: 'Quant Analyst', bal: '$100K' },
              { id: 'student', label: 'MFE Student', bal: '$25K' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                id={`auth-preset-${p.id}`}
                onClick={() => handleSelectPreset(p.id as any)}
                className={`p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  selectedPreset === p.id
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[10px] truncate">{p.label}</div>
                <div className="font-mono text-cyan-400 text-[11px] mt-0.5">{p.bal}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Trader Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="auth-submit-btn"
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Authenticate & Save Profile</span>
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-cyan-400 hover:underline"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
