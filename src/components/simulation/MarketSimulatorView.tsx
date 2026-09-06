import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  FastForward, 
  Zap, 
  Flame, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sliders, 
  BarChart2, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { 
  Candle, 
  MarketTicker, 
  OrderBook, 
  OrderBookLevel, 
  MarketTrade, 
  UserProfile, 
  TradeRecord 
} from '../../types';
import { generateCandles, soundEngine } from '../../utils/quantEngine';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';

interface MarketSimulatorViewProps {
  tickers: MarketTicker[];
  user: UserProfile;
  onExecuteTrade: (trade: Omit<TradeRecord, 'id' | 'createdAt'>) => void;
  isDark: boolean;
}

export const MarketSimulatorView: React.FC<MarketSimulatorViewProps> = ({
  tickers,
  user,
  onExecuteTrade,
  isDark,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USDT');
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(68420, 60, 0.40, 0.05));
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x, 5x, 20x
  const [activeRegime, setActiveRegime] = useState<'normal' | 'bull' | 'flash_crash' | 'range' | 'high_vol'>('normal');
  const [tradesTape, setTradesTape] = useState<MarketTrade[]>([]);
  const [quickAmountUsd, setQuickAmountUsd] = useState<number>(1000);
  const [showIndicators, setShowIndicators] = useState<{ bb: boolean; sma: boolean; ema: boolean; rsi: boolean }>({
    bb: true,
    sma: true,
    ema: false,
    rsi: true,
  });

  const selectedTicker = tickers.find(t => t.symbol === selectedSymbol) || tickers[0] || {
    symbol: 'BTC/USDT',
    price: 68420,
    bid: 68418,
    ask: 68422,
    spread: 4.0,
    change24h: 3.4,
    volume: 1400000,
    volatility1m: 1.8,
    type: 'crypto',
    timestamp: Date.now()
  };

  // Re-generate candles when asset symbol changes
  useEffect(() => {
    setCandles(generateCandles(selectedTicker.price, 60, selectedTicker.type === 'crypto' ? 0.5 : 0.25, 0.05));
  }, [selectedSymbol]);

  // Level 2 Order Book generation based on selected ticker price and regime
  const orderBook: OrderBook = useMemo(() => {
    const mid = selectedTicker.price;
    const tickSize = selectedTicker.type === 'fx' ? 0.0001 : (selectedTicker.price > 1000 ? 0.5 : 0.01);
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    let cumBidTotal = 0;
    let cumAskTotal = 0;

    // Imbalance bias from active regime
    const imbalanceBias = activeRegime === 'bull' ? 0.4 : (activeRegime === 'flash_crash' ? -0.5 : 0);

    for (let i = 1; i <= 10; i++) {
      const bidPrice = Number((mid - i * tickSize * (1 + (i * 0.1))).toFixed(selectedTicker.type === 'fx' ? 4 : 2));
      const askPrice = Number((mid + i * tickSize * (1 + (i * 0.1))).toFixed(selectedTicker.type === 'fx' ? 4 : 2));

      const bidAmt = Number(((1.5 + Math.random() * 3.5 + imbalanceBias * 2) * (1 + i * 0.2)).toFixed(3));
      const askAmt = Number(((1.5 + Math.random() * 3.5 - imbalanceBias * 2) * (1 + i * 0.2)).toFixed(3));

      cumBidTotal += bidAmt;
      cumAskTotal += askAmt;

      bids.push({ price: bidPrice, amount: bidAmt, total: Number(cumBidTotal.toFixed(3)) });
      asks.push({ price: askPrice, amount: askAmt, total: Number(cumAskTotal.toFixed(3)) });
    }

    const totalBidVol = bids.reduce((a, b) => a + b.amount, 0);
    const totalAskVol = asks.reduce((a, b) => a + b.amount, 0);
    const imbalance = (totalBidVol - totalAskVol) / (totalBidVol + totalAskVol);

    return {
      bids,
      asks: asks.reverse(),
      spread: Number((asks[asks.length - 1].price - bids[0].price).toFixed(selectedTicker.type === 'fx' ? 4 : 2)),
      midPrice: mid,
      imbalance: Number(imbalance.toFixed(2)),
    };
  }, [selectedTicker, activeRegime]);

  // Live High-Frequency Simulation Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(100, Math.floor(1000 / simulationSpeed));
    const timer = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        
        // Regime modifier
        let drift = 0;
        let volMult = 1.0;
        if (activeRegime === 'bull') drift = 0.0015;
        else if (activeRegime === 'flash_crash') drift = -0.0035;
        else if (activeRegime === 'high_vol') volMult = 2.5;

        const noise = (Math.random() - 0.495 + drift) * (0.0015 * volMult);
        const newClose = Number((last.close * (1 + noise)).toFixed(2));
        const newHigh = Number(Math.max(last.high, newClose).toFixed(2));
        const newLow = Number(Math.min(last.low, newClose).toFixed(2));
        const newVol = last.volume + Math.floor(Math.random() * 5000);

        // Append high-frequency trade tape item
        const side: 'buy' | 'sell' = noise >= 0 ? 'buy' : 'sell';
        const tradeItem: MarketTrade = {
          id: `t-${Date.now()}-${Math.random()}`,
          symbol: selectedSymbol,
          price: newClose,
          amount: Number((Math.random() * 1.5 + 0.05).toFixed(3)),
          side,
          timestamp: Date.now()
        };

        setTradesTape(tPrev => [tradeItem, ...tPrev.slice(0, 19)]);

        // Keep 60 candles in view
        const updated = [...prev.slice(0, prev.length - 1), {
          ...last,
          close: newClose,
          high: newHigh,
          low: newLow,
          volume: newVol
        }];
        return updated;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, simulationSpeed, activeRegime, selectedSymbol]);

  // Quick Paper Order placement
  const handleQuickTrade = (side: 'BUY' | 'SELL') => {
    const price = selectedTicker.price;
    const amount = quickAmountUsd / price;
    onExecuteTrade({
      symbol: selectedSymbol,
      side,
      orderType: 'MARKET',
      price,
      amount: Number(amount.toFixed(4)),
      totalUsd: quickAmountUsd,
      status: 'OPEN',
      strategyTag: activeRegime !== 'normal' ? `HF-${activeRegime.toUpperCase()}` : 'DISCRETIONARY',
      notes: `Executed during real-time L2 simulation at speed ${simulationSpeed}x.`
    });
    soundEngine.playAlert('fill');
  };

  const currentPrice = candles[candles.length - 1]?.close || selectedTicker.price;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Simulation Header & Asset Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="h-5 w-5 animate-pulse" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              High-Frequency Market Simulator
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Real-time Level 2 order book ladder, order flow imbalance, synthetic volatility injectors, and instant paper execution.
          </p>
        </div>

        {/* Asset Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tickers.map((ticker) => (
            <button
              key={ticker.symbol}
              id={`sim-asset-${ticker.symbol.replace('/', '-')}`}
              onClick={() => setSelectedSymbol(ticker.symbol)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedSymbol === ticker.symbol
                  ? isDark
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                    : 'bg-cyan-50 border-cyan-400 text-cyan-900 shadow-sm'
                  : isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{ticker.symbol}</span>
                <span className={`text-[10px] ${ticker.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${ticker.price.toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar: Playback, Speed, Market Regime Injector */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } shadow-lg`}>
        {/* Play / Pause & Speed */}
        <div className="flex items-center gap-3">
          <button
            id="sim-play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
            }`}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
            <span>{isPlaying ? 'Pause Feed' : 'Resume Feed'}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[1, 5, 20, 50].map((speed) => (
              <button
                key={speed}
                id={`sim-speed-${speed}x`}
                onClick={() => setSimulationSpeed(speed)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  simulationSpeed === speed
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Market Regime Injectors */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">Inject Regime:</span>
          {[
            { id: 'normal', label: 'Normal Noise', icon: Activity, color: 'text-slate-300' },
            { id: 'bull', label: 'Bull Trend', icon: TrendingUp, color: 'text-emerald-400' },
            { id: 'flash_crash', label: 'Flash Crash', icon: Flame, color: 'text-rose-400' },
            { id: 'high_vol', label: 'Vol Spike', icon: Zap, color: 'text-amber-400' },
          ].map((regime) => {
            const Icon = regime.icon;
            const isSel = activeRegime === regime.id;
            return (
              <button
                key={regime.id}
                id={`sim-regime-${regime.id}`}
                onClick={() => setActiveRegime(regime.id as any)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSel
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                    : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${regime.color}`} />
                <span>{regime.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overlay Indicator Toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Overlays:</span>
          <button
            onClick={() => setShowIndicators(p => ({ ...p, bb: !p.bb }))}
            className={`px-2 py-1 rounded text-[11px] font-mono font-semibold border ${
              showIndicators.bb
                ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            BB (20,2)
          </button>
          <button
            onClick={() => setShowIndicators(p => ({ ...p, sma: !p.sma }))}
            className={`px-2 py-1 rounded text-[11px] font-mono font-semibold border ${
              showIndicators.sma
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            SMA 20
          </button>
          <button
            onClick={() => setShowIndicators(p => ({ ...p, rsi: !p.rsi }))}
            className={`px-2 py-1 rounded text-[11px] font-mono font-semibold border ${
              showIndicators.rsi
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            RSI 14
          </button>
        </div>
      </div>

      {/* Main Grid: Chart + Order Book + Trade Tape */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Real-Time Candlestick Chart */}
        <div className="lg:col-span-8 space-y-6">
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-xl`}>
            {/* Asset Live Metric Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-100">{selectedSymbol}</span>
                  <span className={`text-sm font-bold font-mono ${
                    selectedTicker.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {selectedTicker.change24h >= 0 ? '+' : ''}{selectedTicker.change24h}%
                  </span>
                </div>
                <div className="text-3xl font-extrabold font-mono text-cyan-400 tracking-tight mt-0.5">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: selectedTicker.type === 'fx' ? 4 : 2 })}
                </div>
              </div>

              {/* Microstructure KPIs */}
              <div className="grid grid-cols-3 gap-3 text-right">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Spread (BPS)</div>
                  <div className="text-xs font-mono font-bold text-slate-200">
                    {((orderBook.spread / currentPrice) * 10000).toFixed(1)} bps
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">OFI Imbalance</div>
                  <div className={`text-xs font-mono font-bold ${
                    orderBook.imbalance > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {orderBook.imbalance > 0 ? '+' : ''}{(orderBook.imbalance * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">1m Realized Vol</div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    {selectedTicker.volatility1m}%
                  </div>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={candles}>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} orientation="right" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  {showIndicators.bb && (
                    <>
                      <Line type="monotone" dataKey="upperBand" stroke="#818cf8" strokeDasharray="3 3" dot={false} name="Upper BB (2σ)" />
                      <Line type="monotone" dataKey="lowerBand" stroke="#818cf8" strokeDasharray="3 3" dot={false} name="Lower BB (2σ)" />
                    </>
                  )}
                  {showIndicators.sma && (
                    <Line type="monotone" dataKey="sma20" stroke="#38bdf8" strokeWidth={1.5} dot={false} name="SMA 20" />
                  )}
                  <Line type="monotone" dataKey="close" stroke="#f8fafc" strokeWidth={2} dot={false} name="Close Price" />
                  <Bar dataKey="volume" fill="#334155" opacity={0.3} yAxisId={1} name="Volume" />
                  <YAxis yAxisId={1} hide domain={[0, 'auto']} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* RSI Sub-Panel */}
            {showIndicators.rsi && (
              <div className="h-20 w-full mt-2 pt-2 border-t border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                  <span>Relative Strength Index (RSI 14)</span>
                  <span className="text-amber-400 font-bold">{candles[candles.length - 1]?.rsi}</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={candles}>
                    <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} ticks={[30, 70]} orientation="right" />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="2 2" />
                    <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="2 2" />
                    <Line type="monotone" dataKey="rsi" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quick Paper Execution Console */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-xl flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Order Notional:</span>
              <div className="flex items-center gap-1.5">
                {[500, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    id={`quick-amt-${amt}`}
                    onClick={() => setQuickAmountUsd(amt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
                      quickAmountUsd === amt
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="quick-paper-buy-btn"
                onClick={() => handleQuickTrade('BUY')}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Market Buy (${quickAmountUsd.toLocaleString()})</span>
              </button>

              <button
                id="quick-paper-sell-btn"
                onClick={() => handleQuickTrade('SELL')}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <ArrowDownRight className="h-4 w-4" />
                <span>Market Sell (${quickAmountUsd.toLocaleString()})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Order Book (L2 Ladder) & Real-time Trades Tape */}
        <div className="lg:col-span-4 space-y-6">
          {/* Level 2 Order Book */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-xl`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Level 2 Order Book
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Spread: ${orderBook.spread}
              </span>
            </div>

            {/* Asks (Sells) */}
            <div className="space-y-1 font-mono text-xs mb-2">
              <div className="grid grid-cols-3 text-[10px] text-slate-500 font-sans uppercase px-1">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Total</span>
              </div>
              {orderBook.asks.slice(0, 6).map((ask, idx) => (
                <div key={idx} className="grid grid-cols-3 relative px-1 py-0.5 rounded text-rose-400">
                  <div
                    className="absolute inset-y-0 right-0 bg-rose-500/10 rounded"
                    style={{ width: `${Math.min(100, (ask.total / 40) * 100)}%` }}
                  />
                  <span className="relative font-bold">${ask.price.toLocaleString()}</span>
                  <span className="relative text-right text-slate-300">{ask.amount}</span>
                  <span className="relative text-right text-slate-400">{ask.total}</span>
                </div>
              ))}
            </div>

            {/* Mid Price Spread Divider */}
            <div className="my-2 py-1.5 px-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-cyan-400">
                ${currentPrice.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">
                OFI: {orderBook.imbalance > 0 ? 'Buy Heavy' : 'Sell Heavy'}
              </span>
            </div>

            {/* Bids (Buys) */}
            <div className="space-y-1 font-mono text-xs">
              {orderBook.bids.slice(0, 6).map((bid, idx) => (
                <div key={idx} className="grid grid-cols-3 relative px-1 py-0.5 rounded text-emerald-400">
                  <div
                    className="absolute inset-y-0 right-0 bg-emerald-500/10 rounded"
                    style={{ width: `${Math.min(100, (bid.total / 40) * 100)}%` }}
                  />
                  <span className="relative font-bold">${bid.price.toLocaleString()}</span>
                  <span className="relative text-right text-slate-300">{bid.amount}</span>
                  <span className="relative text-right text-slate-400">{bid.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* High-Frequency Trade Tape */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-xl`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Real-Time Trade Tape
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">HF Stream</span>
            </div>

            <div className="space-y-1 max-h-52 overflow-y-auto font-mono text-xs pr-1">
              <div className="grid grid-cols-3 text-[10px] text-slate-500 font-sans uppercase px-1">
                <span>Price</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Time</span>
              </div>
              {tradesTape.map((trade) => (
                <div
                  key={trade.id}
                  className={`grid grid-cols-3 px-1 py-0.5 rounded transition-colors ${
                    trade.side === 'buy' ? 'text-emerald-400 bg-emerald-950/20' : 'text-rose-400 bg-rose-950/20'
                  }`}
                >
                  <span className="font-semibold">${trade.price.toLocaleString()}</span>
                  <span className="text-right text-slate-300">{trade.amount}</span>
                  <span className="text-right text-slate-500 text-[10px]">
                    {new Date(trade.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
              {tradesTape.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500 font-sans">
                  Streaming trades...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
