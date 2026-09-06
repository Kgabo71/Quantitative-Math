import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingDown, 
  PieChart, 
  Layers, 
  Sliders, 
  Zap, 
  Flame, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { UserProfile, PositionRisk, StressScenario } from '../../types';
import { soundEngine } from '../../utils/quantEngine';

interface RiskDashboardViewProps {
  user: UserProfile;
  positions: PositionRisk[];
  isDark: boolean;
}

export const RiskDashboardView: React.FC<RiskDashboardViewProps> = ({
  user,
  positions,
  isDark,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-crypto-crash');

  const defaultPositions: PositionRisk[] = positions.length > 0 ? positions : [
    {
      symbol: 'US30',
      side: 'LONG',
      amount: 1.0,
      entryPrice: 40820,
      markPrice: 40850.20,
      notionalUsd: 40850,
      unrealizedPnl: 30.20,
      unrealizedPnlPct: 0.74,
      delta: 1.0,
      gamma: 0.0000,
      liquidationPrice: 38200,
      stopLossPrice: 40500,
      takeProfitPrice: 41350
    },
    {
      symbol: 'NAS100',
      side: 'LONG',
      amount: 2.0,
      entryPrice: 19810.00,
      markPrice: 19840.50,
      notionalUsd: 39681,
      unrealizedPnl: 61.00,
      unrealizedPnlPct: 1.54,
      delta: 2.0,
      gamma: 0.0001,
      liquidationPrice: 18400,
      stopLossPrice: 19650,
      takeProfitPrice: 20200
    },
    {
      symbol: 'XAU/USD',
      side: 'LONG',
      amount: 15.0,
      entryPrice: 2492.50,
      markPrice: 2498.80,
      notionalUsd: 37482,
      unrealizedPnl: 94.50,
      unrealizedPnlPct: 2.53,
      delta: 15.0,
      gamma: 0.0000,
      liquidationPrice: 2320,
      stopLossPrice: 2470,
      takeProfitPrice: 2540
    }
  ];

  const totalNotional = defaultPositions.reduce((acc, p) => acc + p.notionalUsd, 0);
  const totalUnrealizedPnl = defaultPositions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
  const grossLeverage = Number((totalNotional / (user.balanceUsd || 100000)).toFixed(2));
  const marginUsagePct = Math.min(100, Number(((totalNotional * 0.15) / (user.balanceUsd || 100000) * 100).toFixed(1)));

  // Value at Risk Calculations (1-day horizon, 95% and 99%)
  const portfolioDailyVol = 0.019; // 1.9% daily portfolio volatility
  const var95Usd = Math.round(totalNotional * 1.645 * portfolioDailyVol);
  const var99Usd = Math.round(totalNotional * 2.326 * portfolioDailyVol);
  const cvar95Usd = Math.round(var95Usd * 1.35);

  const stressScenarios: StressScenario[] = [
    {
      id: 'scenario-tech-crash',
      name: 'Nasdaq Tech Selloff & VIX Spike',
      description: 'Major megacap tech correction with Nasdaq dropping -6.5% and flight into safe haven Gold.',
      assetShockPct: { 'NAS100': -6.5, 'US30': -3.2, 'XAU/USD': 2.8, 'SPY': -3.5 },
      volatilityShockPct: 120,
      spreadMultiplier: 3.5,
      estimatedPortfolioImpactPct: -2.3,
      estimatedLossUsd: Math.round(totalNotional * 0.023)
    },
    {
      id: 'scenario-rate-shock',
      name: 'Hawkish Fed Rate Shock (+75bps)',
      description: 'Surprise rate hike surge in 10-Yr Real Yields pressurizing Gold and High-Beta Tech.',
      assetShockPct: { 'XAU/USD': -3.8, 'NAS100': -4.5, 'US30': -2.4, 'SPY': -2.1 },
      volatilityShockPct: 75,
      spreadMultiplier: 2.5,
      estimatedPortfolioImpactPct: -3.6,
      estimatedLossUsd: Math.round(totalNotional * 0.036)
    },
    {
      id: 'scenario-safe-haven',
      name: 'Geopolitical Risk Flight-to-Quality',
      description: 'Surge in physical gold bullion demand with equity index drawdown across Wall Street.',
      assetShockPct: { 'XAU/USD': 5.5, 'US30': -2.1, 'NAS100': -2.8, 'EUR/USD': -1.2 },
      volatilityShockPct: 85,
      spreadMultiplier: 3.0,
      estimatedPortfolioImpactPct: 0.9,
      estimatedLossUsd: 0
    },
    {
      id: 'scenario-ny-open-squeeze',
      name: '09:30 AM NY Open Liquidity Expansion',
      description: 'Bullish opening bell momentum sweep across US30 and Nasdaq 100 with massive order flow volume.',
      assetShockPct: { 'US30': 2.2, 'NAS100': 3.1, 'XAU/USD': 0.8 },
      volatilityShockPct: 40,
      spreadMultiplier: 1.2,
      estimatedPortfolioImpactPct: 2.1,
      estimatedLossUsd: 0
    }
  ];

  const activeScenario = stressScenarios.find(s => s.id === selectedScenarioId) || stressScenarios[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Risk Management & Exposure Cockpit
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Real-time Value-at-Risk (VaR), stress scenario simulation, liquidation monitoring, and leverage controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
            marginUsagePct < 50
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
              : 'bg-amber-950/60 border-amber-800 text-amber-400'
          }`}>
            <ShieldCheck className="h-4 w-4" />
            <span>Risk State: {marginUsagePct < 50 ? 'HEALTHY' : 'ELEVATED'}</span>
          </span>
        </div>
      </div>

      {/* Top 4 KPI Cards: VaR 95%, VaR 99%, CVaR, Leverage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } shadow-xl`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            1-Day Parametric VaR (95%)
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-400 mt-1">
            -${var95Usd.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {((var95Usd / totalNotional) * 100).toFixed(2)}% of Portfolio Notional
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } shadow-xl`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            1-Day Extreme VaR (99%)
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-500 mt-1">
            -${var99Usd.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {((var99Usd / totalNotional) * 100).toFixed(2)}% 99% Conf. Loss
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } shadow-xl`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Expected Shortfall (CVaR 95%)
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1">
            -${cvar95Usd.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            Conditional Tail Expectation
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } shadow-xl`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Gross Leverage & Margin
          </div>
          <div className="text-2xl font-extrabold font-mono text-cyan-400 mt-1">
            {grossLeverage}x
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${marginUsagePct > 70 ? 'bg-rose-500' : 'bg-cyan-500'}`}
              style={{ width: `${marginUsagePct}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Margin Used: {marginUsagePct}%
          </div>
        </div>
      </div>

      {/* Stress Testing Scenario Simulator */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } shadow-xl`}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Flame className="h-5 w-5 text-rose-400" />
          <h3 className="text-base font-bold text-slate-100">
            Macro Crisis & Tail Risk Stress Testing Engine
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          {stressScenarios.map((scenario) => {
            const isSel = selectedScenarioId === scenario.id;
            return (
              <button
                key={scenario.id}
                id={`stress-scenario-${scenario.id}`}
                onClick={() => setSelectedScenarioId(scenario.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSel
                    ? 'bg-rose-950/40 border-rose-500 text-rose-300 shadow-md shadow-rose-950'
                    : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-slate-100 mb-1">
                  {scenario.name}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2 mb-2">
                  {scenario.description}
                </div>
                <div className="text-xs font-mono font-bold text-rose-400">
                  Est. Impact: {scenario.estimatedPortfolioImpactPct}%
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Scenario Breakdown */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Estimated Loss ($)</span>
            <div className="text-xl font-extrabold font-mono text-rose-400 mt-0.5">
              -${activeScenario.estimatedLossUsd.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Volatility Surge</span>
            <div className="text-xl font-extrabold font-mono text-amber-400 mt-0.5">
              +{activeScenario.volatilityShockPct}%
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Spread Widening</span>
            <div className="text-xl font-extrabold font-mono text-slate-200 mt-0.5">
              {activeScenario.spreadMultiplier}x Normal Spread
            </div>
          </div>
        </div>
      </div>

      {/* Position Level Risk & Liquidation Distances */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } shadow-xl`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">
              Live Position Greeks & Liquidation Guard
            </h3>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Total Notional: ${totalNotional.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5">Asset / Side</th>
                <th>Mark Price</th>
                <th>Notional ($)</th>
                <th>Unrealized PnL</th>
                <th>Delta</th>
                <th>Liquidation Price</th>
                <th>Stop Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {defaultPositions.map((pos, idx) => {
                const isLong = pos.side === 'LONG';
                const distToLiqPct = Math.abs(((pos.markPrice - pos.liquidationPrice) / pos.markPrice) * 100).toFixed(1);

                return (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3">
                      <div className="flex items-center gap-2 font-sans font-bold text-slate-200">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isLong ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {pos.side}
                        </span>
                        <span>{pos.symbol}</span>
                      </div>
                    </td>
                    <td className="text-slate-300 font-semibold">${pos.markPrice.toLocaleString()}</td>
                    <td className="text-slate-300">${pos.notionalUsd.toLocaleString()}</td>
                    <td className={`font-bold ${pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toLocaleString()} ({pos.unrealizedPnlPct}%)
                    </td>
                    <td className="text-slate-400">{pos.delta}</td>
                    <td className="text-amber-400 font-bold">
                      ${pos.liquidationPrice.toLocaleString()} ({distToLiqPct}% buffer)
                    </td>
                    <td className="text-rose-400">
                      ${pos.stopLossPrice?.toLocaleString() || 'None'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
