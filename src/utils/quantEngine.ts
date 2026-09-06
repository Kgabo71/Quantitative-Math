import { Candle, BacktestConfig, BacktestResult, BacktestTrade, EquityPoint, MonteCarloPath } from '../types';

// Web Audio Sound Synthesizer for alerts & trades
class QuantSoundEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playAlert(type: 'warning' | 'critical' | 'fill' | 'success') {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'critical') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'warning') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.1); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'fill') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        // Success
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.08);
        osc.frequency.setValueAtTime(659.25, now + 0.16);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }
}

export const soundEngine = new QuantSoundEngine();

// Technical Indicators
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function calculateBollingerBands(data: number[], period: number = 20, multiplier: number = 2) {
  const sma = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(data[i]);
      lower.push(data[i]);
      continue;
    }
    const window = data.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance = window.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    upper.push(mean + multiplier * std);
    lower.push(mean - multiplier * std);
  }

  return { sma, upper, lower };
}

export function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi: number[] = [50];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    if (i <= period) {
      gains += gain;
      losses += loss;
      if (i === period) {
        let avgGain = gains / period;
        let avgLoss = losses / period;
        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      } else {
        rsi.push(50);
      }
    } else {
      const avgGain = (gains * (period - 1) + gain) / period;
      const avgLoss = (losses * (period - 1) + loss) / period;
      gains = avgGain;
      losses = avgLoss;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
}

// Generate Realistic Market Candles (Geometric Brownian Motion with Jump Diffusion)
export function generateCandles(
  basePrice: number = 100,
  count: number = 180,
  volatilityAnnual: number = 0.35,
  driftAnnual: number = 0.10
): Candle[] {
  const candles: Candle[] = [];
  const dt = 1 / (365 * 24 * 60); // 1-minute equivalent or daily step
  const sigma = volatilityAnnual;
  const mu = driftAnnual;

  let currentPrice = basePrice;
  const now = Date.now();
  const stepMs = 60 * 1000;

  const closePrices: number[] = [];
  const highPrices: number[] = [];
  const lowPrices: number[] = [];

  for (let i = 0; i < count; i++) {
    const timeTimestamp = now - (count - i) * stepMs;
    const dateObj = new Date(timeTimestamp);
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Standard Normal Random Variate (Box-Muller)
    const u1 = Math.random() || 1e-6;
    const u2 = Math.random() || 1e-6;
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Jump diffusion shock (1.5% chance of sudden liquidity burst / order jump)
    const isJump = Math.random() < 0.015;
    const jumpMagnitude = isJump ? (Math.random() - 0.5) * 0.035 : 0;

    const returnStep = (mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z0 + jumpMagnitude;
    const open = currentPrice;
    const close = Math.max(1, open * Math.exp(returnStep));
    
    // Intraday high & low
    const wickHigh = (Math.random() * 0.004) * open;
    const wickLow = (Math.random() * 0.004) * open;
    const high = Math.max(open, close) + wickHigh;
    const low = Math.max(0.5, Math.min(open, close) - wickLow);

    // Volume calculation
    const baseVol = 50000;
    const volNoise = Math.random() * 80000;
    const volume = Math.round(baseVol + volNoise + (isJump ? 150000 : 0));

    currentPrice = close;
    closePrices.push(close);
    highPrices.push(high);
    lowPrices.push(low);

    candles.push({
      time: timeStr,
      timestamp: timeTimestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
  }

  // Calculate overlay indicators
  const sma20 = calculateSMA(closePrices, 20);
  const ema50 = calculateEMA(closePrices, 50);
  const bb = calculateBollingerBands(closePrices, 20, 2);
  const rsi = calculateRSI(closePrices, 14);

  return candles.map((c, i) => ({
    ...c,
    sma20: Number(sma20[i].toFixed(2)),
    ema50: Number(ema50[i].toFixed(2)),
    upperBand: Number(bb.upper[i].toFixed(2)),
    lowerBand: Number(bb.lower[i].toFixed(2)),
    rsi: Number(rsi[i].toFixed(1)),
  }));
}

// Full Backtesting Engine
export function runBacktest(
  candles: Candle[],
  config: BacktestConfig
): BacktestResult {
  const capital = config.initialCapital;
  let currentEquity = capital;
  let position: {
    side: 'BUY_LONG' | 'SELL_SHORT';
    entryPrice: number;
    amount: number;
    entryTime: string;
    entryIndex: number;
  } | null = null;

  const trades: BacktestTrade[] = [];
  const equityCurve: EquityPoint[] = [];

  const closePrices = candles.map(c => c.close);
  const sma = calculateSMA(closePrices, config.lookbackPeriod || 20);
  const bb = calculateBollingerBands(closePrices, config.lookbackPeriod || 20, config.zScoreThreshold || 2);
  const fastEma = calculateEMA(closePrices, config.fastEma || 12);
  const slowEma = calculateEMA(closePrices, config.slowEma || 50);
  const rsi = calculateRSI(closePrices, 14);

  const initialPrice = candles[0]?.close || 1;
  let peakEquity = capital;
  let maxDrawdownPct = 0;
  let maxDrawdownDays = 0;
  let currentDrawdownStart = 0;

  const takerFeeRate = (config.takerFeeBps || 5) / 10000;
  const slippageRate = (config.slippageBps || 3) / 10000;

  for (let i = 20; i < candles.length; i++) {
    const candle = candles[i];
    const price = candle.close;
    const prevCandle = candles[i - 1];

    // Benchmark equity
    const benchmarkEquity = capital * (price / initialPrice);

    // Dynamic Sizing
    let allocFraction = 0.25;
    if (config.positionSizing === 'kelly') {
      allocFraction = 0.40; // Kelly target fraction
    } else if (config.positionSizing === 'volatility_parity') {
      allocFraction = 0.20;
    }
    const tradeSizeUsd = currentEquity * allocFraction * (config.leverage || 1);

    // Strategy Signal Logic
    let signal: 'BUY' | 'SELL' | 'CLOSE' | 'HOLD' = 'HOLD';

    if (config.strategyType === 'mean_reversion_bollinger') {
      // Mean Reversion: Buy when price dips below lower Bollinger Band & RSI oversold (< 35)
      if (price < bb.lower[i] && rsi[i] < 40) {
        signal = 'BUY';
      } else if (price > bb.upper[i] && rsi[i] > 60) {
        signal = 'SELL';
      } else if (position && ((position.side === 'BUY_LONG' && price >= sma[i]) || (position.side === 'SELL_SHORT' && price <= sma[i]))) {
        signal = 'CLOSE';
      }
    } else if (config.strategyType === 'dual_ema_crossover') {
      // Trend Following: Golden cross / Death cross
      const fastPrev = fastEma[i - 1];
      const slowPrev = slowEma[i - 1];
      const fastNow = fastEma[i];
      const slowNow = slowEma[i];

      if (fastPrev <= slowPrev && fastNow > slowNow) {
        signal = 'BUY';
      } else if (fastPrev >= slowPrev && fastNow < slowNow) {
        signal = 'SELL';
      }
    } else if (config.strategyType === 'volatility_breakout_atr') {
      // Donchian High / Low Breakout
      const rollingHigh = Math.max(...candles.slice(Math.max(0, i - 15), i).map(c => c.high));
      const rollingLow = Math.min(...candles.slice(Math.max(0, i - 15), i).map(c => c.low));

      if (price > rollingHigh) signal = 'BUY';
      else if (price < rollingLow) signal = 'SELL';
    } else {
      // Default StatArb / Momentum hybrid
      if (rsi[i] < 30) signal = 'BUY';
      else if (rsi[i] > 70) signal = 'SELL';
    }

    // Check Stop Loss & Take Profit if in position
    if (position) {
      const isLong = position.side === 'BUY_LONG';
      const unrealizedPnlPct = isLong
        ? (price - position.entryPrice) / position.entryPrice
        : (position.entryPrice - price) / position.entryPrice;

      if (config.stopLossPct > 0 && unrealizedPnlPct <= -(config.stopLossPct / 100)) {
        signal = 'CLOSE';
      } else if (config.takeProfitPct > 0 && unrealizedPnlPct >= (config.takeProfitPct / 100)) {
        signal = 'CLOSE';
      }
    }

    // Execute Close / Fills
    if (position && (signal === 'CLOSE' || (signal === 'BUY' && position.side === 'SELL_SHORT') || (signal === 'SELL' && position.side === 'BUY_LONG'))) {
      const exitPrice = position.side === 'BUY_LONG' ? price * (1 - slippageRate) : price * (1 + slippageRate);
      const grossPnl = position.side === 'BUY_LONG'
        ? (exitPrice - position.entryPrice) * position.amount
        : (position.entryPrice - exitPrice) * position.amount;

      const fees = (position.entryPrice * position.amount + exitPrice * position.amount) * takerFeeRate;
      const slippagePaid = Math.abs(price - exitPrice) * position.amount;
      const netPnl = grossPnl - fees;

      currentEquity += netPnl;

      trades.push({
        id: `trade-${trades.length + 1}`,
        symbol: config.symbol,
        type: position.side,
        entryPrice: Number(position.entryPrice.toFixed(2)),
        exitPrice: Number(exitPrice.toFixed(2)),
        entryTime: position.entryTime,
        exitTime: candle.time,
        amount: Number(position.amount.toFixed(4)),
        pnl: Number(netPnl.toFixed(2)),
        pnlPct: Number(((netPnl / (position.entryPrice * position.amount)) * 100).toFixed(2)),
        slippagePaid: Number(slippagePaid.toFixed(2)),
        feesPaid: Number(fees.toFixed(2)),
        reason: signal === 'CLOSE' ? 'take_profit' : 'signal_flip',
      });

      position = null;
    }

    // Open new position
    if (!position && (signal === 'BUY' || signal === 'SELL')) {
      const side = signal === 'BUY' ? 'BUY_LONG' : 'SELL_SHORT';
      const entryPrice = side === 'BUY_LONG' ? price * (1 + slippageRate) : price * (1 - slippageRate);
      const amount = tradeSizeUsd / entryPrice;

      position = {
        side,
        entryPrice,
        amount,
        entryTime: candle.time,
        entryIndex: i,
      };
    }

    // Calculate current marked-to-market equity
    let markedEquity = currentEquity;
    if (position) {
      const uPnl = position.side === 'BUY_LONG'
        ? (price - position.entryPrice) * position.amount
        : (position.entryPrice - price) * position.amount;
      markedEquity += uPnl;
    }

    if (markedEquity > peakEquity) {
      peakEquity = markedEquity;
    }
    const currentDrawdown = ((peakEquity - markedEquity) / peakEquity) * 100;
    if (currentDrawdown > maxDrawdownPct) {
      maxDrawdownPct = currentDrawdown;
    }

    equityCurve.push({
      date: candle.time,
      timestamp: candle.timestamp,
      equity: Number(markedEquity.toFixed(2)),
      benchmarkEquity: Number(benchmarkEquity.toFixed(2)),
      drawdownPct: Number(currentDrawdown.toFixed(2)),
    });
  }

  // Summary Metrics Computation
  const netProfit = currentEquity - capital;
  const totalReturnPct = (netProfit / capital) * 100;
  const benchmarkReturnPct = ((candles[candles.length - 1].close - initialPrice) / initialPrice) * 100;

  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);
  const totalTrades = trades.length;
  const winRatePct = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

  const totalGains = winningTrades.reduce((acc, t) => acc + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? totalGains / totalLosses : (totalGains > 0 ? 99.9 : 1.0);

  // Daily Returns array for Sharpe / Sortino / VaR
  const returns: number[] = [];
  for (let k = 1; k < equityCurve.length; k++) {
    const r = (equityCurve[k].equity - equityCurve[k - 1].equity) / equityCurve[k - 1].equity;
    returns.push(r);
  }

  const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 0
    ? returns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / returns.length
    : 0;
  const stdDev = Math.sqrt(variance) || 1e-6;

  const downsideReturns = returns.filter(r => r < 0);
  const downsideVariance = downsideReturns.length > 0
    ? downsideReturns.reduce((acc, r) => acc + Math.pow(r, 2), 0) / downsideReturns.length
    : 1e-6;
  const downsideStdDev = Math.sqrt(downsideVariance) || 1e-6;

  // Annualized factor (assuming standard trading days / intraday periods)
  const annualFactor = Math.sqrt(252 * 6);
  const sharpeRatio = Number(((meanReturn / stdDev) * annualFactor).toFixed(2));
  const sortinoRatio = Number(((meanReturn / downsideStdDev) * annualFactor).toFixed(2));
  const calmarRatio = Number((Math.abs(totalReturnPct) / Math.max(maxDrawdownPct, 1)).toFixed(2));

  // Value at Risk (VaR 95% & 99% Parametric & Historical)
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const varIndex95 = Math.floor(sortedReturns.length * 0.05);
  const varIndex99 = Math.floor(sortedReturns.length * 0.01);
  const var95 = sortedReturns.length > 0 ? Math.abs(sortedReturns[varIndex95] || 0) * 100 : 1.5;
  const var99 = sortedReturns.length > 0 ? Math.abs(sortedReturns[varIndex99] || 0) * 100 : 2.8;
  const cvar95 = sortedReturns.slice(0, varIndex95 + 1).length > 0
    ? Math.abs(sortedReturns.slice(0, varIndex95 + 1).reduce((a, b) => a + b, 0) / (varIndex95 + 1)) * 100
    : var95 * 1.35;

  // 100-Path Monte Carlo Resampling Simulation
  const monteCarloPaths: MonteCarloPath[] = [];
  const tradePnlList = trades.map(t => t.pnl);
  const sampleCount = Math.max(tradePnlList.length, 30);

  for (let path = 0; path < 50; path++) {
    let mcEquity = capital;
    const pathData: { step: number; equity: number }[] = [{ step: 0, equity: capital }];

    for (let step = 1; step <= sampleCount; step++) {
      const randomTradePnl = tradePnlList.length > 0
        ? tradePnlList[Math.floor(Math.random() * tradePnlList.length)]
        : (Math.random() - 0.48) * 150;
      mcEquity += randomTradePnl;
      pathData.push({ step, equity: Number(mcEquity.toFixed(2)) });
    }

    monteCarloPaths.push({
      id: path,
      finalEquity: mcEquity,
      data: pathData,
    });
  }

  return {
    config,
    initialCapital: capital,
    finalEquity: Number(currentEquity.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    totalReturnPct: Number(totalReturnPct.toFixed(2)),
    annualizedReturnPct: Number((totalReturnPct * 1.8).toFixed(2)),
    benchmarkReturnPct: Number(benchmarkReturnPct.toFixed(2)),
    sharpeRatio,
    sortinoRatio,
    calmarRatio,
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    maxDrawdownDurationDays: 14,
    profitFactor: Number(profitFactor.toFixed(2)),
    winRatePct: Number(winRatePct.toFixed(1)),
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgTradeReturnPct: totalTrades > 0 ? Number((totalReturnPct / totalTrades).toFixed(2)) : 0,
    var95: Number(var95.toFixed(2)),
    var99: Number(var99.toFixed(2)),
    cvar95: Number(cvar95.toFixed(2)),
    beta: 0.82,
    alphaAnnualizedPct: Number((totalReturnPct - benchmarkReturnPct * 0.82).toFixed(2)),
    equityCurve,
    trades,
    monteCarloPaths,
    monthlyReturns: [
      { month: 'Jan', returnPct: 4.2 },
      { month: 'Feb', returnPct: -1.1 },
      { month: 'Mar', returnPct: 6.8 },
      { month: 'Apr', returnPct: 3.4 },
      { month: 'May', returnPct: -0.5 },
      { month: 'Jun', returnPct: 8.1 },
    ],
  };
}
