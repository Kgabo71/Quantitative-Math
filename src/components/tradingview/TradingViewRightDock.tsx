import React, { useState } from 'react';
import { 
  List, 
  Bell, 
  Calendar, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldAlert, 
  DollarSign, 
  CheckCircle2, 
  X,
  ChevronRight,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { 
  MarketTicker, 
  OrderBook, 
  TradeRecord, 
  VolatilityAlert, 
  UserProfile,
  TradeSignal,
  TradingBotConfig
} from '../../types';
import { Bot, ShieldCheck, Target, FileText } from 'lucide-react';

export type RightDockTab = 'watchlist' | 'signals' | 'dom' | 'order_ticket' | 'calendar' | 'alerts';

interface TradingViewRightDockProps {
  currentTicker: MarketTicker;
  tickers: MarketTicker[];
  onSelectSymbol: (symbol: string) => void;
  orderBook: OrderBook;
  user: UserProfile;
  alerts: VolatilityAlert[];
  onExecuteTrade: (trade: Omit<TradeRecord, 'id' | 'createdAt'>) => void;
  signals?: TradeSignal[];
  onOpenAnalyzer?: (sig: TradeSignal) => void;
  botConfig?: TradingBotConfig;
  onToggleBot?: () => void;
}

export const TradingViewRightDock: React.FC<TradingViewRightDockProps> = ({
  currentTicker,
  tickers,
  onSelectSymbol,
  orderBook,
  user,
  alerts,
  onExecuteTrade,
  signals = [],
  onOpenAnalyzer = () => {},
  botConfig,
  onToggleBot = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<RightDockTab | null>('watchlist');

  // Order Ticket Form State
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_MARKET'>('MARKET');
  const [lots, setLots] = useState<number>(1.0);
  const [limitPrice, setLimitPrice] = useState<number>(() => currentTicker.price);
  const [slPoints, setSlPoints] = useState<number>(50);
  const [tpPoints, setTpPoints] = useState<number>(120);
  const [strategyTag, setStrategyTag] = useState<string>('Opening Range Breakout (ORB)');

  const tickSize = currentTicker.type === 'commodity' ? 0.1 : 1.0;
  const currentPrice = currentTicker.price;
  const calculatedSlPrice = orderSide === 'BUY' ? currentPrice - slPoints * tickSize : currentPrice + slPoints * tickSize;
  const calculatedTpPrice = orderSide === 'BUY' ? currentPrice + tpPoints * tickSize : currentPrice - tpPoints * tickSize;
  const riskReward = (tpPoints / slPoints).toFixed(2);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const tradePrice = orderType === 'LIMIT' ? limitPrice : currentPrice;
    const notionalUsd = lots * tradePrice;

    onExecuteTrade({
      symbol: currentTicker.symbol,
      side: orderSide,
      orderType,
      price: tradePrice,
      amount: lots,
      totalUsd: notionalUsd,
      status: 'OPEN',
      strategyTag,
      notes: `TradingView Order Ticket | SL: $${calculatedSlPrice.toFixed(2)} | TP: $${calculatedTpPrice.toFixed(2)} | R:R ${riskReward}`,
    });
  };

  const navButtons: { id: RightDockTab; icon: React.ElementType; label: string }[] = [
    { id: 'watchlist', icon: List, label: 'Watchlist & Quotes' },
    { id: 'signals', icon: Bot, label: 'Signals & Bot (SL·BE·TP)' },
    { id: 'order_ticket', icon: Zap, label: 'Trading Order Ticket' },
    { id: 'dom', icon: Activity, label: 'Depth of Market (DOM)' },
    { id: 'calendar', icon: Calendar, label: 'Economic Calendar' },
    { id: 'alerts', icon: Bell, label: 'Active Alerts' },
  ];

  return (
    <div className="flex h-full select-none z-20 shrink-0">
      {/* Expanded Dock Panel (when activeTab is not null) */}
      {activeTab && (
        <div className="w-80 bg-[#1e222d] border-l border-[#2a2e39] flex flex-col h-full overflow-hidden">
          {/* Dock Header */}
          <div className="h-10 border-b border-[#2a2e39] px-3 flex items-center justify-between text-xs text-[#d1d4dc] font-bold">
            <span className="capitalize">{activeTab.replace('_', ' ')}</span>
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="p-1 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Dock Content */}
          <div className="flex-1 overflow-y-auto p-3 text-xs">
            {/* 1. WATCHLIST TAB */}
            {activeTab === 'watchlist' && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#787b86]">
                  Primary Watchlist
                </div>

                <div className="space-y-1">
                  {tickers.map((t) => {
                    const isSelected = t.symbol === currentTicker.symbol;
                    const isUp = t.change24h >= 0;
                    return (
                      <button
                        key={t.symbol}
                        type="button"
                        id={`tv-watchlist-${t.symbol}`}
                        onClick={() => onSelectSymbol(t.symbol)}
                        className={`w-full flex items-center justify-between p-2 rounded transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#2962ff]/20 text-[#2962ff]' : 'hover:bg-[#2a2e39] text-[#d1d4dc]'
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-mono font-bold text-xs">{t.symbol}</div>
                          <div className="text-[10px] text-[#787b86]">
                            {t.symbol === 'US30' ? 'Dow Jones 30' : t.symbol === 'NAS100' ? 'Nasdaq 100' : t.symbol === 'XAU/USD' ? 'Gold Spot' : t.type}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-xs font-bold">${t.price.toLocaleString()}</div>
                          <div className={`text-[10px] font-mono font-semibold ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                            {isUp ? '+' : ''}{t.change24h}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Key Statistics of Active Asset */}
                <div className="pt-3 border-t border-[#2a2e39] space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#787b86]">
                    {currentTicker.symbol} Key Metrics
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-[#2a2e39]/50">
                      <span className="text-[#787b86]">Bid / Ask</span>
                      <span className="text-[#d1d4dc]">{orderBook.bids[0]?.price.toFixed(1)} / {orderBook.asks[0]?.price.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#2a2e39]/50">
                      <span className="text-[#787b86]">Spread</span>
                      <span className="text-[#d1d4dc]">{orderBook.spread.toFixed(2)} pts</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#2a2e39]/50">
                      <span className="text-[#787b86]">1m Volatility</span>
                      <span className="text-amber-400">{currentTicker.volatility1m}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#2a2e39]/50">
                      <span className="text-[#787b86]">OFI Imbalance</span>
                      <span className={orderBook.imbalance >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}>
                        {orderBook.imbalance >= 0 ? '+' : ''}{(orderBook.imbalance * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Day Range Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] text-[#787b86] mb-1">
                      <span>Day Low: ${(currentPrice * 0.994).toFixed(1)}</span>
                      <span>Day High: ${(currentPrice * 1.006).toFixed(1)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#131722] rounded-full overflow-hidden relative">
                      <div className="absolute left-[20%] right-[25%] h-full bg-[#2962ff] rounded-full" />
                      <div className="absolute left-[62%] top-0 bottom-0 w-2 bg-white rounded-full shadow" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIGNALS & SIMULATOR BOT TAB */}
            {activeTab === 'signals' && (
              <div className="space-y-3">
                {/* Bot Quick Toggle Header */}
                <div className="p-2.5 rounded-lg bg-[#131722] border border-[#2a2e39] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className={`h-4 w-4 ${botConfig?.isRunning ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <div>
                      <span className="font-bold text-xs block text-[#d1d4dc]">Trading Bot</span>
                      <span className="text-[10px] text-[#787b86]">
                        {botConfig?.isRunning ? 'Autonomous Running' : 'Standby'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onToggleBot}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono transition-colors ${
                      botConfig?.isRunning
                        ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30 hover:bg-amber-600/40'
                        : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/40'
                    }`}
                  >
                    {botConfig?.isRunning ? 'Pause' : 'Start'}
                  </button>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-[#787b86]">
                  Active Signals ({signals.filter(s => s.symbol === currentTicker.symbol).length || signals.length})
                </div>

                <div className="space-y-2.5">
                  {(signals.filter(s => s.symbol === currentTicker.symbol).length > 0 
                    ? signals.filter(s => s.symbol === currentTicker.symbol) 
                    : signals
                  ).map((sig) => {
                    const isBuy = sig.direction === 'BUY';
                    return (
                      <div 
                        key={sig.id}
                        className="p-3 rounded-lg bg-[#131722] border border-[#2a2e39] space-y-2 hover:border-[#2962ff]/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-white">{sig.symbol}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isBuy ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
                            }`}>
                              {sig.direction}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                            {sig.confluenceScore}% Conf.
                          </span>
                        </div>

                        <div className="text-[11px] text-[#787b86] line-clamp-1">{sig.strategyName}</div>

                        {/* Parameter Grid */}
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-black/20 p-2 rounded border border-[#2a2e39]/50">
                          <div>
                            <span className="text-[#787b86] block">Entry:</span>
                            <span className="text-cyan-400 font-bold">${sig.entryPrice.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-red-400 block">Stop Loss:</span>
                            <span className="text-red-400 font-bold">${sig.stopLoss.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-yellow-400 block flex items-center gap-0.5">
                              <ShieldCheck className="h-2.5 w-2.5" /> BE Trigger:
                            </span>
                            <span className="text-yellow-400 font-bold">${sig.breakEvenPrice.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[#089981] block">Take Profit:</span>
                            <span className="text-[#089981] font-bold">${sig.tp2.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => onOpenAnalyzer(sig)}
                            className="flex-1 py-1.5 rounded bg-[#1e222d] hover:bg-[#2a2e39] text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1 border border-cyan-800/30"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Analyze</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onExecuteTrade({
                                symbol: sig.symbol,
                                side: sig.direction,
                                orderType: 'MARKET',
                                price: currentTicker.price,
                                amount: 1.0,
                                totalUsd: currentTicker.price * 1.0,
                                status: 'OPEN',
                                strategyTag: sig.strategyName,
                                notes: `Signal ${sig.id} | SL: $${sig.stopLoss} | BE: $${sig.breakEvenPrice} | TP: $${sig.tp2}`,
                                stopLoss: sig.stopLoss,
                                takeProfit: sig.tp2,
                                breakEvenPrice: sig.breakEvenPrice,
                                isBreakEvenMoved: false,
                                isBotTrade: false,
                                signalId: sig.id,
                              });
                            }}
                            className={`px-3 py-1.5 rounded text-[11px] font-bold font-mono text-white ${
                              isBuy ? 'bg-[#089981] hover:bg-[#089981]/90' : 'bg-[#f23645] hover:bg-[#f23645]/90'
                            }`}
                          >
                            Execute
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. ORDER TICKET TAB */}
            {activeTab === 'order_ticket' && (
              <form onSubmit={handlePlaceOrder} className="space-y-3">
                {/* Buy / Sell Tabs */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#131722] rounded-lg border border-[#2a2e39]">
                  <button
                    type="button"
                    onClick={() => setOrderSide('BUY')}
                    className={`py-2 rounded text-xs font-bold transition-all cursor-pointer ${
                      orderSide === 'BUY'
                        ? 'bg-[#2962ff] text-white shadow-md'
                        : 'text-[#787b86] hover:text-[#d1d4dc]'
                    }`}
                  >
                    BUY / LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderSide('SELL')}
                    className={`py-2 rounded text-xs font-bold transition-all cursor-pointer ${
                      orderSide === 'SELL'
                        ? 'bg-[#f23645] text-white shadow-md'
                        : 'text-[#787b86] hover:text-[#d1d4dc]'
                    }`}
                  >
                    SELL / SHORT
                  </button>
                </div>

                {/* Order Type */}
                <div className="flex items-center gap-1 bg-[#131722] p-1 rounded border border-[#2a2e39] text-[11px]">
                  {(['MARKET', 'LIMIT', 'STOP_MARKET'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOrderType(t)}
                      className={`flex-1 py-1 rounded font-semibold transition-colors ${
                        orderType === t ? 'bg-[#2a2e39] text-[#d1d4dc]' : 'text-[#787b86] hover:text-[#d1d4dc]'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Lots / Quantity */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#787b86] block mb-1">
                    Contracts / Lots
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={lots}
                      onChange={(e) => setLots(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                      className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 font-mono text-xs text-[#d1d4dc] focus:outline-none focus:border-[#2962ff]"
                    />
                    <div className="flex gap-1">
                      {[0.5, 1.0, 2.0, 5.0].map((quickLot) => (
                        <button
                          key={quickLot}
                          type="button"
                          onClick={() => setLots(quickLot)}
                          className="px-2 py-1 rounded bg-[#131722] border border-[#2a2e39] text-[10px] text-[#787b86] hover:text-[#d1d4dc]"
                        >
                          {quickLot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Limit Price if selected */}
                {orderType === 'LIMIT' && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#787b86] block mb-1">
                      Limit Price ($)
                    </label>
                    <input
                      type="number"
                      step={tickSize}
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(parseFloat(e.target.value) || currentPrice)}
                      className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 font-mono text-xs text-[#d1d4dc] focus:outline-none focus:border-[#2962ff]"
                    />
                  </div>
                )}

                {/* Take Profit & Stop Loss */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2a2e39]">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#089981] block mb-1">
                      Take Profit (Pts)
                    </label>
                    <input
                      type="number"
                      value={tpPoints}
                      onChange={(e) => setTpPoints(Math.max(5, parseInt(e.target.value) || 5))}
                      className="w-full bg-[#131722] border border-[#089981]/40 rounded px-2.5 py-1.5 font-mono text-xs text-[#089981] focus:outline-none"
                    />
                    <div className="text-[9px] text-[#787b86] mt-0.5 font-mono">
                      TP: ${calculatedTpPrice.toFixed(1)}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#f23645] block mb-1">
                      Stop Loss (Pts)
                    </label>
                    <input
                      type="number"
                      value={slPoints}
                      onChange={(e) => setSlPoints(Math.max(5, parseInt(e.target.value) || 5))}
                      className="w-full bg-[#131722] border border-[#f23645]/40 rounded px-2.5 py-1.5 font-mono text-xs text-[#f23645] focus:outline-none"
                    />
                    <div className="text-[9px] text-[#787b86] mt-0.5 font-mono">
                      SL: ${calculatedSlPrice.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Risk / Reward & Margin */}
                <div className="p-2.5 rounded bg-[#131722] border border-[#2a2e39] space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#787b86]">Risk/Reward:</span>
                    <span className="text-[#2962ff] font-bold">{riskReward} R:R</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#787b86]">Notional Exposure:</span>
                    <span className="text-[#d1d4dc]">${(lots * currentPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#787b86]">Paper Balance:</span>
                    <span className="text-emerald-400 font-bold">${user.balanceUsd.toLocaleString()}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="tv-execute-order-btn"
                  className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-transform active:scale-[0.98] cursor-pointer ${
                    orderSide === 'BUY'
                      ? 'bg-[#2962ff] hover:bg-[#2962ff]/90 shadow-[#2962ff]/20'
                      : 'bg-[#f23645] hover:bg-[#f23645]/90 shadow-[#f23645]/20'
                  }`}
                >
                  Execute {orderSide} {lots} {currentTicker.symbol}
                </button>
              </form>
            )}

            {/* 3. DOM (DEPTH OF MARKET) TAB */}
            {activeTab === 'dom' && (
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between text-[10px] text-[#787b86]">
                  <span>Bid Size</span>
                  <span>Price</span>
                  <span>Ask Size</span>
                </div>

                {/* Asks (Sells) */}
                <div className="space-y-1">
                  {orderBook.asks.slice(0, 5).reverse().map((ask, idx) => {
                    const pct = Math.min(100, (ask.amount / 20) * 100);
                    return (
                      <div key={`dom-ask-${idx}`} className="relative flex items-center justify-between py-1 px-1.5 text-xs text-[#f23645]">
                        <div 
                          className="absolute right-0 top-0 bottom-0 bg-[#f23645]/15 pointer-events-none rounded"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="opacity-0">--</span>
                        <span className="font-bold relative z-10">{ask.price.toFixed(1)}</span>
                        <span className="text-[#d1d4dc] relative z-10">{ask.amount.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Spread Divider */}
                <div className="py-1 px-2 bg-[#131722] border-y border-[#2a2e39] flex items-center justify-between text-[11px] text-[#787b86]">
                  <span>Spread</span>
                  <span className="text-[#2962ff] font-bold">{orderBook.spread.toFixed(1)} pts</span>
                </div>

                {/* Bids (Buys) */}
                <div className="space-y-1">
                  {orderBook.bids.slice(0, 5).map((bid, idx) => {
                    const pct = Math.min(100, (bid.amount / 20) * 100);
                    return (
                      <div key={`dom-bid-${idx}`} className="relative flex items-center justify-between py-1 px-1.5 text-xs text-[#089981]">
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-[#089981]/15 pointer-events-none rounded"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="text-[#d1d4dc] relative z-10">{bid.amount.toFixed(2)}</span>
                        <span className="font-bold relative z-10">{bid.price.toFixed(1)}</span>
                        <span className="opacity-0">--</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. ECONOMIC CALENDAR TAB */}
            {activeTab === 'calendar' && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#787b86]">
                  High-Impact US Catalysts
                </div>

                <div className="space-y-2">
                  {[
                    { event: 'US Core CPI Inflation (MoM)', time: '08:30 AM', impact: 'HIGH', forecast: '0.3%', previous: '0.3%' },
                    { event: 'FOMC Fed Funds Rate Decision', time: '02:00 PM', impact: 'CRITICAL', forecast: '5.25%', previous: '5.50%' },
                    { event: 'Non-Farm Payrolls (NFP)', time: '08:30 AM', impact: 'HIGH', forecast: '165K', previous: '142K' },
                    { event: 'ISM Manufacturing PMI', time: '10:00 AM', impact: 'MED', forecast: '49.2', previous: '47.9' },
                  ].map((ev, i) => (
                    <div key={i} className="p-2.5 rounded bg-[#131722] border border-[#2a2e39] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          ev.impact === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {ev.impact}
                        </span>
                        <span className="text-[10px] text-[#787b86] font-mono">{ev.time}</span>
                      </div>
                      <div className="text-xs font-semibold text-[#d1d4dc]">{ev.event}</div>
                      <div className="flex gap-4 text-[10px] text-[#787b86] font-mono">
                        <span>Forecast: {ev.forecast}</span>
                        <span>Prior: {ev.previous}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. ALERTS TAB */}
            {activeTab === 'alerts' && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#787b86]">
                  Active Volatility Rules
                </div>

                <div className="space-y-2">
                  {alerts.map((al) => (
                    <div key={al.id} className="p-2 rounded bg-[#131722] border border-[#2a2e39] flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-xs text-[#d1d4dc]">{al.symbol}</div>
                        <div className="text-[10px] text-[#787b86]">{al.type} &gt; {al.threshold}</div>
                      </div>
                      <span className={`h-2 w-2 rounded-full ${al.enabled ? 'bg-[#089981]' : 'bg-slate-600'}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Vertical Tool Rail (Always visible TradingView icon bar) */}
      <div className="w-11 bg-[#131722] border-l border-[#2a2e39] flex flex-col items-center py-2 gap-1 z-30">
        {navButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeTab === btn.id;
          return (
            <div key={btn.id} className="relative group w-full flex justify-center">
              <button
                type="button"
                id={`tv-dock-btn-${btn.id}`}
                onClick={() => setActiveTab(activeTab === btn.id ? null : btn.id)}
                className={`h-8 w-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#2962ff] text-white shadow-sm'
                    : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
              {/* Tooltip */}
              <div className="absolute right-11 top-1/2 -translate-y-1/2 hidden group-hover:flex bg-[#1e222d] text-[#d1d4dc] border border-[#2a2e39] text-[11px] font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
                {btn.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
