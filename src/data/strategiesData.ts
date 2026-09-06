import { TradingStrategy } from '../types';

export const TRADING_STRATEGIES: TradingStrategy[] = [
  {
    id: 'strat-smc-ict',
    name: 'ICT Liquidity Sweep & Fair Value Gap (FVG)',
    category: 'SMC_ICT',
    symbol: 'US30',
    description: 'Capitalizes on institutional market maker liquidity sweeps of previous session highs/lows followed by rapid market structure shifts (MSS) and Fair Value Gap (FVG) retests.',
    timeframe: '5m / 15m',
    winRatePct: 71.4,
    profitFactor: 2.45,
    avgRiskReward: '1:3.2',
    keyIndicators: ['Liquidity Pools (BSL/SSL)', '5m/15m Fair Value Gap', 'Market Structure Shift (CHoCH)', 'Session Open Killzones'],
    executionRules: {
      setupCondition: 'Asian or London high/low is swept with an aggressive wick rejection, indicating institutional stop hunt.',
      triggerEntry: 'Wait for 5m candle to close with Market Structure Break (BOS), leaving an unfilled FVG. Enter limit order at 50% equilibrium of the FVG.',
      stopLossRule: 'Set Stop Loss 1 tick beyond the liquidity sweep extreme wick (absolute structural invalidation).',
      breakEvenRule: 'When price hits +1.0R (first structural hurdle), automatically slide Stop Loss to Entry + 1 point (100% Risk Free).',
      takeProfitRule: 'TP1 (+1.5R): Close 50% partial. TP2 (+2.8R): Close 30% at equal highs/lows. TP3 (+4.5R): Trail remaining 20% along swing structure.',
    },
    pineScriptSnippet: `//@version=5
strategy("ICT FVG & Liquidity Sweep [QuantEdge]", overlay=true, margin_long=100, margin_short=100)
// Detect Fair Value Gaps (FVG)
fvgBull = low > high[2]
fvgBear = high < low[2]
plotshape(fvgBull, title="Bullish FVG", location=location.belowbar, color=color.green, style=shape.labelup, text="FVG")
plotshape(fvgBear, title="Bearish FVG", location=location.abovebar, color=color.red, style=shape.labeldown, text="FVG")`
  },
  {
    id: 'strat-orb-breakout',
    name: 'US30 & NAS100 Opening Range Breakout (ORB)',
    category: 'BREAKOUT_ORB',
    symbol: 'NAS100',
    description: 'High-probability execution based on initial 15-minute price expansion at the 09:30 AM EST New York equity market open.',
    timeframe: '15m / 5m',
    winRatePct: 68.2,
    profitFactor: 2.18,
    avgRiskReward: '1:2.6',
    keyIndicators: ['15m Opening Range High/Low', 'VWAP Alignment', 'Volume Surge > 1.8x', 'Order Flow Imbalance'],
    executionRules: {
      setupCondition: 'Record high and low of the 09:30 - 09:45 AM EST range. Note range width in points.',
      triggerEntry: 'Enter on 5m candle closing completely outside the 15m range in the direction of VWAP with above-average volume.',
      stopLossRule: 'Stop Loss placed at 50% midpoint of the 15m opening range.',
      breakEvenRule: 'Once trade moves +1.0x the initial range width (+1.0R), move Stop Loss directly to break-even.',
      takeProfitRule: 'TP1 (+1.5x range extension): Take 50% profit. TP2 (+2.5x range extension): Take 30% profit. TP3 (+3.5x extension): Final exit.',
    },
    pineScriptSnippet: `//@version=5
strategy("US30 / NAS100 ORB Strategy", overlay=true)
orbHigh = request.security(syminfo.tickerid, "15", high[1])
orbLow  = request.security(syminfo.tickerid, "15", low[1])
plot(orbHigh, "ORB High", color=color.blue, linewidth=2)
plot(orbLow, "ORB Low", color=color.orange, linewidth=2)`
  },
  {
    id: 'strat-ema-trend',
    name: 'Dual EMA Momentum Ribbon & Pullback',
    category: 'TREND_FOLLOWING',
    symbol: 'NAS100',
    description: 'Catches clean intraday trends by identifying macro alignment across 20, 50, and 200 EMAs and entering precisely on shallow pullbacks to the dynamic value zone.',
    timeframe: '5m / 1h',
    winRatePct: 65.8,
    profitFactor: 2.05,
    avgRiskReward: '1:2.8',
    keyIndicators: ['EMA 20', 'EMA 50', 'EMA 200', 'MACD Histogram', 'ADX > 25'],
    executionRules: {
      setupCondition: 'EMA 20 > EMA 50 > EMA 200 with all three sloping upwards, ADX above 25 indicating strong directional momentum.',
      triggerEntry: 'Price retraces into the EMA 20-50 ribbon and prints a bullish rejection candle (hammer / bullish engulfing).',
      stopLossRule: 'Stop Loss placed 2 ticks beneath the swing low or 50 EMA, whichever is lower.',
      breakEvenRule: 'When price retests and breaks past the previous swing high (+1.0R), slide SL to Entry.',
      takeProfitRule: 'TP1 (+1.5R): Close 40%. TP2 (+2.5R): Close 40%. TP3 (+4.0R): Trail using 20 EMA.',
    },
    pineScriptSnippet: `//@version=5
strategy("EMA Ribbon Momentum", overlay=true)
emaFast = ta.ema(close, 20)
emaMed  = ta.ema(close, 50)
emaSlow = ta.ema(close, 200)
plot(emaFast, color=color.green)
plot(emaMed, color=color.yellow)
plot(emaSlow, color=color.red)`
  },
  {
    id: 'strat-gold-mean-rev',
    name: 'Gold (XAU/USD) 2.5σ Statistical Mean Reversion',
    category: 'MEAN_REVERSION',
    symbol: 'XAU/USD',
    description: 'Exploits overextended price impulses in Spot Gold during London/NY fixings using 20-period 2.5-standard-deviation Bollinger Bands combined with RSI momentum divergence.',
    timeframe: '15m / 30m',
    winRatePct: 73.5,
    profitFactor: 2.62,
    avgRiskReward: '1:2.4',
    keyIndicators: ['Bollinger Bands (20, 2.5σ)', 'RSI (14) Divergence', 'Volume Climax', '10Y TIPS Yield Tracking'],
    executionRules: {
      setupCondition: 'Gold price pierces the outer 2.5σ Bollinger Band while RSI(14) enters deep overbought (>75) or oversold (<25) territory.',
      triggerEntry: 'Enter on first candle closing back inside the 2.0σ band with a reversal wick.',
      stopLossRule: 'Stop Loss placed 0.35% ($8.50 on Gold) outside the extreme swing high/low.',
      breakEvenRule: 'When Gold price crosses back to the 20-period moving average (middle band), move SL to Break-Even.',
      takeProfitRule: 'TP1: Middle Bollinger Band (SMA 20). TP2: Opposite 1.5σ band. TP3: Opposite 2.0σ band.',
    },
    pineScriptSnippet: `//@version=5
strategy("Gold 2.5σ Mean Reversion", overlay=true)
[mid, upper, lower] = ta.bb(close, 20, 2.5)
plot(upper, "Upper Band", color=color.purple)
plot(lower, "Lower Band", color=color.purple)`
  },
  {
    id: 'strat-orderflow-ofi',
    name: 'High-Frequency DOM Order Flow Imbalance (OFI)',
    category: 'ORDER_FLOW',
    symbol: 'US30',
    description: 'Institutional scalping strategy driven by real-time Level 2 Depth of Market (DOM) bid/ask book imbalances and rapid market delta divergence.',
    timeframe: '1s / 1m',
    winRatePct: 75.2,
    profitFactor: 2.80,
    avgRiskReward: '1:2.1',
    keyIndicators: ['DOM Bid/Ask Imbalance Ratio > 65%', 'Cumulative Volume Delta (CVD)', 'Microstructure Tape Speed', 'Spread Compression'],
    executionRules: {
      setupCondition: 'Level 2 Depth of Market order book exhibits sustained >65% buy or sell wall imbalance without price slipping backwards.',
      triggerEntry: 'Immediate aggressive market buy/sell order when volume tape prints rapid consecutive sweeps into opposing book.',
      stopLossRule: 'Tight invalidation: 15-20 index points on US30 or $0.75 on Gold.',
      breakEvenRule: 'Move Stop Loss to Break-Even + 1 point the instant position reaches +20 points gain.',
      takeProfitRule: 'TP1 (+25 pts): Secure 60% partial. TP2 (+45 pts): Secure 30%. TP3 (+75 pts): Trail remaining 10%.',
    },
    pineScriptSnippet: `//@version=5
strategy("Order Flow Imbalance Scalper", overlay=false)
imbalance = (volume - volume[1]) / volume
plot(imbalance, "OFI Indicator", color=imbalance > 0 ? color.teal : color.maroon)`
  }
];
