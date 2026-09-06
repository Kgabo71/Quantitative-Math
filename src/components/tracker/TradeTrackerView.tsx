import React, { useState } from 'react';
import { 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Tag, 
  FileText, 
  DollarSign, 
  Sliders, 
  Activity,
  Layers
} from 'lucide-react';
import { TradeRecord, UserProfile, MarketTicker } from '../../types';
import { soundEngine } from '../../utils/quantEngine';

interface TradeTrackerViewProps {
  user: UserProfile;
  tickers: MarketTicker[];
  trades: TradeRecord[];
  onAddTrade: (trade: Omit<TradeRecord, 'id' | 'createdAt'>) => void;
  onCloseTrade: (tradeId: string) => void;
  isDark: boolean;
}

export const TradeTrackerView: React.FC<TradeTrackerViewProps> = ({
  user,
  tickers,
  trades,
  onAddTrade,
  onCloseTrade,
  isDark,
}) => {
  const [symbol, setSymbol] = useState<string>('BTC/USDT');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_MARKET'>('MARKET');
  const [amountUsd, setAmountUsd] = useState<number>(2500);
  const [strategyTag, setStrategyTag] = useState<string>('StatArb Pairs');
  const [notes, setNotes] = useState<string>('Mean reversion deviation above 2.2 sigma.');

  const currentTicker = tickers.find(t => t.symbol === symbol) || tickers[0];

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const price = currentTicker.price;
    const amount = amountUsd / price;

    onAddTrade({
      symbol,
      side,
      orderType,
      price,
      amount: Number(amount.toFixed(4)),
      totalUsd: amountUsd,
      status: 'OPEN',
      strategyTag,
      notes,
    });

    soundEngine.playAlert('fill');
    setNotes('');
  };

  const openTrades = trades.filter(t => t.status === 'OPEN');
  const closedTrades = trades.filter(t => t.status === 'CLOSED');

  const totalRealizedPnl = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const winningClosed = closedTrades.filter(t => (t.pnl || 0) > 0);
  const winRate = closedTrades.length > 0 ? ((winningClosed.length / closedTrades.length) * 100).toFixed(1) : '0.0';

  // Export trade journal to CSV
  const handleExportCsv = () => {
    const headers = 'ID,Symbol,Side,OrderType,Price,Amount,TotalUSD,Status,PnL,StrategyTag,Notes,CreatedAt\n';
    const rows = trades.map(t => 
      `"${t.id}","${t.symbol}","${t.side}","${t.orderType}",${t.price},${t.amount},${t.totalUsd},"${t.status}",${t.pnl || 0},"${t.strategyTag}","${(t.notes || '').replace(/"/g, '""')}","${new Date(t.createdAt).toISOString()}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QuantEdge_Trade_Journal_${Date.now()}.csv`;
    a.click();
    soundEngine.playAlert('success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Personalized Trade Tracking & Paper Journal
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Log active paper trades, record alpha hypotheses, analyze win rates, and export journal analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="export-csv-btn"
            onClick={handleExportCsv}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span>Export Journal (CSV)</span>
          </button>
        </div>
      </div>

      {/* Top 4 Performance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } shadow-xl`}>
          <div className="text-[10px] font-bold uppercase text-slate-400">Total Paper Trades</div>
          <div className="text-2xl font-extrabold font-mono text-slate-100 mt-0.5">
            {trades.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {openTrades.length} Open | {closedTrades.length} Closed
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } shadow-xl`}>
          <div className="text-[10px] font-bold uppercase text-slate-400">Win Rate</div>
          <div className="text-2xl font-extrabold font-mono text-amber-400 mt-0.5">
            {winRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {winningClosed.length} / {closedTrades.length || 1} Wins
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } shadow-xl`}>
          <div className="text-[10px] font-bold uppercase text-slate-400">Realized PnL</div>
          <div className={`text-2xl font-extrabold font-mono mt-0.5 ${
            totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {totalRealizedPnl >= 0 ? '+' : ''}${totalRealizedPnl.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Account Balance: ${user.balanceUsd.toLocaleString()}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } shadow-xl`}>
          <div className="text-[10px] font-bold uppercase text-slate-400">Active Risk Tag</div>
          <div className="text-sm font-extrabold text-cyan-400 mt-1 truncate">
            {strategyTag}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Execution Rule Tracked
          </div>
        </div>
      </div>

      {/* Main Grid: Order Placement on Left, Open & Closed Trades on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Order Placement Console */}
        <div className="lg:col-span-4 space-y-4">
          <form
            onSubmit={handlePlaceOrder}
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } shadow-xl space-y-4`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Execute Paper Trade
              </h3>
              <span className="text-xs font-mono text-cyan-400">
                ${currentTicker.price.toLocaleString()}
              </span>
            </div>

            {/* Asset Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Asset Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {tickers.map(t => (
                  <option key={t.symbol} value={t.symbol}>{t.symbol} (${t.price.toLocaleString()})</option>
                ))}
              </select>
            </div>

            {/* Side: Buy vs Sell */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="trade-side-buy-btn"
                onClick={() => setSide('BUY')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  side === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                BUY (LONG)
              </button>
              <button
                type="button"
                id="trade-side-sell-btn"
                onClick={() => setSide('SELL')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  side === 'SELL'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                SELL (SHORT)
              </button>
            </div>

            {/* Notional Amount ($) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Order Size ($)</label>
              <input
                type="number"
                value={amountUsd}
                onChange={(e) => setAmountUsd(parseFloat(e.target.value) || 100)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex gap-1.5 mt-1.5">
                {[1000, 2500, 5000, 10000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountUsd(amt)}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy Tag */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Quant Strategy Tag</label>
              <select
                value={strategyTag}
                onChange={(e) => setStrategyTag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="StatArb Pairs">StatArb Pairs Trading</option>
                <option value="Trend Following">Dual EMA Trend Following</option>
                <option value="Options Gamma">Options Gamma Scalp</option>
                <option value="Avellaneda MM">Avellaneda-Stoikov Market Making</option>
                <option value="Discretionary">Discretionary Alpha</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Trade Notes & Hypothesis</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Why are you taking this trade? What is the risk/reward?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              id="submit-paper-trade-btn"
              className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all cursor-pointer ${
                side === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              }`}
            >
              Submit {side} Order (${amountUsd.toLocaleString()})
            </button>
          </form>
        </div>

        {/* Right 8 Cols: Open Positions & Execution History */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Open Positions */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-xl`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Active Open Positions ({openTrades.length})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2">Side / Asset</th>
                    <th>Entry Price</th>
                    <th>Current Mark</th>
                    <th>Size</th>
                    <th>Unrealized PnL</th>
                    <th>Strategy</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {openTrades.map((t) => {
                    const mark = tickers.find(tk => tk.symbol === t.symbol)?.price || t.price;
                    const uPnl = t.side === 'BUY'
                      ? (mark - t.price) * t.amount
                      : (t.price - mark) * t.amount;
                    const uPnlPct = ((uPnl / t.totalUsd) * 100).toFixed(2);

                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5">
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] mr-1.5 ${
                            t.side === 'BUY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {t.side}
                          </span>
                          <span className="font-sans font-bold text-slate-200">{t.symbol}</span>
                        </td>
                        <td className="text-slate-300">${t.price.toLocaleString()}</td>
                        <td className="text-slate-300">${mark.toLocaleString()}</td>
                        <td className="text-slate-400">{t.amount}</td>
                        <td className={`font-bold ${uPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {uPnl >= 0 ? '+' : ''}${uPnl.toFixed(2)} ({uPnlPct}%)
                        </td>
                        <td className="text-slate-400 font-sans text-[11px]">{t.strategyTag}</td>
                        <td className="text-right">
                          <button
                            id={`close-trade-${t.id}`}
                            onClick={() => onCloseTrade(t.id)}
                            className="px-2.5 py-1 rounded bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Close Position
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {openTrades.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500 font-sans text-xs">
                        No active open positions. Submit a paper trade from the panel.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Trade Journal */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-xl`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Closed Trade Ledger & Reflections
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {closedTrades.map((t) => (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        t.side === 'BUY' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {t.side}
                      </span>
                      <span className="font-bold text-slate-200 text-sm">{t.symbol}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Entry: ${t.price} | Qty: {t.amount}
                      </span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        {t.strategyTag}
                      </span>
                    </div>
                    {t.notes && (
                      <p className="text-xs text-slate-400 italic mt-0.5">
                        "{t.notes}"
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <div className={`text-base font-extrabold ${
                      (t.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {(t.pnl || 0) >= 0 ? '+' : ''}${(t.pnl || 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              {closedTrades.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No closed trades yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
