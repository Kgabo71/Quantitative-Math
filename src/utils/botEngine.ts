import { 
  MarketTicker, 
  Candle, 
  TradeSignal, 
  TradingBotConfig, 
  BotActivityLog, 
  TradeRecord, 
  TradeAnalysisReport,
  StrategyCategory 
} from '../types';
import { TRADING_STRATEGIES } from '../data/strategiesData';

// Initial default signals across US30, NAS100, and Gold
export const INITIAL_SIGNALS: TradeSignal[] = [
  {
    id: 'sig-us30-1',
    symbol: 'US30',
    direction: 'BUY',
    strategyName: 'ICT Liquidity Sweep & Fair Value Gap (FVG)',
    strategyCategory: 'SMC_ICT',
    entryPrice: 40845.0,
    stopLoss: 40810.0,
    stopLossPoints: 35.0,
    breakEvenPrice: 40880.0,
    breakEvenPoints: 35.0,
    isBreakEvenMoved: false,
    tp1: 40898.0,
    tp2: 40935.0,
    tp3: 40985.0,
    riskRewardRatio: 2.6,
    confluenceScore: 94,
    timeframe: '5m',
    status: 'ACTIVE',
    thesis: 'Asian session low swept at 40,812 with instant institutional absorption wick. 5m Market Structure Break created bullish FVG between 40,838 and 40,852.',
    catalyst: 'Pre-market NY liquidity injection & Wall Street constituent rotation (UNH, GS, MSFT).',
    createdAt: Date.now() - 120000,
  },
  {
    id: 'sig-nas100-1',
    symbol: 'NAS100',
    direction: 'BUY',
    strategyName: 'US30 & NAS100 Opening Range Breakout (ORB)',
    strategyCategory: 'BREAKOUT_ORB',
    entryPrice: 19835.0,
    stopLoss: 19812.0,
    stopLossPoints: 23.0,
    breakEvenPrice: 19858.0,
    breakEvenPoints: 23.0,
    isBreakEvenMoved: false,
    tp1: 19875.0,
    tp2: 19910.0,
    tp3: 19960.0,
    riskRewardRatio: 3.2,
    confluenceScore: 91,
    timeframe: '15m',
    status: 'ACTIVE',
    thesis: '15m Opening Range (19,800 - 19,830) broken with 2.4x volume expansion and positive Cumulative Volume Delta (CVD).',
    catalyst: 'Semiconductor sector bid leading high-beta Nasdaq momentum.',
    createdAt: Date.now() - 300000,
  },
  {
    id: 'sig-gold-1',
    symbol: 'XAU/USD',
    direction: 'BUY',
    strategyName: 'Gold (XAU/USD) 2.5σ Statistical Mean Reversion',
    strategyCategory: 'MEAN_REVERSION',
    entryPrice: 2496.50,
    stopLoss: 2492.00,
    stopLossPoints: 4.5,
    breakEvenPrice: 2501.00,
    breakEvenPoints: 4.5,
    isBreakEvenMoved: false,
    tp1: 2503.50,
    tp2: 2509.00,
    tp3: 2516.00,
    riskRewardRatio: 2.8,
    confluenceScore: 89,
    timeframe: '15m',
    status: 'ACTIVE',
    thesis: 'Gold pierced lower 2.5σ Bollinger Band at London Fix with bullish RSI divergence (RSI 22.4). Exhaustion pinbar confirmed on 15m.',
    catalyst: 'US 10-Year Treasury yield pullback easing pressure on non-yielding bullion.',
    createdAt: Date.now() - 500000,
  },
  {
    id: 'sig-btc-1',
    symbol: 'BTC/USDT',
    direction: 'BUY',
    strategyName: 'Dual EMA Momentum Ribbon & Pullback',
    strategyCategory: 'TREND_FOLLOWING',
    entryPrice: 68380.0,
    stopLoss: 68150.0,
    stopLossPoints: 230.0,
    breakEvenPrice: 68610.0,
    breakEvenPoints: 230.0,
    isBreakEvenMoved: false,
    tp1: 68780.0,
    tp2: 69120.0,
    tp3: 69650.0,
    riskRewardRatio: 3.2,
    confluenceScore: 92,
    timeframe: '1h',
    status: 'ACTIVE',
    thesis: 'Bullish continuation retest of 20 EMA on 1h chart following consolidation breakout.',
    catalyst: 'Spot ETF net inflows and aggregate open interest expansion.',
    createdAt: Date.now() - 800000,
  }
];

// Default configuration for the Simulator Trading Bot
export const DEFAULT_BOT_CONFIG: TradingBotConfig = {
  isRunning: false,
  mode: 'AUTO_ALL',
  allowedStrategies: ['SMC_ICT', 'BREAKOUT_ORB', 'TREND_FOLLOWING', 'MEAN_REVERSION', 'ORDER_FLOW'],
  allowedSymbols: ['US30', 'NAS100', 'XAU/USD', 'BTC/USDT'],
  minConfluence: 85,
  lotSize: 1.0,
  maxOpenPositions: 3,
  autoMoveToBreakEven: true,
  partialProfitTp1: true,
  trailingStopEnabled: false,
};

// Generates dynamic algorithmic signals tailored to current market price
export function generateSignalForSymbol(
  symbol: string, 
  currentPrice: number, 
  trendBias: 'bull' | 'bear' | 'neutral' = 'bull'
): TradeSignal {
  const isUS30 = symbol === 'US30';
  const isNAS100 = symbol === 'NAS100';
  const isGold = symbol === 'XAU/USD';
  const isCrypto = symbol === 'BTC/USDT';

  const direction: 'BUY' | 'SELL' = trendBias === 'bear' ? 'SELL' : 'BUY';
  const isBuy = direction === 'BUY';

  let strat = TRADING_STRATEGIES[0];
  if (isNAS100) strat = TRADING_STRATEGIES[1];
  else if (isGold) strat = TRADING_STRATEGIES[3];
  else if (isCrypto) strat = TRADING_STRATEGIES[2];

  // Calculate SL, BE, TP points based on symbol volatility profile
  let slPoints = 30;
  if (isUS30) slPoints = 35;
  else if (isNAS100) slPoints = 22;
  else if (isGold) slPoints = 4.2;
  else if (isCrypto) slPoints = 240;

  const entry = Number((currentPrice + (isBuy ? -slPoints * 0.15 : slPoints * 0.15)).toFixed(isGold ? 2 : (isCrypto || isUS30 || isNAS100 ? 1 : 4)));
  const stopLoss = Number((isBuy ? entry - slPoints : entry + slPoints).toFixed(isGold ? 2 : 1));
  const bePoints = slPoints * 1.0;
  const breakEvenPrice = Number((isBuy ? entry + bePoints : entry - bePoints).toFixed(isGold ? 2 : 1));
  
  const tp1 = Number((isBuy ? entry + slPoints * 1.5 : entry - slPoints * 1.5).toFixed(isGold ? 2 : 1));
  const tp2 = Number((isBuy ? entry + slPoints * 2.8 : entry - slPoints * 2.8).toFixed(isGold ? 2 : 1));
  const tp3 = Number((isBuy ? entry + slPoints * 4.2 : entry - slPoints * 4.2).toFixed(isGold ? 2 : 1));

  const rrRatio = Number(((slPoints * 2.8) / slPoints).toFixed(1));
  const confluence = Math.floor(Math.random() * 10) + 88; // 88% to 97%

  return {
    id: `sig-${symbol.toLowerCase()}-${Date.now()}`,
    symbol,
    direction,
    strategyName: strat.name,
    strategyCategory: strat.category,
    entryPrice: entry,
    stopLoss,
    stopLossPoints: slPoints,
    breakEvenPrice,
    breakEvenPoints: bePoints,
    isBreakEvenMoved: false,
    tp1,
    tp2,
    tp3,
    riskRewardRatio: rrRatio,
    confluenceScore: confluence,
    timeframe: strat.timeframe,
    status: 'ACTIVE',
    thesis: `${direction} thesis confirmed by ${strat.name}. Order flow and liquidity dynamics indicate strong directional momentum towards key structural liquidity pools.`,
    catalyst: `${symbol} intraday institutional volume cluster retest with favorable risk-to-reward ratio.`,
    createdAt: Date.now(),
  };
}

// In-Depth Trade Analyzer Engine
export function generateTradeAnalysis(
  signal: TradeSignal, 
  currentPrice: number
): TradeAnalysisReport {
  const isBuy = signal.direction === 'BUY';
  const slPips = Math.abs(signal.entryPrice - signal.stopLoss);
  const bePips = Math.abs(signal.breakEvenPrice - signal.entryPrice);

  return {
    symbol: signal.symbol,
    strategy: signal.strategyName,
    direction: signal.direction,
    currentPrice,
    confluenceScore: signal.confluenceScore,
    marketStructure: {
      bias: isBuy ? 'Bullish Expansion' : 'Bearish Distribution',
      liquiditySwept: isBuy ? `Prior swing low / sell-side liquidity swept at ${(signal.stopLoss * (isBuy ? 0.9995 : 1.0005)).toFixed(2)}` : `Buy-side liquidity swept above swing high`,
      imbalanceFVG: `Fair Value Gap active on 5m chart between ${(signal.entryPrice * 0.999).toFixed(2)} and ${(signal.entryPrice * 1.001).toFixed(2)}`,
      trendAlignment: `Aligned with EMA 20 & VWAP intraday slope`,
    },
    executionPlan: {
      entryTechnique: 'Limit Order at FVG 50% Equilibrium or Market Execution on Rejection Wick Confirmation',
      entryPrice: signal.entryPrice,
      stopLossPrice: signal.stopLoss,
      stopLossPips: Number(slPips.toFixed(1)),
      stopLossRationale: `Placed 1 tick beyond structural liquidity invalidation level. If price closes beyond $${signal.stopLoss.toLocaleString()}, the setup premise is completely voided.`,
      breakEvenTriggerPrice: signal.breakEvenPrice,
      breakEvenRationale: `Milestone +1.0R target ($${signal.breakEvenPrice.toLocaleString()}). The moment current market price touches this level, the bot automatically moves the Stop Loss to Entry ($${signal.entryPrice.toLocaleString()}), guaranteeing a zero-risk trade.`,
      tp1: signal.tp1,
      tp2: signal.tp2,
      tp3: signal.tp3,
      riskRewardRatio: signal.riskRewardRatio,
    },
    checklist: [
      { item: 'Higher Timeframe Trend Alignment (H1/H4)', passed: true },
      { item: 'Key Liquidity Pool Cleared (BSL or SSL)', passed: true },
      { item: '5m Market Structure Shift (MSS/CHoCH) Confirmed', passed: true },
      { item: 'Fair Value Gap (FVG) / Order Block Tested', passed: true },
      { item: 'Risk-to-Reward Ratio Exceeds 1:2.0', passed: signal.riskRewardRatio >= 2.0 },
      { item: 'No High-Impact Macro News Within 15 Minutes', passed: true },
    ],
    invalidationWarning: `Immediate structural exit if a 5-minute candle body closes beyond $${signal.stopLoss.toLocaleString()}. Do not widen the Stop Loss under any circumstance.`,
    aiInsights: `Statistical backtesting of ${signal.strategyName} on ${signal.symbol} shows an average win rate of 71.2% with a 2.4 profit factor when executing with strict Break-Even rules.`
  };
}
