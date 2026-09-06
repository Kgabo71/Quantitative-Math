import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  BarChart2, 
  PieChart, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Zap,
  Bot,
  Sliders,
  DollarSign
} from 'lucide-react';
import { 
  BacktestConfig, 
  BacktestResult, 
  StrategyType, 
  MarketTicker 
} from '../../types';
import { generateCandles, runBacktest, soundEngine } from '../../utils/quantEngine';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area, 
  ReferenceLine 
} from 'recharts';

interface BacktesterViewProps {
  tickers: MarketTicker[];
  isDark: boolean;
  onNavigateToTutor: (topic: string) => void;
}

export const BacktesterView: React.FC<BacktesterViewProps> = ({
  tickers,
  isDark,
  onNavigateToTutor,
}) => {
  const [config, setConfig] = useState<BacktestConfig>({
    strategyType: 'mean_reversion_bollinger',
    symbol: 'BTC/USDT',
    startDate: '2025-01-01',
    endDate: '2026-09-01',
    initialCapital: 100000,
    leverage: 1,
    makerFeeBps: 2,
    takerFeeBps: 6,
    slippageBps: 4,
    stopLossPct: 3.5,
    takeProfitPct: 7.0,
    lookbackPeriod: 20,
    zScoreThreshold: 2.0,
    fastEma: 12,
    slowEma: 50,
    atrMultiplier: 2.5,
    positionSizing: 'kelly',
  });

  const [activeTab, setActiveTab] = useState<'equity' | 'drawdown' | 'monte_carlo' | 'trades'>('equity');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [aiAuditLoading, setAiAuditLoading] = useState<boolean>(false);
  const [aiAuditResult, setAiAuditResult] = useState<any>(null);

  // Initial backtest result
  const [result, setResult] = useState<BacktestResult>(() => {
    const candles = generateCandles(68420, 150, 0.45, 0.12);
    return runBacktest(candles, {
      strategyType: 'mean_reversion_bollinger',
      symbol: 'BTC/USDT',
      startDate: '2025-01-01',
      endDate: '2026-09-01',
      initialCapital: 100000,
      leverage: 1,
      makerFeeBps: 2,
      takerFeeBps: 6,
      slippageBps: 4,
      stopLossPct: 3.5,
      takeProfitPct: 7.0,
      lookbackPeriod: 20,
      zScoreThreshold: 2.0,
      fastEma: 12,
      slowEma: 50,
      atrMultiplier: 2.5,
      positionSizing: 'kelly',
    });
  });

  const handleRunBacktest = () => {
    setIsRunning(true);
    setAiAuditResult(null);

    setTimeout(() => {
      const ticker = tickers.find(t => t.symbol === config.symbol);
      const basePrice = ticker?.price || 68420;
      const candles = generateCandles(basePrice, 180, 0.40, 0.08);
      const res = runBacktest(candles, config);
      setResult(res);
      setIsRunning(false);
      soundEngine.playAlert('success');
    }, 400);
  };

  // Call Gemini AI Strategy Auditor
  const handleAiAudit = async () => {
    setAiAuditLoading(true);
    try {
      const response = await fetch('/api/gemini/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyType: config.strategyType,
          assetClass: config.symbol,
          riskTolerance: config.leverage > 2 ? 'Aggressive / High Leverage' : 'Moderate Institutional',
          lookbackPeriod: config.lookbackPeriod,
          stopLossPct: config.stopLossPct,
          targetReturn: result.totalReturnPct,
        }),
      });
      const data = await response.json();
      setAiAuditResult(data);
      soundEngine.playAlert('fill');
    } catch (e) {
      console.error('Failed AI audit:', e);
    } finally {
      setAiAuditLoading(false);
    }
  };

  const strategies: { id: StrategyType; name: string; desc: string }[] = [
    { id: 'mean_reversion_bollinger', name: 'Statistical Mean Reversion (Bollinger + RSI)', desc: 'Contrarian signal entering on 2.0σ price extension with oversold RSI.' },
    { id: 'dual_ema_crossover', name: 'Dual Exponential Moving Average Trend', desc: 'Systematic trend following with Golden/Death cross filters.' },
    { id: 'volatility_breakout_atr', name: 'Donchian Volatility Channel Breakout', desc: 'Enters on multi-day range expansions with ATR trailing stops.' },
    { id: 'market_making_avellaneda', name: 'Avellaneda-Stoikov Market Making', desc: 'High-frequency inventory-skewed quoting model.' },
    { id: 'pairs_trading_stat_arb', name: 'Cointegrated Pairs Stat-Arb', desc: 'Stationary spread trading with dynamic hedge ratio.' },
    { id: 'ml_momentum_factor', name: 'Cross-Sectional ML Factor Momentum', desc: 'Multi-factor risk parity momentum weighting.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FlaskConical className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Quantitative Strategy Backtesting Engine
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Event-driven simulation with friction (maker/taker fees & slippage), Monte Carlo robustness paths, and Gemini AI risk audit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="run-backtest-btn"
            disabled={isRunning}
            onClick={handleRunBacktest}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all cursor-pointer ${
              isRunning
                ? 'bg-slate-700 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
            }`}
          >
            <Play className="h-4 w-4 fill-white" />
            <span>{isRunning ? 'Simulating Engine...' : 'Run Quantitative Backtest'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Performance Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Strategy Configuration */}
        <div className="lg:col-span-4 space-y-5">
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-xl space-y-4`}>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Settings className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Strategy & Model Parameters
              </h3>
            </div>

            {/* Strategy Class Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Strategy Algorithm
              </label>
              <select
                id="backtest-strategy-select"
                value={config.strategyType}
                onChange={(e) => setConfig({ ...config, strategyType: e.target.value as StrategyType })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Asset Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Target Asset
                </label>
                <select
                  value={config.symbol}
                  onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {tickers.map((t) => (
                    <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Position Sizing
                </label>
                <select
                  value={config.positionSizing}
                  onChange={(e) => setConfig({ ...config, positionSizing: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="kelly">Kelly Criterion (Optimal)</option>
                  <option value="volatility_parity">Volatility Parity (ATR)</option>
                  <option value="fixed">Fixed Capital %</option>
                </select>
              </div>
            </div>

            {/* Initial Capital & Leverage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Initial Capital ($)
                </label>
                <input
                  type="number"
                  value={config.initialCapital}
                  onChange={(e) => setConfig({ ...config, initialCapital: parseFloat(e.target.value) || 10000 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Leverage ({config.leverage}x)
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={config.leverage}
                  onChange={(e) => setConfig({ ...config, leverage: parseInt(e.target.value) })}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-2"
                />
              </div>
            </div>

            {/* Risk Exits: Stop Loss & Take Profit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Stop Loss</span>
                  <span className="text-rose-400 font-mono">{config.stopLossPct}%</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={config.stopLossPct}
                  onChange={(e) => setConfig({ ...config, stopLossPct: parseFloat(e.target.value) })}
                  className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Take Profit</span>
                  <span className="text-emerald-400 font-mono">{config.takeProfitPct}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={0.5}
                  value={config.takeProfitPct}
                  onChange={(e) => setConfig({ ...config, takeProfitPct: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Friction: Slippage & Fees */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Realistic Market Friction
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px]">Taker Fee:</span>
                  <div className="font-mono text-slate-300 font-semibold">{config.takerFeeBps} bps (0.06%)</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Slippage:</span>
                  <div className="font-mono text-slate-300 font-semibold">{config.slippageBps} bps (0.04%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 8 Cols: Comprehensive Performance Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Net Return</div>
              <div className={`text-xl font-extrabold font-mono mt-0.5 ${
                result.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {result.totalReturnPct >= 0 ? '+' : ''}{result.totalReturnPct}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                ${result.netProfit.toLocaleString()} PnL
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="text-[10px] uppercase font-bold text-slate-400">Sharpe Ratio</div>
              <div className="text-xl font-extrabold font-mono mt-0.5 text-cyan-400">
                {result.sharpeRatio}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Sortino: {result.sortinoRatio}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="text-[10px] uppercase font-bold text-slate-400">Max Drawdown</div>
              <div className="text-xl font-extrabold font-mono mt-0.5 text-rose-400">
                -{result.maxDrawdownPct}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Calmar: {result.calmarRatio}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="text-[10px] uppercase font-bold text-slate-400">Win Rate / PF</div>
              <div className="text-xl font-extrabold font-mono mt-0.5 text-amber-400">
                {result.winRatePct}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Profit Factor: {result.profitFactor}
              </div>
            </div>
          </div>

          {/* Visualizations Container with Tabs */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-xl`}>
            {/* Chart Sub-Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  id="tab-chart-equity"
                  onClick={() => setActiveTab('equity')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'equity' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Equity vs Benchmark
                </button>
                <button
                  id="tab-chart-drawdown"
                  onClick={() => setActiveTab('drawdown')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'drawdown' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Underwater Drawdown
                </button>
                <button
                  id="tab-chart-montecarlo"
                  onClick={() => setActiveTab('monte_carlo')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'monte_carlo' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Monte Carlo Fan (50 Paths)
                </button>
                <button
                  id="tab-chart-trades"
                  onClick={() => setActiveTab('trades')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'trades' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Trades Log ({result.totalTrades})
                </button>
              </div>

              {/* Gemini AI Strategy Auditor Trigger */}
              <button
                id="audit-strategy-btn"
                disabled={aiAuditLoading}
                onClick={handleAiAudit}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-bold transition-colors cursor-pointer"
              >
                <Bot className="h-4 w-4" />
                <span>{aiAuditLoading ? 'Analyzing Risk...' : 'Audit Strategy with AI'}</span>
              </button>
            </div>

            {/* Active Chart Display */}
            <div className="h-72 w-full">
              {activeTab === 'equity' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.equityCurve}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="equity" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} strokeWidth={2} name="Strategy Capital ($)" />
                    <Line type="monotone" dataKey="benchmarkEquity" stroke="#64748b" strokeDasharray="3 3" dot={false} name="Buy & Hold Benchmark ($)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'drawdown' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.equityCurve}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} domain={['auto', 0]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="drawdownPct" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} strokeWidth={2} name="Drawdown Depth (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'monte_carlo' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <XAxis dataKey="step" stroke="#64748b" fontSize={10} type="number" domain={[0, 'dataMax']} />
                    <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    {result.monteCarloPaths.slice(0, 35).map((path) => (
                      <Line
                        key={path.id}
                        data={path.data}
                        type="monotone"
                        dataKey="equity"
                        stroke={path.finalEquity > config.initialCapital ? '#22c55e' : '#ef4444'}
                        strokeOpacity={0.25}
                        strokeWidth={1}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))}
                    <ReferenceLine y={config.initialCapital} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Initial Capital', fill: '#f59e0b', fontSize: 10 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'trades' && (
                <div className="h-full overflow-y-auto font-mono text-xs pr-2">
                  <table className="w-full text-left">
                    <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2">Side</th>
                        <th>Entry</th>
                        <th>Exit</th>
                        <th>Amount</th>
                        <th>PnL ($)</th>
                        <th>Return</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {result.trades.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-800/40">
                          <td className={`py-1.5 font-bold ${t.type === 'BUY_LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.type === 'BUY_LONG' ? 'LONG' : 'SHORT'}
                          </td>
                          <td className="text-slate-300">${t.entryPrice.toLocaleString()}</td>
                          <td className="text-slate-300">${t.exitPrice.toLocaleString()}</td>
                          <td className="text-slate-400">{t.amount}</td>
                          <td className={`font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.pnl >= 0 ? '+' : ''}${t.pnl.toLocaleString()}
                          </td>
                          <td className={`font-bold ${t.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct}%
                          </td>
                          <td className="text-slate-500 uppercase text-[10px]">{t.reason.replace('_', ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AI Audit Report Modal / Card */}
            {aiAuditResult && (
              <div className="mt-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <Sparkles className="h-4 w-4" />
                  <span>Gemini Quant Audit & Alpha Breakdown</span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed">
                  <p className="font-semibold text-cyan-300 mb-1">
                    Strategy: {aiAuditResult.strategyName || 'Quantitative Model'}
                  </p>
                  <p className="text-slate-300 mb-2">
                    {aiAuditResult.alphaHypothesis || aiAuditResult.raw}
                  </p>
                  {aiAuditResult.riskAssessment && (
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300">
                      <span className="font-bold">Risk Assessment: </span>
                      {aiAuditResult.riskAssessment}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
