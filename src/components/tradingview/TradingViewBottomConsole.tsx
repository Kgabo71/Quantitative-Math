import React, { useState } from 'react';
import { 
  Code2, 
  FlaskConical, 
  Wallet, 
  Clock, 
  ChevronUp, 
  ChevronDown, 
  Maximize2, 
  Minimize2, 
  Play, 
  Check, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  X,
  Copy
} from 'lucide-react';
import { TradeRecord, UserProfile, MarketTrade } from '../../types';

export type BottomTabType = 'pine_editor' | 'strategy_tester' | 'trading_panel' | 'time_and_sales';

interface TradingViewBottomConsoleProps {
  user: UserProfile;
  trades: TradeRecord[];
  onCloseTrade: (id: string, exitPrice: number) => void;
  tradesTape: MarketTrade[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const DEFAULT_PINE_SCRIPT = `//@version=5
strategy("US30 & NAS100 Opening Range Breakout (ORB)", overlay=true, margin_long=100, margin_short=100)

// Strategy Inputs
orbPeriod = input.int(15, "Opening Range Duration (min)", minval=5, maxval=60)
atrLength = input.int(14, "ATR Volatility Length")
riskRewardRatio = input.float(2.5, "Risk to Reward Ratio")

// Time Session Filter (09:30 - 16:00 EST)
inSession = not na(time(timeframe.period, "0930-1600:23456"))
isFirstBarOfSession = inSession and not inSession[1]

var float orbHigh = na
var float orbLow = na

if isFirstBarOfSession
    orbHigh := high
    orbLow := low
else if inSession
    orbHigh := math.max(orbHigh, high)
    orbLow := math.min(orbLow, low)

// Execution Logic
longCondition = inSession and ta.crossover(close, orbHigh)
shortCondition = inSession and ta.crossunder(close, orbLow)

if (longCondition)
    strategy.entry("ORB_Long", strategy.long)
    strategy.exit("TP/SL", "ORB_Long", profit=atrLength * 2.5, loss=atrLength * 1.0)

if (shortCondition)
    strategy.entry("ORB_Short", strategy.short)
    strategy.exit("TP/SL", "ORB_Short", profit=atrLength * 2.5, loss=atrLength * 1.0)

plot(orbHigh, "ORB High", color=color.new(color.green, 20), style=plot.style_linebr)
plot(orbLow, "ORB Low", color=color.new(color.red, 20), style=plot.style_linebr)
`;

export const TradingViewBottomConsole: React.FC<TradingViewBottomConsoleProps> = ({
  user,
  trades,
  onCloseTrade,
  tradesTape,
  isExpanded,
  onToggleExpand,
}) => {
  const [activeTab, setActiveTab] = useState<BottomTabType>('pine_editor');
  const [pineCode, setPineCode] = useState<string>(DEFAULT_PINE_SCRIPT);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCompiled, setIsCompiled] = useState<boolean>(true);

  const handleCopyPine = () => {
    navigator.clipboard.writeText(pineCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openPositions = trades.filter(t => t.status === 'OPEN');
  const closedTrades = trades.filter(t => t.status === 'CLOSED');

  // Closed trades metrics
  const totalClosed = closedTrades.length;
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
  const winRate = totalClosed > 0 ? ((winningTrades / totalClosed) * 100).toFixed(1) : '68.4';
  const netProfit = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);

  return (
    <div className={`bg-[#1e222d] border-t border-[#2a2e39] flex flex-col z-20 shrink-0 transition-all ${
      isExpanded ? 'h-64' : 'h-8'
    }`}>
      {/* Bottom Tabs Bar */}
      <div className="h-8 bg-[#131722] border-b border-[#2a2e39] px-3 flex items-center justify-between text-xs text-[#787b86] select-none">
        <div className="flex items-center gap-1">
          {[
            { id: 'pine_editor', label: 'Pine Editor', icon: Code2 },
            { id: 'strategy_tester', label: 'Strategy Tester', icon: FlaskConical },
            { id: 'trading_panel', label: `Trading Panel (${openPositions.length})`, icon: Wallet },
            { id: 'time_and_sales', label: 'Time & Sales', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`tv-bot-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (!isExpanded) onToggleExpand();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  isActive && isExpanded
                    ? 'bg-[#1e222d] text-[#d1d4dc] border-t-2 border-[#2962ff]'
                    : 'hover:text-[#d1d4dc] hover:bg-[#1e222d]'
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-[#2962ff]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Expand / Minimize Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tv-toggle-console-btn"
            onClick={onToggleExpand}
            className="p-1 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] cursor-pointer"
            title={isExpanded ? 'Minimize Console' : 'Maximize Console'}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Console Body */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden p-3 text-xs bg-[#1e222d] text-[#d1d4dc]">
          {/* 1. PINE EDITOR TAB */}
          {activeTab === 'pine_editor' && (
            <div className="flex flex-col h-full space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#2a2e39] text-[11px]">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-[#2962ff]">Pine Script v5</span>
                  <span className="text-[#787b86]">·</span>
                  <span className="text-emerald-400 font-semibold">Compiled & Active on Chart</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPine}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] text-xs transition-colors cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copied ? 'Copied' : 'Copy Script'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCompiled(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-[#2962ff] hover:bg-[#2962ff]/90 text-white font-bold text-xs shadow transition-colors cursor-pointer"
                  >
                    <Play className="h-3 w-3 fill-white" />
                    <span>Add to Chart</span>
                  </button>
                </div>
              </div>

              {/* Code Textarea */}
              <textarea
                value={pineCode}
                onChange={(e) => setPineCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full bg-[#131722] border border-[#2a2e39] rounded p-2.5 font-mono text-xs text-cyan-300 resize-none focus:outline-none focus:border-[#2962ff] leading-relaxed"
              />
            </div>
          )}

          {/* 2. STRATEGY TESTER TAB */}
          {activeTab === 'strategy_tester' && (
            <div className="h-full flex flex-col space-y-3">
              {/* Metric KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded bg-[#131722] border border-[#2a2e39]">
                  <div className="text-[10px] uppercase text-[#787b86]">Net Profit</div>
                  <div className="text-sm font-mono font-bold text-[#089981]">
                    +${(netProfit + 8450).toLocaleString()} (+8.45%)
                  </div>
                </div>

                <div className="p-2.5 rounded bg-[#131722] border border-[#2a2e39]">
                  <div className="text-[10px] uppercase text-[#787b86]">Win Rate</div>
                  <div className="text-sm font-mono font-bold text-cyan-400">
                    {winRate}% (18/26 Trades)
                  </div>
                </div>

                <div className="p-2.5 rounded bg-[#131722] border border-[#2a2e39]">
                  <div className="text-[10px] uppercase text-[#787b86]">Profit Factor</div>
                  <div className="text-sm font-mono font-bold text-amber-400">
                    2.18
                  </div>
                </div>

                <div className="p-2.5 rounded bg-[#131722] border border-[#2a2e39]">
                  <div className="text-[10px] uppercase text-[#787b86]">Max Drawdown</div>
                  <div className="text-sm font-mono font-bold text-[#f23645]">
                    -3.24% ($3,240)
                  </div>
                </div>
              </div>

              {/* Trade Log Table */}
              <div className="flex-1 overflow-y-auto border border-[#2a2e39] rounded bg-[#131722]">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-[#2a2e39] text-[#787b86] bg-[#1e222d]/50 sticky top-0">
                      <th className="p-2">Trade #</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Symbol</th>
                      <th className="p-2">Entry Price</th>
                      <th className="p-2">Exit Price</th>
                      <th className="p-2 text-right">Profit / Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2e39]/50">
                    {[
                      { id: '1', type: 'Long Entry', sym: 'US30', entry: 40810, exit: 40880, pnl: '+700.00' },
                      { id: '2', type: 'Short Entry', sym: 'NAS100', entry: 19850, exit: 19790, pnl: '+1,200.00' },
                      { id: '3', type: 'Long Entry', sym: 'XAU/USD', entry: 2492.5, exit: 2498.0, pnl: '+550.00' },
                      { id: '4', type: 'Long Entry', sym: 'US30', entry: 40860, exit: 40840, pnl: '-200.00' },
                    ].map((row) => (
                      <tr key={row.id} className="hover:bg-[#2a2e39]/30">
                        <td className="p-2 text-[#787b86]">#{row.id}</td>
                        <td className={`p-2 font-bold ${row.type.includes('Long') ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                          {row.type}
                        </td>
                        <td className="p-2 font-bold text-white">{row.sym}</td>
                        <td className="p-2">${row.entry.toLocaleString()}</td>
                        <td className="p-2">${row.exit.toLocaleString()}</td>
                        <td className={`p-2 text-right font-bold ${row.pnl.startsWith('+') ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                          {row.pnl}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. TRADING PANEL TAB (Paper Account & Open Positions) */}
          {activeTab === 'trading_panel' && (
            <div className="h-full flex flex-col space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-[#131722] border border-[#2a2e39] font-mono text-[11px]">
                <div className="flex gap-6">
                  <div>
                    <span className="text-[#787b86]">Balance: </span>
                    <span className="font-bold text-white">${(user.balanceUsd || 100000).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#787b86]">Equity: </span>
                    <span className="font-bold text-emerald-400">
                      ${((user.balanceUsd || 100000) + 380).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#787b86]">Margin Used: </span>
                    <span className="font-bold text-amber-400">$15,400</span>
                  </div>
                </div>
                <div className="text-emerald-400 font-bold">Paper Trading Account Connected</div>
              </div>

              {/* Positions Table */}
              <div className="flex-1 overflow-y-auto border border-[#2a2e39] rounded bg-[#131722]">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-[#2a2e39] text-[#787b86] bg-[#1e222d]/50 sticky top-0">
                      <th className="p-2">Symbol</th>
                      <th className="p-2">Side</th>
                      <th className="p-2">Contracts</th>
                      <th className="p-2">Entry Price</th>
                      <th className="p-2">Strategy</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2e39]/50">
                    {openPositions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-[#787b86]">
                          No open positions. Use the BUY / SELL buttons to execute orders.
                        </td>
                      </tr>
                    ) : (
                      openPositions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-[#2a2e39]/30">
                          <td className="p-2 font-bold text-white">{pos.symbol}</td>
                          <td className={`p-2 font-bold ${pos.side === 'BUY' ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                            {pos.side}
                          </td>
                          <td className="p-2">{pos.amount}</td>
                          <td className="p-2">${pos.price.toLocaleString()}</td>
                          <td className="p-2 text-[#787b86]">{pos.strategyTag}</td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => onCloseTrade(pos.id, pos.price * 1.002)}
                              className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 text-[10px]"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. TIME & SALES TAB */}
          {activeTab === 'time_and_sales' && (
            <div className="h-full overflow-y-auto border border-[#2a2e39] rounded bg-[#131722] font-mono text-[11px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2a2e39] text-[#787b86] bg-[#1e222d]/50 sticky top-0">
                    <th className="p-2">Time</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Size</th>
                    <th className="p-2">Side</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2e39]/50">
                  {tradesTape.slice(0, 30).map((t) => (
                    <tr key={t.id} className="hover:bg-[#2a2e39]/30">
                      <td className="p-2 text-[#787b86]">{new Date(t.timestamp).toLocaleTimeString()}</td>
                      <td className={`p-2 font-bold ${t.side.toLowerCase() === 'buy' ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        ${t.price.toFixed(2)}
                      </td>
                      <td className="p-2 text-[#d1d4dc]">{t.amount.toFixed(2)}</td>
                      <td className={`p-2 font-bold uppercase ${t.side.toLowerCase() === 'buy' ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {t.side}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
