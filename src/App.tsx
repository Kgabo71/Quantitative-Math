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
import { 
  MarketTicker, 
  UserProfile, 
  TradeRecord, 
  VolatilityAlert, 
  PositionRisk 
} from './types';
import { Smartphone, Monitor } from 'lucide-react';

export function App() {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('academy');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [tutorPrefillTopic, setTutorPrefillTopic] = useState<string>('');

  // User Profile
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('quantedge_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'usr-1',
      name: 'Dr. Evelyn Vance',
      email: 'evelyn.vance@quantedge.ai',
      balanceUsd: 100000,
      riskTolerance: 'MODERATE',
      completedLessons: ['stat-arb-pairs-1', 'black-scholes-greeks-1'],
      xpPoints: 350,
      level: 'INTERMEDIATE',
    };
  });

  // Real-time market tickers
  const [tickers, setTickers] = useState<MarketTicker[]>([
    { symbol: 'BTC/USDT', price: 68420, bid: 68418, ask: 68422, spread: 4.0, change24h: 3.42, volume: 1420000, volatility1m: 2.1, type: 'crypto', timestamp: Date.now() },
    { symbol: 'ETH/USDT', price: 3540, bid: 3539.5, ask: 3540.5, spread: 1.0, change24h: -1.18, volume: 890000, volatility1m: 1.9, type: 'crypto', timestamp: Date.now() },
    { symbol: 'SOL/USDT', price: 184.50, bid: 184.45, ask: 184.55, spread: 0.1, change24h: 5.64, volume: 450000, volatility1m: 3.4, type: 'crypto', timestamp: Date.now() },
    { symbol: 'NVDA', price: 128.45, bid: 128.43, ask: 128.47, spread: 0.04, change24h: 2.15, volume: 2200000, volatility1m: 1.4, type: 'equity', timestamp: Date.now() },
    { symbol: 'SPY', price: 546.20, bid: 546.18, ask: 546.22, spread: 0.04, change24h: 0.45, volume: 3800000, volatility1m: 0.8, type: 'equity', timestamp: Date.now() },
    { symbol: 'EUR/USD', price: 1.0874, bid: 1.0873, ask: 1.0875, spread: 0.0002, change24h: -0.12, volume: 5400000, volatility1m: 0.5, type: 'fx', timestamp: Date.now() },
  ]);

  // Paper Trades Journal
  const [trades, setTrades] = useState<TradeRecord[]>(() => {
    const saved = localStorage.getItem('quantedge_trades');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'tr-1',
        symbol: 'BTC/USDT',
        side: 'BUY',
        orderType: 'MARKET',
        price: 67200,
        amount: 0.85,
        totalUsd: 57120,
        status: 'OPEN',
        strategyTag: 'StatArb Pairs',
        notes: 'Co-integrated spread breached 2.2 sigma standard deviation.',
        createdAt: Date.now() - 3600000 * 5,
      },
      {
        id: 'tr-2',
        symbol: 'NVDA',
        side: 'BUY',
        orderType: 'LIMIT',
        price: 122.50,
        amount: 150,
        totalUsd: 18375,
        status: 'OPEN',
        strategyTag: 'Trend Following',
        notes: 'Dual EMA 12/50 golden cross confirmation with ATR filter.',
        createdAt: Date.now() - 3600000 * 12,
      },
      {
        id: 'tr-3',
        symbol: 'ETH/USDT',
        side: 'SELL',
        orderType: 'MARKET',
        price: 3620,
        amount: 4.0,
        totalUsd: 14480,
        status: 'CLOSED',
        pnl: 320,
        strategyTag: 'Options Gamma',
        notes: 'Delta neutral hedge rebalance after local variance surge.',
        createdAt: Date.now() - 3600000 * 24,
      }
    ];
  });

  // Volatility Alerts
  const [alerts, setAlerts] = useState<VolatilityAlert[]>(() => {
    const saved = localStorage.getItem('quantedge_alerts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'al-1', symbol: 'BTC/USDT', type: 'VOLATILITY_SPIKE', threshold: 3.5, enabled: true, pushNotification: true, soundAlert: true, createdAt: Date.now() },
      { id: 'al-2', symbol: 'NVDA', type: 'PRICE_ABOVE', threshold: 135.0, enabled: true, pushNotification: true, soundAlert: false, createdAt: Date.now() },
      { id: 'al-3', symbol: 'SPY', type: 'DRAWDOWN_LIMIT', threshold: 2.0, enabled: true, pushNotification: true, soundAlert: true, createdAt: Date.now() },
    ];
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('quantedge_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('quantedge_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('quantedge_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Fetch real-time market tickers from backend API periodically
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const res = await fetch('/api/market/tickers');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
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
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } flex flex-col font-sans selection:bg-cyan-500/30`}>
      {/* Top Navigation Bar with Live Ticker Feed */}
      <Navbar
        user={user}
        tickers={tickers}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onOpenAuth={() => setIsAuthOpen(true)}
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
                  onExecuteTrade={handleAddTrade}
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
                onExecuteTrade={handleAddTrade}
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
  );
}

export default App;
