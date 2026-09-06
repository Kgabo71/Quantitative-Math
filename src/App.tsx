import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { NavigationTabs, TabType } from './components/layout/NavigationTabs';
import { AcademyView } from './components/academy/AcademyView';
import { MarketSimulatorView } from './components/simulation/MarketSimulatorView';
import { BacktesterView } from './components/backtester/BacktesterView';
import { RiskDashboardView } from './components/risk/RiskDashboardView';
import { TradeTrackerView } from './components/tracker/TradeTrackerView';
import { AiTutorView } from './components/tutor/AiTutorView';
import { VolatilityAlertsView } from './components/alerts/VolatilityAlertsView';
import { AuthModal } from './components/auth/AuthModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { 
  MarketTicker, 
  UserProfile, 
  TradeRecord, 
  VolatilityAlert, 
  PositionRisk 
} from './types';
import { Smartphone, Monitor } from 'lucide-react';

const DEFAULT_USER: UserProfile = {
  id: 'usr-1',
  name: 'Index & Gold Trader',
  username: 'quant_trader',
  email: 'trader@quantedge.ai',
  role: 'Senior Algorithmic Trader',
  balanceUsd: 100000,
  marginUsedUsd: 15000,
  maxDailyLossLimitUsd: 5000,
  maxPositionSizeUsd: 25000,
  xpPoints: 420,
  streakDays: 5,
  level: 'INTERMEDIATE',
  riskTolerance: 'MODERATE',
  completedLessons: ['stat-arb-pairs-1', 'black-scholes-greeks-1'],
  bookmarkedLessons: [],
  watchlist: ['US30', 'NAS100', 'XAU/USD', 'SPY', 'BTC/USDT'],
  soundEnabled: true,
  pushNotificationsEnabled: true,
};

const DEFAULT_TRADES: TradeRecord[] = [
  {
    id: 'tr-1',
    symbol: 'US30',
    side: 'BUY',
    orderType: 'MARKET',
    price: 40820,
    amount: 2.0,
    totalUsd: 81640,
    status: 'OPEN',
    strategyTag: 'Opening Range Breakout (ORB)',
    notes: 'NY 09:30 AM liquidity sweep & breaker block retest on Wall Street 30.',
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'tr-2',
    symbol: 'NAS100',
    side: 'BUY',
    orderType: 'LIMIT',
    price: 19820.50,
    amount: 3.0,
    totalUsd: 59461.50,
    status: 'OPEN',
    strategyTag: 'Trend Following',
    notes: 'Dual EMA 12/50 golden cross on 5m chart with Order Flow Imbalance confirmation.',
    createdAt: Date.now() - 3600000 * 8,
  },
  {
    id: 'tr-3',
    symbol: 'XAU/USD',
    side: 'BUY',
    orderType: 'MARKET',
    price: 2492.40,
    amount: 20.0,
    totalUsd: 49848,
    status: 'CLOSED',
    pnl: 1480,
    strategyTag: 'Mean Reversion StatArb',
    notes: 'London Fix mean reversion bounce off 2.5 sigma lower Bollinger Band.',
    createdAt: Date.now() - 3600000 * 18,
  }
];

const DEFAULT_ALERTS: VolatilityAlert[] = [
  { id: 'al-1', symbol: 'US30', type: 'VOLATILITY_SPIKE', threshold: 1.5, enabled: true, pushNotification: true, soundAlert: true, createdAt: Date.now() },
  { id: 'al-2', symbol: 'NAS100', type: 'PRICE_ABOVE', threshold: 20000.0, enabled: true, pushNotification: true, soundAlert: false, createdAt: Date.now() },
  { id: 'al-3', symbol: 'XAU/USD', type: 'SPREAD_WIDENING', threshold: 0.40, enabled: true, pushNotification: true, soundAlert: true, createdAt: Date.now() },
];

export function App() {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('simulation');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [tutorPrefillTopic, setTutorPrefillTopic] = useState<string>('');

  // User Profile with safe default merge
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('quantedge_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_USER,
            ...parsed,
            completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : DEFAULT_USER.completedLessons,
            watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : DEFAULT_USER.watchlist,
            bookmarkedLessons: Array.isArray(parsed.bookmarkedLessons) ? parsed.bookmarkedLessons : DEFAULT_USER.bookmarkedLessons,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved user', e);
    }
    return DEFAULT_USER;
  });

  // Real-time market tickers
  const [tickers, setTickers] = useState<MarketTicker[]>([
    { symbol: 'US30', price: 40850.20, bid: 40849.30, ask: 40851.10, spread: 1.8, change24h: 0.62, volume: 1850000000, volatility1m: 0.95, type: 'index', timestamp: Date.now() },
    { symbol: 'NAS100', price: 19840.50, bid: 19839.95, ask: 19841.05, spread: 1.1, change24h: 1.34, volume: 2940000000, volatility1m: 1.45, type: 'index', timestamp: Date.now() },
    { symbol: 'XAU/USD', price: 2498.80, bid: 2498.67, ask: 2498.93, spread: 0.25, change24h: 0.78, volume: 820000000, volatility1m: 1.15, type: 'commodity', timestamp: Date.now() },
    { symbol: 'SPY', price: 548.90, bid: 548.88, ask: 548.92, spread: 0.04, change24h: 0.85, volume: 42000000, volatility1m: 0.65, type: 'equity', timestamp: Date.now() },
    { symbol: 'BTC/USDT', price: 68420.50, bid: 68418.50, ask: 68422.50, spread: 4.0, change24h: 3.42, volume: 1420500000, volatility1m: 1.85, type: 'crypto', timestamp: Date.now() },
    { symbol: 'EUR/USD', price: 1.0845, bid: 1.0844, ask: 1.0846, spread: 0.0002, change24h: -0.22, volume: 125000000, volatility1m: 0.35, type: 'fx', timestamp: Date.now() },
  ]);

  // Paper Trades Journal
  const [trades, setTrades] = useState<TradeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('quantedge_trades');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_TRADES;
  });

  // Volatility Alerts
  const [alerts, setAlerts] = useState<VolatilityAlert[]>(() => {
    try {
      const saved = localStorage.getItem('quantedge_alerts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_ALERTS;
  });

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem('quantedge_user', JSON.stringify(user));
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('quantedge_trades', JSON.stringify(trades));
    } catch (e) {}
  }, [trades]);

  useEffect(() => {
    try {
      localStorage.setItem('quantedge_alerts', JSON.stringify(alerts));
    } catch (e) {}
  }, [alerts]);

  // Fetch real-time market tickers from backend API periodically
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const res = await fetch('/api/market/tickers');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.tickers) && data.tickers.length > 0) {
            setTickers(data.tickers);
          } else if (Array.isArray(data) && data.length > 0) {
            setTickers(data);
          }
        }
      } catch (err) {
        // Fallback to local stochastic tick
        setTickers(prev => prev.map(t => {
          const noise = (Math.random() - 0.49) * 0.002;
          const newPrice = Number((t.price * (1 + noise)).toFixed(t.type === 'fx' ? 4 : 2));
          return {
            ...t,
            price: newPrice,
            bid: Number((newPrice - t.spread / 2).toFixed(t.type === 'fx' ? 4 : 2)),
            ask: Number((newPrice + t.spread / 2).toFixed(t.type === 'fx' ? 4 : 2)),
            timestamp: Date.now()
          };
        }));
      }
    };

    const interval = setInterval(fetchTickers, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updated }));
  };

  const handleAddTrade = (newTrade: Omit<TradeRecord, 'id' | 'createdAt'>) => {
    const record: TradeRecord = {
      ...newTrade,
      id: `tr-${Date.now()}`,
      createdAt: Date.now(),
    };
    setTrades(prev => [record, ...prev]);
  };

  const handleCloseTrade = (tradeId: string) => {
    setTrades(prev => prev.map(t => {
      if (t.id === tradeId && t.status === 'OPEN') {
        const currentTicker = tickers.find(tk => tk.symbol === t.symbol);
        const exitPrice = currentTicker?.price || t.price;
        const pnl = t.side === 'BUY'
          ? (exitPrice - t.price) * t.amount
          : (t.price - exitPrice) * t.amount;
        
        setUser(u => ({ ...u, balanceUsd: u.balanceUsd + pnl }));
        return {
          ...t,
          status: 'CLOSED',
          pnl: Number(pnl.toFixed(2)),
        };
      }
      return t;
    }));
  };

  const handleAddAlert = (newAlert: Omit<VolatilityAlert, 'id' | 'createdAt'>) => {
    const alertRecord: VolatilityAlert = {
      ...newAlert,
      id: `al-${Date.now()}`,
      createdAt: Date.now(),
    };
    setAlerts(prev => [alertRecord, ...prev]);
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleNavigateToTutor = (topic: string) => {
    setTutorPrefillTopic(topic);
    setActiveTab('tutor');
  };

  // Positions mapped for risk view
  const activePositions: PositionRisk[] = trades
    .filter(t => t.status === 'OPEN')
    .map(t => {
      const mark = tickers.find(tk => tk.symbol === t.symbol)?.price || t.price;
      const uPnl = t.side === 'BUY'
        ? (mark - t.price) * t.amount
        : (t.price - mark) * t.amount;
      const uPnlPct = Number(((uPnl / t.totalUsd) * 100).toFixed(2));
      const notional = mark * t.amount;

      return {
        symbol: t.symbol,
        side: t.side === 'BUY' ? 'LONG' : 'SHORT',
        amount: t.amount,
        entryPrice: t.price,
        markPrice: mark,
        notionalUsd: Number(notional.toFixed(2)),
        unrealizedPnl: Number(uPnl.toFixed(2)),
        unrealizedPnlPct: uPnlPct,
        delta: t.side === 'BUY' ? t.amount : -t.amount,
        gamma: 0.0001,
        liquidationPrice: t.side === 'BUY' ? Number((t.price * 0.7).toFixed(2)) : Number((t.price * 1.3).toFixed(2)),
        stopLossPrice: t.side === 'BUY' ? Number((t.price * 0.96).toFixed(2)) : Number((t.price * 1.04).toFixed(2)),
        takeProfitPrice: t.side === 'BUY' ? Number((t.price * 1.08).toFixed(2)) : Number((t.price * 0.92).toFixed(2)),
      };
    });

  return (
    <ErrorBoundary>
      <div className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      } flex flex-col font-sans selection:bg-cyan-500/30`}>
        {/* Top Navigation Bar with Live Ticker Feed */}
        <Navbar
          user={user}
          tickers={tickers}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenAlerts={() => setActiveTab('alerts')}
          unreadAlertsCount={alerts.filter(a => a.enabled).length}
        />

      {/* Frame Mode Switcher Floating Pill (React Native Mobile vs Desktop Cockpit) */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          id="toggle-mobile-frame-btn"
          onClick={() => setIsMobileFrame(!isMobileFrame)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full font-bold text-xs shadow-2xl border transition-all ${
            isMobileFrame
              ? 'bg-cyan-600 border-cyan-400 text-white shadow-cyan-600/40'
              : isDark
                ? 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white backdrop-blur'
                : 'bg-white/90 border-slate-300 text-slate-700 hover:text-slate-900 backdrop-blur'
          }`}
        >
          {isMobileFrame ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
          <span>{isMobileFrame ? 'Desktop View' : 'React Native Phone View'}</span>
        </button>
      </div>

      {/* Mobile Simulation Frame Wrapper or Full Desktop View */}
      {isMobileFrame ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm h-[820px] rounded-[40px] border-8 ${
            isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-100'
          } shadow-2xl flex flex-col overflow-hidden relative`}>
            {/* Top Phone Notch */}
            <div className="h-6 w-32 bg-slate-800 rounded-b-xl mx-auto z-40 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-slate-700 mr-2" />
              <div className="h-1.5 w-10 rounded-full bg-slate-700" />
            </div>

            {/* Scrollable Mobile Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'academy' && (
                <AcademyView
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  onNavigateToTutor={handleNavigateToTutor}
                  isDark={isDark}
                />
              )}
              {activeTab === 'simulation' && (
                <MarketSimulatorView
                  tickers={tickers}
                  user={user}
                  trades={trades}
                  onExecuteTrade={handleAddTrade}
                  onCloseTrade={handleCloseTrade}
                  alerts={alerts}
                  isDark={isDark}
                />
              )}
              {activeTab === 'backtester' && (
                <BacktesterView
                  tickers={tickers}
                  isDark={isDark}
                  onNavigateToTutor={handleNavigateToTutor}
                />
              )}
              {activeTab === 'risk' && (
                <RiskDashboardView
                  user={user}
                  positions={activePositions}
                  isDark={isDark}
                />
              )}
              {activeTab === 'journal' && (
                <TradeTrackerView
                  user={user}
                  tickers={tickers}
                  trades={trades}
                  onAddTrade={handleAddTrade}
                  onCloseTrade={handleCloseTrade}
                  isDark={isDark}
                />
              )}
              {activeTab === 'tutor' && (
                <AiTutorView
                  user={user}
                  initialTopic={tutorPrefillTopic}
                  isDark={isDark}
                />
              )}
              {activeTab === 'alerts' && (
                <VolatilityAlertsView
                  alerts={alerts}
                  tickers={tickers}
                  onAddAlert={handleAddAlert}
                  onToggleAlert={handleToggleAlert}
                  onDeleteAlert={handleDeleteAlert}
                  isDark={isDark}
                />
              )}
            </div>

            {/* React Native Mobile Bottom Navigation Bar */}
            <NavigationTabs
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              isDark={isDark}
              isMobileFrame={true}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Sub Navigation Tabs */}
          <NavigationTabs
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            isDark={isDark}
          />

          {/* Desktop Main Content */}
          <main className="flex-1 pb-16">
            {activeTab === 'academy' && (
              <AcademyView
                user={user}
                onUpdateUser={handleUpdateUser}
                onNavigateToTutor={handleNavigateToTutor}
                isDark={isDark}
              />
            )}
            {activeTab === 'simulation' && (
              <MarketSimulatorView
                tickers={tickers}
                user={user}
                trades={trades}
                onExecuteTrade={handleAddTrade}
                onCloseTrade={handleCloseTrade}
                alerts={alerts}
                isDark={isDark}
              />
            )}
            {activeTab === 'backtester' && (
              <BacktesterView
                tickers={tickers}
                isDark={isDark}
                onNavigateToTutor={handleNavigateToTutor}
              />
            )}
            {activeTab === 'risk' && (
              <RiskDashboardView
                user={user}
                positions={activePositions}
                isDark={isDark}
              />
            )}
            {activeTab === 'journal' && (
              <TradeTrackerView
                user={user}
                tickers={tickers}
                trades={trades}
                onAddTrade={handleAddTrade}
                onCloseTrade={handleCloseTrade}
                isDark={isDark}
              />
            )}
            {activeTab === 'tutor' && (
              <AiTutorView
                user={user}
                initialTopic={tutorPrefillTopic}
                isDark={isDark}
              />
            )}
            {activeTab === 'alerts' && (
              <VolatilityAlertsView
                alerts={alerts}
                tickers={tickers}
                onAddAlert={handleAddAlert}
                onToggleAlert={handleToggleAlert}
                onDeleteAlert={handleDeleteAlert}
                isDark={isDark}
              />
            )}
          </main>
        </>
      )}

        {/* User Authentication Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          user={user}
          onLogin={(updated) => setUser(updated)}
          isDark={isDark}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
