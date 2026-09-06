import React, { useState } from 'react';
import { 
  TrendingUp, 
  Moon, 
  Sun, 
  Bell, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Monitor, 
  Award, 
  Zap, 
  User, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { MarketTicker, UserProfile } from '../../types';

interface NavbarProps {
  user: UserProfile;
  tickers: MarketTicker[];
  isDark: boolean;
  onToggleTheme: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  isMobileFrame?: boolean;
  onToggleMobileFrame?: () => void;
  onOpenAuth: () => void;
  onOpenAlerts?: () => void;
  unreadAlertsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  tickers,
  isDark,
  onToggleTheme,
  soundEnabled = true,
  onToggleSound = () => {},
  isMobileFrame = false,
  onToggleMobileFrame = () => {},
  onOpenAuth,
  onOpenAlerts = () => {},
  unreadAlertsCount = 0,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const displayName = user.name || user.username || 'Dr. Evelyn Vance';
  const displayInitial = (displayName.trim().charAt(0) || 'E').toUpperCase();
  const streak = user.streakDays ?? 4;
  const balance = (user.balanceUsd ?? 100000).toLocaleString();
  const xp = user.xpPoints ?? 350;

  return (
    <header className={`border-b transition-colors duration-200 sticky top-0 z-40 ${
      isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'
    } backdrop-blur-md`}>
      {/* Top Ticker Marquee Bar */}
      <div className={`overflow-hidden border-b py-1 px-4 text-xs font-mono flex items-center gap-6 ${
        isDark ? 'bg-slate-950/80 border-slate-800/80 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-1.5 shrink-0 text-cyan-500 font-semibold uppercase tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Live Stream
        </div>

        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap">
          {tickers.map((t) => (
            <div key={t.symbol} className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-slate-200">{t.symbol}</span>
              <span className="text-slate-100 font-semibold">${t.price.toLocaleString()}</span>
              <span className={`flex items-center text-[11px] font-bold ${
                t.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {t.change24h >= 0 ? '+' : ''}{t.change24h}%
              </span>
              <span className="text-[10px] text-slate-500">1m Vol: {t.volatility1m}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                QuantEdge
              </span>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                isDark ? 'bg-cyan-950/60 border-cyan-800 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
              }`}>
                Algo Lab
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none hidden sm:block">
              Quant Finance & High-Frequency Simulation
            </p>
          </div>
        </div>

        {/* User Stats & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* XP & Streak */}
          <div className={`hidden md:flex items-center gap-3 px-3 py-1 rounded-lg border text-xs ${
            isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1 text-amber-400 font-semibold" title="Learning XP">
              <Zap className="h-3.5 w-3.5 fill-amber-400" />
              <span>{xp} XP</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1 text-orange-400 font-semibold" title="Daily Streak">
              <Award className="h-3.5 w-3.5" />
              <span>{streak}d streak</span>
            </div>
          </div>

          {/* Device Frame Mode Toggle */}
          <button
            id="toggle-mobile-frame-btn"
            onClick={onToggleMobileFrame}
            title={isMobileFrame ? "Switch to Full Desktop Workstation" : "Switch to React Native / Mobile Frame Mode"}
            className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium ${
              isMobileFrame
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isMobileFrame ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            <span className="hidden lg:inline">{isMobileFrame ? 'Mobile Native' : 'Desktop'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="toggle-sound-btn"
            onClick={onToggleSound}
            title={soundEnabled ? "Mute Alert Audio" : "Enable Alert Audio"}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-400'
                : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Volatility Alerts Notification Icon */}
          <button
            id="open-alerts-btn"
            onClick={onOpenAlerts}
            title="Volatility Alerts & Push Notifications"
            className={`p-2 rounded-lg border relative transition-colors ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bell className="h-4 w-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            id="toggle-theme-btn"
            onClick={onToggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`p-2 rounded-lg border transition-colors ${
              isDark ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              id="profile-menu-btn"
              onClick={() => onOpenAuth()}
              className={`flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <div className="h-6 w-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs font-bold">
                {displayInitial}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-slate-200 leading-tight">{displayName}</div>
                <div className="text-[10px] text-cyan-400 font-mono">${balance}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
