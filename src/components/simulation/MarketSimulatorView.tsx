import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Candle, 
  MarketTicker, 
  OrderBook, 
  OrderBookLevel, 
  MarketTrade, 
  UserProfile, 
  TradeRecord,
  VolatilityAlert,
  TradeSignal,
  TradingBotConfig
} from '../../types';
import { generateCandles, soundEngine } from '../../utils/quantEngine';
import { TradingViewHeader, ChartStyleType, TimeframeType, IndicatorSettings } from '../tradingview/TradingViewHeader';
import { DrawingToolbar, DrawingToolType } from '../tradingview/DrawingToolbar';
import { TradingViewChart } from '../tradingview/TradingViewChart';
import { TradingViewRightDock } from '../tradingview/TradingViewRightDock';
import { TradingViewBottomConsole } from '../tradingview/TradingViewBottomConsole';
import { TradeAnalyzerModal } from '../signals/TradeAnalyzerModal';

export interface MarketSimulatorViewProps {
  tickers: MarketTicker[];
  user: UserProfile;
  trades?: TradeRecord[];
  onExecuteTrade: (trade: Omit<TradeRecord, 'id' | 'createdAt'>) => void;
  onCloseTrade?: (id: string, exitPrice: number) => void;
  alerts?: VolatilityAlert[];
  isDark: boolean;
  signals?: TradeSignal[];
  botConfig?: TradingBotConfig;
  onToggleBot?: () => void;
}

export const MarketSimulatorView: React.FC<MarketSimulatorViewProps> = ({
  tickers,
  user,
  trades = [],
  onExecuteTrade,
  onCloseTrade = () => {},
  alerts = [],
  isDark,
  signals = [],
  botConfig,
  onToggleBot = () => {},
}) => {
  // Selected Symbol (Defaults to US30)
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => tickers[0]?.symbol || 'US30');
  const [activeSignalForAnalyzer, setActiveSignalForAnalyzer] = useState<TradeSignal | null>(null);
  
  // Header Settings
  const [chartStyle, setChartStyle] = useState<ChartStyleType>('candles');
  const [timeframe, setTimeframe] = useState<TimeframeType>('1m');
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    ema20: true,
    ema50: true,
    ema200: false,
    bb: true,
    vwap: false,
    rsi: true,
    macd: false,
    volume: true,
  });

  // Simulation Feed Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x, 5x, 20x
  const [activeRegime, setActiveRegime] = useState<'normal' | 'bull' | 'flash_crash' | 'range' | 'high_vol'>('normal');

  // Drawing Tools State
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('crosshair');
  const [magnetEnabled, setMagnetEnabled] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [hideDrawings, setHideDrawings] = useState<boolean>(false);
  const [drawingsCount, setDrawingsCount] = useState<number>(2);

  // Bar Replay Mode State
  const [isReplayOpen, setIsReplayOpen] = useState<boolean>(false);

  // Bottom Console State
  const [isBottomExpanded, setIsBottomExpanded] = useState<boolean>(true);

  // Alerts quick toast
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  // Active ticker
  const currentTicker = useMemo(() => {
    return tickers.find(t => t.symbol === selectedSymbol) || tickers[0] || {
      symbol: 'US30',
      price: 40850.20,
      bid: 40849.30,
      ask: 40851.10,
      spread: 1.8,
      change24h: 0.62,
      volume: 1850000000,
      volatility1m: 0.95,
      type: 'index' as const,
      timestamp: Date.now()
    };
  }, [tickers, selectedSymbol]);

  // Candle series initialization
  const [candles, setCandles] = useState<Candle[]>(() => {
    return generateCandles(currentTicker.price, 75, 0.28, 0.05);
  });

  // Real-time market trades tape
  const [tradesTape, setTradesTape] = useState<MarketTrade[]>([
    { id: '1', symbol: 'US30', price: 40850.20, amount: 1.5, side: 'buy', timestamp: Date.now() - 400 },
    { id: '2', symbol: 'US30', price: 40849.80, amount: 2.0, side: 'sell', timestamp: Date.now() - 900 },
    { id: '3', symbol: 'US30', price: 40851.10, amount: 0.8, side: 'buy', timestamp: Date.now() - 1400 },
  ]);

  // Re-generate candles when ticker changes
  useEffect(() => {
    const isCrypto = currentTicker.type === 'crypto';
    const isGoldOrIndex = currentTicker.symbol === 'US30' || currentTicker.symbol === 'NAS100' || currentTicker.symbol === 'XAU/USD';
    setCandles(generateCandles(currentTicker.price, 75, isCrypto ? 0.45 : (isGoldOrIndex ? 0.28 : 0.20), 0.05));
  }, [selectedSymbol]);

  // Toggle single indicator
  const handleToggleIndicator = (key: keyof IndicatorSettings) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Level 2 Order Book generation based on selected ticker price and regime
  const orderBook: OrderBook = useMemo(() => {
    const mid = currentTicker.price;
    let tickSize = 0.01;
    if (currentTicker.type === 'fx') tickSize = 0.0001;
    else if (currentTicker.symbol === 'US30') tickSize = 1.0;
    else if (currentTicker.symbol === 'NAS100') tickSize = 0.25;
    else if (currentTicker.symbol === 'XAU/USD') tickSize = 0.10;
    else if (currentTicker.price > 1000) tickSize = 0.5;

    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    let cumBidTotal = 0;
    let cumAskTotal = 0;

    // Imbalance bias from active regime
    const imbalanceBias = activeRegime === 'bull' ? 0.4 : (activeRegime === 'flash_crash' ? -0.5 : 0);

    for (let i = 1; i <= 8; i++) {
      const bidPrice = Number((mid - i * tickSize * (1 + (i * 0.08))).toFixed(currentTicker.type === 'commodity' ? 2 : 1));
      const askPrice = Number((mid + i * tickSize * (1 + (i * 0.08))).toFixed(currentTicker.type === 'commodity' ? 2 : 1));

      const bidAmt = Number(((1.5 + Math.random() * 3.5 + imbalanceBias * 2) * (1 + i * 0.15)).toFixed(1));
      const askAmt = Number(((1.5 + Math.random() * 3.5 - imbalanceBias * 2) * (1 + i * 0.15)).toFixed(1));

      cumBidTotal += bidAmt;
      cumAskTotal += askAmt;

      bids.push({ price: bidPrice, amount: bidAmt, total: Number(cumBidTotal.toFixed(1)) });
      asks.push({ price: askPrice, amount: askAmt, total: Number(cumAskTotal.toFixed(1)) });
    }

    const totalBidVol = bids.reduce((a, b) => a + b.amount, 0);
    const totalAskVol = asks.reduce((a, b) => a + b.amount, 0);
    const imbalance = (totalBidVol - totalAskVol) / (totalBidVol + totalAskVol);

    return {
      bids,
      asks: asks.reverse(),
      spread: Number((asks[asks.length - 1].price - bids[0].price).toFixed(currentTicker.type === 'commodity' ? 2 : 1)),
      midPrice: mid,
      imbalance: Number(imbalance.toFixed(2)),
    };
  }, [currentTicker, activeRegime]);

  // Live Real-Time High-Frequency Simulation Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(120, Math.floor(1000 / simulationSpeed));
    const timer = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        
        let drift = 0;
        let volMult = 1.0;
        if (activeRegime === 'bull') drift = 0.0012;
        else if (activeRegime === 'flash_crash') drift = -0.0030;
        else if (activeRegime === 'high_vol') volMult = 2.2;

        const noise = (Math.random() - 0.495 + drift) * (0.0012 * volMult);
        const newClose = Number((last.close * (1 + noise)).toFixed(2));
        const newHigh = Number(Math.max(last.high, newClose).toFixed(2));
        const newLow = Number(Math.min(last.low, newClose).toFixed(2));
        const newVol = last.volume + Math.floor(Math.random() * 4000);

        // Append high-frequency trade tape item
        const side: 'buy' | 'sell' = noise >= 0 ? 'buy' : 'sell';
        const tradeItem: MarketTrade = {
          id: `tape-${Date.now()}-${Math.random()}`,
          symbol: currentTicker.symbol,
          price: newClose,
          amount: Number((Math.random() * 2.5 + 0.1).toFixed(2)),
          side,
          timestamp: Date.now()
        };

        setTradesTape(tPrev => [tradeItem, ...tPrev.slice(0, 39)]);

        return [...prev.slice(0, prev.length - 1), {
          ...last,
          close: newClose,
          high: newHigh,
          low: newLow,
          volume: newVol
        }];
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, simulationSpeed, activeRegime, currentTicker.symbol]);

  // Quick Trade Handler (from Chart Top-Left Floating DOM widget or Right Dock)
  const handleQuickTrade = (side: 'BUY' | 'SELL', amount: number) => {
    const tradePrice = side === 'BUY' ? orderBook.asks[0]?.price || currentTicker.price : orderBook.bids[0]?.price || currentTicker.price;
    const notionalUsd = amount * tradePrice;

    onExecuteTrade({
      symbol: currentTicker.symbol,
      side,
      orderType: 'MARKET',
      price: tradePrice,
      amount,
      totalUsd: notionalUsd,
      status: 'OPEN',
      strategyTag: 'TradingView Quick DOM Execution',
      notes: `Instant market ${side} of ${amount} contracts @ $${tradePrice.toLocaleString()} on TradingView Terminal.`,
    });

    soundEngine.playAlert('fill');
    setAlertNotice(`Filled: ${side} ${amount} ${currentTicker.symbol} @ $${tradePrice.toFixed(2)}`);
    setTimeout(() => setAlertNotice(null), 3000);
  };

  // Snapshot screenshot handler
  const handleTakeSnapshot = () => {
    soundEngine.playAlert('success');
    setAlertNotice('TradingView Chart Snapshot saved to clipboard & files');
    setTimeout(() => setAlertNotice(null), 3000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] min-h-[580px] w-full bg-[#131722] text-[#d1d4dc] overflow-hidden select-none border border-[#2a2e39] rounded-lg shadow-2xl">
      {/* 1. TradingView Top Header Bar */}
      <TradingViewHeader
        currentTicker={currentTicker}
        tickers={tickers}
        onSelectSymbol={setSelectedSymbol}
        timeframe={timeframe}
        onChangeTimeframe={setTimeframe}
        chartStyle={chartStyle}
        onChangeChartStyle={setChartStyle}
        indicators={indicators}
        onToggleIndicator={handleToggleIndicator}
        isReplayOpen={isReplayOpen}
        onToggleReplay={() => setIsReplayOpen(!isReplayOpen)}
        onOpenAlertModal={() => {
          setAlertNotice(`Volatility Alert rule armed for ${currentTicker.symbol} at $${currentTicker.price.toFixed(2)}`);
          setTimeout(() => setAlertNotice(null), 3000);
        }}
        onTakeSnapshot={handleTakeSnapshot}
        activeRegime={activeRegime}
        onChangeRegime={setActiveRegime}
        simulationSpeed={simulationSpeed}
        onChangeSpeed={setSimulationSpeed}
        isPlayingFeed={isPlaying}
        onTogglePlayFeed={() => setIsPlaying(!isPlaying)}
      />

      {/* Floating Notice Toast */}
      {alertNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#2962ff] text-white text-xs font-mono font-bold px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in pointer-events-none">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span>{alertNotice}</span>
        </div>
      )}

      {/* 2. Middle Row: Left Drawing Toolbar + Central Candlestick Chart + Right Dock */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Drawing Rail */}
        <DrawingToolbar
          activeTool={activeDrawingTool}
          onSelectTool={setActiveDrawingTool}
          magnetEnabled={magnetEnabled}
          onToggleMagnet={() => setMagnetEnabled(!magnetEnabled)}
          isLocked={isLocked}
          onToggleLock={() => setIsLocked(!isLocked)}
          hideDrawings={hideDrawings}
          onToggleHideDrawings={() => setHideDrawings(!hideDrawings)}
          onClearDrawings={() => setDrawingsCount(0)}
          drawingsCount={drawingsCount}
        />

        {/* Central High-Performance Candlestick Chart Canvas */}
        <TradingViewChart
          ticker={currentTicker}
          candles={candles}
          orderBook={orderBook}
          chartStyle={chartStyle}
          timeframe={timeframe}
          indicators={indicators}
          activeDrawingTool={activeDrawingTool}
          hideDrawings={hideDrawings}
          onQuickTrade={handleQuickTrade}
          isReplayOpen={isReplayOpen}
          onCloseReplay={() => setIsReplayOpen(false)}
        />

        {/* Right Dock (Watchlist, DOM Level 2, Order Ticket, Calendar, Alerts, Signals & Bot) */}
        <TradingViewRightDock
          currentTicker={currentTicker}
          tickers={tickers}
          onSelectSymbol={setSelectedSymbol}
          orderBook={orderBook}
          user={user}
          alerts={alerts}
          onExecuteTrade={onExecuteTrade}
          signals={signals}
          onOpenAnalyzer={(sig) => setActiveSignalForAnalyzer(sig)}
          botConfig={botConfig}
          onToggleBot={onToggleBot}
        />
      </div>

      {/* 3. TradingView Bottom Console (Pine Editor, Strategy Tester, Paper Account, Time & Sales) */}
      <TradingViewBottomConsole
        user={user}
        trades={trades}
        onCloseTrade={onCloseTrade}
        tradesTape={tradesTape}
        isExpanded={isBottomExpanded}
        onToggleExpand={() => setIsBottomExpanded(!isBottomExpanded)}
      />

      {/* In-Depth Trade Analyzer Modal */}
      {activeSignalForAnalyzer && (
        <TradeAnalyzerModal
          isOpen={Boolean(activeSignalForAnalyzer)}
          onClose={() => setActiveSignalForAnalyzer(null)}
          signal={activeSignalForAnalyzer}
          currentPrice={currentTicker.price}
          onExecuteTrade={(sig) => {
            onExecuteTrade({
              symbol: sig.symbol,
              side: sig.direction,
              orderType: 'MARKET',
              price: currentTicker.price,
              amount: 1.0,
              totalUsd: currentTicker.price * 1.0,
              status: 'OPEN',
              strategyTag: sig.strategyName,
              notes: `Executed from Analyzer | SL: $${sig.stopLoss} | BE: $${sig.breakEvenPrice} | TP: $${sig.tp2}`,
              stopLoss: sig.stopLoss,
              takeProfit: sig.tp2,
              breakEvenPrice: sig.breakEvenPrice,
              isBreakEvenMoved: false,
              isBotTrade: false,
              signalId: sig.id,
            });
            setActiveSignalForAnalyzer(null);
          }}
          isDark={isDark}
        />
      )}
    </div>
  );
};
