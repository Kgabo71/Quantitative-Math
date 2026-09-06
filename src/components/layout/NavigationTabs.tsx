import React from 'react';
import { 
  GraduationCap, 
  Activity, 
  FlaskConical, 
  ShieldAlert, 
  BookOpen, 
  Bot, 
  BellRing
} from 'lucide-react';

export type TabType = 'academy' | 'simulation' | 'backtester' | 'risk' | 'journal' | 'tutor' | 'alerts';

interface NavigationTabsProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  isDark: boolean;
  isMobileFrame?: boolean;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onChangeTab,
  isDark,
  isMobileFrame = false,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'academy', label: 'Quant Academy', icon: GraduationCap, badge: 'Interactive' },
    { id: 'simulation', label: 'HF Simulator', icon: Activity, badge: 'Live L2' },
    { id: 'backtester', label: 'Strategy Backtester', icon: FlaskConical },
    { id: 'risk', label: 'Risk Analytics', icon: ShieldAlert },
    { id: 'journal', label: 'Trade Journal', icon: BookOpen },
    { id: 'tutor', label: 'AI Quant Tutor', icon: Bot, badge: 'Gemini 3.8' },
    { id: 'alerts', label: 'Volatility Alerts', icon: BellRing },
  ];

  if (isMobileFrame) {
    // React Native style mobile bottom navigation
    return (
      <nav className={`border-t py-2 px-1 flex items-center justify-around z-30 sticky bottom-0 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-mobile-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all text-[10px] font-medium min-w-[50px] ${
                isActive
                  ? isDark ? 'text-cyan-400 font-bold' : 'text-cyan-600 font-bold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-md mb-0.5 ${isActive ? (isDark ? 'bg-cyan-950/80 text-cyan-400' : 'bg-cyan-50 text-cyan-600') : ''}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="leading-tight truncate max-w-[56px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Desktop tab bar
  return (
    <div className={`border-b px-4 py-2 sticky top-14 z-30 ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/90 border-slate-200'
    } backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
                isActive
                  ? isDark
                    ? 'bg-cyan-600/15 border-cyan-500/50 text-cyan-400 shadow-sm shadow-cyan-950'
                    : 'bg-cyan-50 border-cyan-300 text-cyan-800 shadow-sm'
                  : isDark
                    ? 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                  isActive
                    ? isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800'
                    : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
