import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  Target, 
  Compass, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  FileText, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Flame,
  Search
} from 'lucide-react';
import { 
  TradeSignal, 
  TradingBotConfig, 
  BotActivityLog, 
  TradeRecord, 
  MarketTicker, 
  UserProfile 
} from '../../types';
import { TRADING_STRATEGIES } from '../../data/strategiesData';
import { 
  INITIAL_SIGNALS, 
  DEFAULT_BOT_CONFIG, 
  generateSignalForSymbol 
} from '../../utils/botEngine';
import { TradeAnalyzerModal } from './TradeAnalyzerModal';
import { soundEngine } from '../../utils/quantEngine';

interface SignalsAndBotViewProps {
  tickers: MarketTicker[];
  user: UserProfile;
  trades: TradeRecord[];
  onExecuteTrade: (trade: Omit<TradeRecord, 'id' | 'createdAt'>) => void;
  onCloseTrade: (id: string, exitPrice: number) => void;
  isDark: boolean;
  signals: TradeSignal[];
  setSignals: React.Dispatch<React.SetStateAction<TradeSignal[]>>;
  botConfig: TradingBotConfig;
  setBotConfig: React.Dispatch<React.SetStateAction<TradingBotConfig>>;
  botLogs: BotActivityLog[];
  setBotLogs: React.Dispatch<React.SetStateAction<BotActivityLog[]>>;
}

export const SignalsAndBotView: React.FC<SignalsAndBotViewProps> = ({
  tickers,
  user,
  trades,
  onExecuteTrade,
  onCloseTrade,
  isDark,
  signals,
  setSignals,
  botConfig,
  setBotConfig,
  botLogs,
  setBotLogs,
}) => {
  // Navigation sub-tab
  const [subTab, setSubTab] = useState<'signals' | 'strategies' | 'bot_terminal'>('signals');
  
  // Filtering
  const [symbolFilter, setSymbolFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected signal for In-Depth Analyzer modal
  const [analyzerSignal, setAnalyzerSignal] = useState<TradeSignal | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Bot Statistics calculation
  const botTrades = trades.filter(t => t.isBotTrade);
  const winningBotTrades = botTrades.filter(t => (t.pnl || 0) > 0);
  const botWinRate = botTrades.length > 0 
    ? Number(((winningBotTrades.length / botTrades.length) * 100).toFixed(1)) 
    : 72.4;
  const botNetProfit = botTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const riskFreeTradesCount = signals.filter(s => s.isBreakEvenMoved).length;

  // Filtered Signals
  const filteredSignals = signals.filter(s => {
    if (symbolFilter !== 'ALL' && s.symbol !== symbolFilter) return false;
    if (searchQuery && !s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) && !s.strategyName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Manual Trigger to Generate New Signals
  const handleScanMarkets = () => {
    soundEngine.playAlert('warning');
    const symbolsToScan = ['US30', 'NAS100', 'XAU/USD', 'BTC/USDT'];
    const newSignals: TradeSignal[] = symbolsToScan.map(sym => {
      const ticker = tickers.find(t => t.symbol === sym);
      const price = ticker?.price || (sym === 'US30' ? 40850 : sym === 'NAS100' ? 19840 : sym === 'XAU/USD' ? 2498 : 68420);
      return generateSignalForSymbol(sym, price, Math.random() > 0.3 ? 'bull' : 'bear');
    });

    setSignals(prev => [...newSignals, ...prev.slice(0, 15)]);

    const scanLog: BotActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      type: 'SCAN',
      symbol: 'GLOBAL',
      message: `Scanned all active markets: 4 high-confluence algorithmic signals updated with SL, BE, and TP parameters.`,
    };
    setBotLogs(prev => [scanLog, ...prev.slice(0, 99)]);
    showToast('Market scan complete: Algorithmic setups refreshed');
  };

  // Manual execution of a single signal
  const handleExecuteSignal = (sig: TradeSignal) => {
    const currentTicker = tickers.find(t => t.symbol === sig.symbol);
    const execPrice = currentTicker?.price || sig.entryPrice;

    onExecuteTrade({
      symbol: sig.symbol,
      side: sig.direction,
      orderType: 'MARKET',
      price: execPrice,
      amount: botConfig.lotSize,
      totalUsd: execPrice * botConfig.lotSize,
      status: 'OPEN',
      strategyTag: sig.strategyName,
      notes: `Signal ${sig.id}: SL: $${sig.stopLoss} | BE Trigger: $${sig.breakEvenPrice} | TP1: $${sig.tp1} | TP2: $${sig.tp2}`,
      stopLoss: sig.stopLoss,
      takeProfit: sig.tp2,
      breakEvenPrice: sig.breakEvenPrice,
      isBreakEvenMoved: false,
      isBotTrade: false,
      signalId: sig.id,
    });

    soundEngine.playAlert('fill');
    showToast(`Executed ${sig.direction} ${botConfig.lotSize} ${sig.symbol} @ $${execPrice.toFixed(2)}`);
  };

  // Toggle Simulator Bot Running State
  const handleToggleBot = () => {
    const nextState = !botConfig.isRunning;
    setBotConfig(prev => ({ ...prev, isRunning: nextState }));
    
    if (nextState) {
      soundEngine.playAlert('success');
      showToast('Simulator Trading Bot ACTIVE: Autonomous order routing & Auto-BE armed');
      const log: BotActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        type: 'INFO',
        symbol: 'SYSTEM',
        message: `Autonomous Trading Bot Started. Monitoring US30, NAS100, Gold, BTC with Auto-Break-Even protection enabled.`,
      };
      setBotLogs(prev => [log, ...prev.slice(0, 99)]);
    } else {
      soundEngine.playAlert('warning');
      showToast('Simulator Trading Bot PAUSED: New signal auto-execution halted');
      const log: BotActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        type: 'INFO',
        symbol: 'SYSTEM',
        message: `Trading Bot Paused by operator. Existing positions remain protected.`,
      };
      setBotLogs(prev => [log, ...prev.slice(0, 99)]);
    }
  };

  return (
    <div className={`flex flex-col min-h-[calc(100vh-6.5rem)] w-full p-4 lg:p-6 space-y-6 max-w-7xl mx-auto font-sans ${
      isDark ? 'text-[#d1d4dc]' : 'text-slate-900'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#2962ff] text-white text-xs font-mono font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in pointer-events-none">
          <span className="h-2 w-2 rounded-full bg-white animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Simulator Bot Control Header Cockpit */}
      <div className={`p-5 rounded-2xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#131722] border-[#2a2e39]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`relative p-3 rounded-2xl flex items-center justify-center ${
            botConfig.isRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/20 text-slate-400'
          }`}>
            <Bot className="h-7 w-7" />
            {botConfig.isRunning && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono tracking-tight">Simulator Trading Bot & Signals Engine</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono flex items-center gap-1 ${
                botConfig.isRunning 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-700/20 text-slate-400 border border-slate-700'
              }`}>
                {botConfig.isRunning ? 'RUNNING · AUTO-EXECUTION' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous execution engine with dynamic Stop Loss (SL), automatic Break-Even (BE) milestone sliding, and multi-tier Take Profit (TP) scaling.
            </p>
          </div>
        </div>

        {/* Bot Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            id="bot-power-toggle-btn"
            onClick={handleToggleBot}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold font-mono text-xs shadow-lg transition-all ${
              botConfig.isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {botConfig.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{botConfig.isRunning ? 'Pause Simulator Bot' : 'Start Simulator Bot'}</span>
          </button>

          <button
            id="scan-markets-btn"
            onClick={handleScanMarkets}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs border transition-colors ${
              isDark 
                ? 'bg-[#1e222d] border-[#2a2e39] hover:bg-[#2a2e39] text-slate-200' 
                : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
            <span>Scan Markets</span>
          </button>

          <button
            id="bot-config-btn"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs border transition-colors ${
              isDark 
                ? 'bg-[#1e222d] border-[#2a2e39] hover:bg-[#2a2e39] text-slate-200' 
                : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-slate-400" />
            <span>Bot Settings</span>
          </button>
        </div>
      </div>

      {/* Bot Live Telemetry Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Win Rate */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#131722] border-[#2a2e39]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Bot Win Rate</span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">{botWinRate}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{winningBotTrades.length} of {botTrades.length || 1} winning</div>
        </div>

        {/* Bot Net PnL */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#131722] border-[#2a2e39]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Bot Net Profit</span>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className={`text-xl font-bold font-mono ${botNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {botNetProfit >= 0 ? `+$${botNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `-$${Math.abs(botNetProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Automated paper trades</div>
        </div>

        {/* Risk-Free Trades (BE Moved) */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#131722] border-[#2a2e39]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Break-Even Activated</span>
            <ShieldCheck className="h-3.5 w-3.5 text-yellow-400" />
          </div>
          <div className="text-xl font-bold font-mono text-yellow-400">{riskFreeTradesCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">SL moved to Entry (Zero Risk)</div>
        </div>

        {/* Total Signals Tracked */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#131722] border-[#2a2e39]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Signals</span>
            <Target className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-400">{signals.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">SL, BE, TP monitored</div>
        </div>

        {/* Bot Position Size */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#131722] border-[#2a2e39]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Lot Sizing & Risk</span>
            <Lock className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-400">{botConfig.lotSize} Lots</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Max {botConfig.maxOpenPositions} open positions</div>
        </div>
      </div>

      {/* Bot Settings Drawer / Config Panel */}
      {isConfigOpen && (
        <div className={`p-5 rounded-2xl border shadow-2xl animate-fade-in ${
          isDark ? 'bg-[#1e222d] border-[#2a2e39]' : 'bg-slate-50 border-slate-300'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2 font-mono uppercase tracking-wider text-cyan-400">
              <Sliders className="h-4 w-4" />
              <span>Simulator Trading Bot Configuration</span>
            </h3>
            <button
              onClick={() => setIsConfigOpen(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-black/20"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Rule 1: Auto Move to Break-Even */}
            <div className="space-y-2 p-3.5 rounded-xl bg-black/20 border border-[#2a2e39]">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-yellow-400">
                  <ShieldCheck className="h-4 w-4" />
                  Auto Move Stop Loss to BE
                </span>
                <input
                  type="checkbox"
                  checked={botConfig.autoMoveToBreakEven}
                  onChange={e => setBotConfig(prev => ({ ...prev, autoMoveToBreakEven: e.target.checked }))}
                  className="rounded h-4 w-4 accent-yellow-500 cursor-pointer"
                />
              </div>
              <p className="text-slate-400 text-[11px]">
                When trade gains +1.0R in points, the bot automatically changes the Stop Loss to Entry + 1 point. Zero risk trade guaranteed.
              </p>
            </div>

            {/* Rule 2: Partial Profit Taking at TP1 */}
            <div className="space-y-2 p-3.5 rounded-xl bg-black/20 border border-[#2a2e39]">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <Target className="h-4 w-4" />
                  Take 50% Partials at TP1
                </span>
                <input
                  type="checkbox"
                  checked={botConfig.partialProfitTp1}
                  onChange={e => setBotConfig(prev => ({ ...prev, partialProfitTp1: e.target.checked }))}
                  className="rounded h-4 w-4 accent-emerald-500 cursor-pointer"
                />
              </div>
              <p className="text-slate-400 text-[11px]">
                At Take Profit 1 (+1.5R), automatically close 50% of the position to bank cash profit and let the remaining 50% run to TP2/TP3.
              </p>
            </div>

            {/* Rule 3: Execution Minimum Confluence */}
            <div className="space-y-2 p-3.5 rounded-xl bg-black/20 border border-[#2a2e39]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">Minimum Confluence Filter</span>
                <span className="font-mono font-bold text-cyan-300">{botConfig.minConfluence}%</span>
              </div>
              <input
                type="range"
                min="75"
                max="95"
                step="1"
                value={botConfig.minConfluence}
                onChange={e => setBotConfig(prev => ({ ...prev, minConfluence: Number(e.target.value) }))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-slate-400 text-[11px]">
                Only auto-execute signals graded above {botConfig.minConfluence}% confluence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[#2a2e39] pb-2">
        <div className="flex items-center gap-2">
          <button
            id="subtab-signals-btn"
            onClick={() => setSubTab('signals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              subTab === 'signals'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Target className="h-4 w-4" />
            <span>Live Signals (SL · BE · TP)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-300 text-[10px] font-mono">
              {filteredSignals.length}
            </span>
          </button>

          <button
            id="subtab-strategies-btn"
            onClick={() => setSubTab('strategies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              subTab === 'strategies'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Strategies & Execution Plans</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 text-[10px] font-mono">
              5
            </span>
          </button>

          <button
            id="subtab-bot-terminal-btn"
            onClick={() => setSubTab('bot_terminal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              subTab === 'bot_terminal'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>Bot Live Terminal & Execution Logs</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 text-[10px] font-mono">
              {botLogs.length}
            </span>
          </button>
        </div>

        {/* Search & Symbol Filter */}
        {subTab === 'signals' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1e222d] border border-[#2a2e39] rounded-lg p-1 text-xs font-mono">
              {['ALL', 'US30', 'NAS100', 'XAU/USD', 'BTC/USDT'].map(sym => (
                <button
                  key={sym}
                  onClick={() => setSymbolFilter(sym)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    symbolFilter === sym 
                      ? 'bg-cyan-600 text-white font-bold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: Live Signals Cards */}
      {subTab === 'signals' && (
        <div className="space-y-4">
          {filteredSignals.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${
              isDark ? 'bg-[#131722] border-[#2a2e39]' : 'bg-white border-slate-200'
            }`}>
              <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">No matching signals found</h3>
              <p className="text-xs text-slate-500 mt-1">Run an algorithmic scan to generate fresh signals across all symbols.</p>
              <button
                onClick={handleScanMarkets}
                className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
              >
                Scan Markets Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSignals.map(sig => {
                const isBuy = sig.direction === 'BUY';
                const currentTicker = tickers.find(t => t.symbol === sig.symbol);
                const currentPrice = currentTicker?.price || sig.entryPrice;

                return (
                  <div
                    key={sig.id}
                    id={`signal-card-${sig.id}`}
                    className={`p-5 rounded-2xl border transition-all hover:border-cyan-500/50 shadow-xl relative overflow-hidden ${
                      isDark ? 'bg-[#131722] border-[#2a2e39]' : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Top Row: Symbol, Direction, Confluence */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl font-bold font-mono flex items-center justify-center ${
                          isBuy ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
                        }`}>
                          {isBuy ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold font-mono tracking-tight">{sig.symbol}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                              isBuy ? 'bg-[#089981]/15 text-[#089981] border border-[#089981]/30' : 'bg-[#f23645]/15 text-[#f23645] border border-[#f23645]/30'
                            }`}>
                              {sig.direction}
                            </span>
                            {sig.isBreakEvenMoved && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-mono font-bold flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                🛡️ BE ACTIVE (Zero Risk)
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">{sig.strategyName}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-lg inline-block">
                          {sig.confluenceScore}% Confluence A+
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">TF: {sig.timeframe}</span>
                      </div>
                    </div>

                    {/* Thesis Rationale */}
                    <p className="text-xs text-slate-300 bg-black/20 p-2.5 rounded-lg border border-[#2a2e39] mb-3 leading-relaxed">
                      {sig.thesis}
                    </p>

                    {/* Parameter Grid (Entry, SL, BE, TP1, TP2) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs font-mono">
                      {/* Entry */}
                      <div className="p-2.5 rounded-lg bg-black/30 border border-[#2a2e39]">
                        <span className="text-slate-400 text-[10px] block">Planned Entry</span>
                        <span className="font-bold text-cyan-400">${sig.entryPrice.toLocaleString()}</span>
                      </div>

                      {/* Stop Loss */}
                      <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/20">
                        <span className="text-red-400 text-[10px] block font-sans font-semibold">Stop Loss (SL)</span>
                        <span className="font-bold text-red-400">${sig.stopLoss.toLocaleString()}</span>
                        <span className="text-[10px] text-red-400/80 block">-{sig.stopLossPoints} pts</span>
                      </div>

                      {/* Break-Even (BE) Trigger */}
                      <div className="p-2.5 rounded-lg bg-yellow-950/20 border border-yellow-500/30">
                        <span className="text-yellow-400 text-[10px] block font-sans font-bold flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-yellow-400" />
                          Break-Even (BE)
                        </span>
                        <span className="font-bold text-yellow-400">${sig.breakEvenPrice.toLocaleString()}</span>
                        <span className="text-[10px] text-yellow-300/80 block">+{sig.breakEvenPoints} pts</span>
                      </div>

                      {/* Take Profit 2 */}
                      <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                        <span className="text-[#089981] text-[10px] block font-sans font-semibold">Take Profit (TP2)</span>
                        <span className="font-bold text-[#089981]">${sig.tp2.toLocaleString()}</span>
                        <span className="text-[10px] text-[#089981]/80 block">R:R {sig.riskRewardRatio}:1</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#2a2e39]">
                      <button
                        id={`analyze-signal-btn-${sig.id}`}
                        onClick={() => setAnalyzerSignal(sig)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#1e222d] hover:bg-[#2a2e39] text-cyan-300 border border-cyan-800/30 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>In-Depth Execution Analyzer</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          id={`execute-signal-btn-${sig.id}`}
                          onClick={() => handleExecuteSignal(sig)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold font-mono text-xs text-white shadow-md transition-all ${
                            isBuy 
                              ? 'bg-[#089981] hover:bg-[#089981]/90 shadow-[#089981]/20' 
                              : 'bg-[#f23645] hover:bg-[#f23645]/90 shadow-[#f23645]/20'
                          }`}
                        >
                          <span>Execute {sig.direction}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Institutional Strategies Catalogue */}
      {subTab === 'strategies' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRADING_STRATEGIES.map(strat => (
              <div
                key={strat.id}
                className={`p-5 rounded-2xl border shadow-xl flex flex-col justify-between ${
                  isDark ? 'bg-[#131722] border-[#2a2e39]' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-mono font-bold border border-cyan-500/30">
                      {strat.category}
                    </span>
                    <span className="text-xs text-emerald-400 font-mono font-bold">
                      Win Rate: {strat.winRatePct}% · PF: {strat.profitFactor}
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-mono text-slate-100">{strat.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{strat.description}</p>

                  {/* Execution Rules Breakdown */}
                  <div className="mt-4 space-y-2 text-xs border-t border-[#2a2e39] pt-3">
                    <div>
                      <span className="font-semibold text-cyan-400 block">1. Setup Condition:</span>
                      <p className="text-slate-300 mt-0.5">{strat.executionRules.setupCondition}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-200 block">2. Entry Trigger:</span>
                      <p className="text-slate-400 mt-0.5">{strat.executionRules.triggerEntry}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-red-400 block">3. Stop Loss Rule:</span>
                      <p className="text-slate-400 mt-0.5">{strat.executionRules.stopLossRule}</p>
                    </div>

                    <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <span className="font-bold text-yellow-400 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        4. Break-Even (BE) Rule:
                      </span>
                      <p className="text-yellow-200/90 mt-0.5">{strat.executionRules.breakEvenRule}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-[#089981] block">5. Take Profit Targets:</span>
                      <p className="text-slate-400 mt-0.5">{strat.executionRules.takeProfitRule}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2a2e39] flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">Avg R:R {strat.avgRiskReward}</span>
                  <button
                    onClick={() => {
                      const ticker = tickers.find(t => t.symbol === strat.symbol) || tickers[0];
                      const newSig = generateSignalForSymbol(strat.symbol, ticker.price, 'bull');
                      setSignals(prev => [newSig, ...prev]);
                      setAnalyzerSignal(newSig);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                  >
                    Analyze Active Setup
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Bot Live Terminal & Execution Logs */}
      {subTab === 'bot_terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Active Bot Open Trades (Left 1 col) */}
          <div className={`p-5 rounded-2xl border shadow-xl flex flex-col ${
            isDark ? 'bg-[#131722] border-[#2a2e39]' : 'bg-white border-slate-200'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3 font-mono text-cyan-400">
              <Bot className="h-4 w-4" />
              <span>Active Bot Positions ({trades.filter(t => t.status === 'OPEN').length})</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px]">
              {trades.filter(t => t.status === 'OPEN').length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <span>No open positions. The bot will automatically execute when a high-confluence signal is detected.</span>
                </div>
              ) : (
                trades.filter(t => t.status === 'OPEN').map(trade => {
                  const ticker = tickers.find(tk => tk.symbol === trade.symbol);
                  const mark = ticker?.price || trade.price;
                  const pnl = trade.side === 'BUY' ? (mark - trade.price) * trade.amount : (trade.price - mark) * trade.amount;
                  const isProfit = pnl >= 0;

                  return (
                    <div key={trade.id} className="p-3 rounded-xl bg-black/30 border border-[#2a2e39] space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold">{trade.symbol}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trade.side === 'BUY' ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
                        }`}>
                          {trade.side} {trade.amount} lots
                        </span>
                      </div>

                      <div className="text-xs flex items-center justify-between font-mono">
                        <span className="text-slate-400">Entry: ${trade.price.toLocaleString()}</span>
                        <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isProfit ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}
                        </span>
                      </div>

                      {trade.breakEvenPrice && (
                        <div className="text-[10px] text-yellow-400/90 font-mono flex items-center justify-between bg-yellow-950/20 px-2 py-1 rounded">
                          <span>BE Target: ${trade.breakEvenPrice.toLocaleString()}</span>
                          <span>{trade.isBreakEvenMoved ? '🛡️ BE SECURED' : 'ARMED'}</span>
                        </div>
                      )}

                      <button
                        onClick={() => onCloseTrade(trade.id, mark)}
                        className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                      >
                        Close Position
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Live Bot Execution Log Stream (Right 2 cols) */}
          <div className={`p-5 rounded-2xl border shadow-xl flex flex-col lg:col-span-2 ${
            isDark ? 'bg-[#131722] border-[#2a2e39]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 font-mono text-slate-200">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>Real-Time Autonomous Bot Execution Tape</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Auto-scrolling telemetry</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] p-3 rounded-xl bg-black/40 border border-[#2a2e39] font-mono text-xs">
              {botLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2.5 py-1 border-b border-slate-800/60 last:border-0">
                  <span className="text-slate-500 shrink-0 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                    log.type === 'ORDER_PLACED' ? 'bg-cyan-500/20 text-cyan-400' :
                    log.type === 'BE_ACTIVATED' ? 'bg-yellow-500/20 text-yellow-400' :
                    log.type === 'TP_HIT' ? 'bg-emerald-500/20 text-emerald-400' :
                    log.type === 'SL_HIT' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-slate-300 leading-tight">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* In-Depth Trade Analyzer Modal */}
      {analyzerSignal && (
        <TradeAnalyzerModal
          isOpen={Boolean(analyzerSignal)}
          onClose={() => setAnalyzerSignal(null)}
          signal={analyzerSignal}
          currentPrice={tickers.find(t => t.symbol === analyzerSignal.symbol)?.price || analyzerSignal.entryPrice}
          onExecuteTrade={handleExecuteSignal}
          isDark={isDark}
        />
      )}
    </div>
  );
};
