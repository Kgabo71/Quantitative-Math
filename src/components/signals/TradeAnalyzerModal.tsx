import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Bot, 
  Layers, 
  Compass, 
  Scale, 
  Cpu
} from 'lucide-react';
import { TradeSignal, TradeAnalysisReport } from '../../types';
import { generateTradeAnalysis } from '../../utils/botEngine';

interface TradeAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: TradeSignal | null;
  currentPrice: number;
  onExecuteTrade: (signal: TradeSignal) => void;
  isDark: boolean;
}

export const TradeAnalyzerModal: React.FC<TradeAnalyzerModalProps> = ({
  isOpen,
  onClose,
  signal,
  currentPrice,
  onExecuteTrade,
  isDark,
}) => {
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    thesis?: string;
    executionBlueprint?: string[];
    confluenceFactors?: string[];
    invalidationWarning?: string;
    riskScore?: string;
  } | null>(null);

  if (!isOpen || !signal) return null;

  const analysis: TradeAnalysisReport = generateTradeAnalysis(signal, currentPrice);
  const isBuy = signal.direction === 'BUY';

  // Request Deep Gemini AI Trade Execution Analysis
  const handleRequestAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/analyze-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: signal.symbol,
          strategy: signal.strategyName,
          direction: signal.direction,
          currentPrice,
          entryPrice: signal.entryPrice,
          stopLoss: signal.stopLoss,
          breakEvenTrigger: signal.breakEvenPrice,
          tp1: signal.tp1,
          tp2: signal.tp2,
          tp3: signal.tp3,
          confluenceScore: signal.confluenceScore,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
      }
    } catch (e) {
      console.warn('AI analysis request failed, falling back to local quant analytics', e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        id="trade-analyzer-modal"
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-[#2a2e39] bg-[#1e222d]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              isBuy ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
            }`}>
              {isBuy ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono tracking-tight">{signal.symbol} Execution Blueprint</h2>
                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                  isBuy ? 'bg-[#089981]/15 text-[#089981] border border-[#089981]/30' : 'bg-[#f23645]/15 text-[#f23645] border border-[#f23645]/30'
                }`}>
                  {signal.direction}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#2962ff]/15 text-[#2962ff] border border-[#2962ff]/30 font-semibold">
                  {signal.confluenceScore}% Confluence A+
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">{signal.strategyName} · {signal.timeframe} Timeframe</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="request-ai-analysis-btn"
              onClick={handleRequestAiAnalysis}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <Sparkles className={`h-3.5 w-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
              <span>{aiLoading ? 'Analyzing...' : 'Deep Gemini AI Analysis'}</span>
            </button>

            <button
              id="close-trade-analyzer-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700/40 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Core Price Execution Matrix (Entry, SL, BE, TP) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Planned Entry */}
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#1e222d] border-[#2a2e39]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Planned Entry</span>
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <div className="text-lg font-mono font-bold text-cyan-400">
                ${signal.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Current: ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>

            {/* Stop Loss (SL) */}
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#1e222d] border-red-500/30' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between text-red-400 text-xs mb-1">
                <span className="font-semibold">Stop Loss (SL)</span>
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              </div>
              <div className="text-lg font-mono font-bold text-red-400">
                ${signal.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-red-400/80 mt-1 font-mono">
                Risk: -{signal.stopLossPoints} pts (-{((signal.stopLossPoints / signal.entryPrice) * 100).toFixed(2)}%)
              </div>
            </div>

            {/* Break-Even (BE) Trigger Milestone */}
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#1e222d] border-yellow-500/40 shadow-sm shadow-yellow-950/20' : 'bg-yellow-50 border-yellow-300'
            }`}>
              <div className="flex items-center justify-between text-yellow-400 text-xs mb-1">
                <span className="font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-yellow-400" />
                  Break-Even (BE)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-mono font-bold">100% Risk Free</span>
              </div>
              <div className="text-lg font-mono font-bold text-yellow-400">
                ${signal.breakEvenPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-yellow-300/80 mt-1 font-mono">
                Trigger: +{signal.breakEvenPoints} pts (+1.0R)
              </div>
            </div>

            {/* Take Profit 2 (Main Target) */}
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#1e222d] border-[#089981]/40' : 'bg-emerald-50 border-emerald-300'
            }`}>
              <div className="flex items-center justify-between text-[#089981] text-xs mb-1">
                <span className="font-semibold">Take Profit (TP2)</span>
                <Target className="h-3.5 w-3.5 text-[#089981]" />
              </div>
              <div className="text-lg font-mono font-bold text-[#089981]">
                ${signal.tp2.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-[#089981] mt-1 font-mono">
                R:R {signal.riskRewardRatio}:1 (+{Math.abs(signal.tp2 - signal.entryPrice).toFixed(1)} pts)
              </div>
            </div>
          </div>

          {/* 2. Step-by-Step Execution Plan */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#1e222d]/60 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Step-by-Step Execution Protocol</span>
            </h3>

            <div className="space-y-3 text-xs">
              {/* Step 1: Entry Condition */}
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-black/20">
                <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <div className="font-semibold text-slate-200">Entry Trigger & Technique</div>
                  <p className="text-slate-400 mt-0.5">{analysis.executionPlan.entryTechnique}</p>
                  <p className="text-cyan-400/90 font-mono mt-1">Target Entry: ${analysis.executionPlan.entryPrice.toLocaleString()}</p>
                </div>
              </div>

              {/* Step 2: Stop Loss Placement */}
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-black/20">
                <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold font-mono text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <div className="font-semibold text-slate-200">Structural Invalidation (Stop Loss)</div>
                  <p className="text-slate-400 mt-0.5">{analysis.executionPlan.stopLossRationale}</p>
                  <p className="text-red-400/90 font-mono mt-1">Hard Stop Level: ${analysis.executionPlan.stopLossPrice.toLocaleString()}</p>
                </div>
              </div>

              {/* Step 3: Break-Even Rule */}
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <span className="h-5 w-5 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold font-mono text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <div className="font-bold text-yellow-300 flex items-center gap-1.5">
                    <span>Break-Even (BE) Slide Milestone</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-200 font-mono">AUTOMATIC RISK REMOVAL</span>
                  </div>
                  <p className="text-yellow-200/80 mt-0.5">{analysis.executionPlan.breakEvenRationale}</p>
                  <p className="text-yellow-400 font-mono mt-1 font-semibold">
                    Trigger Price: ${analysis.executionPlan.breakEvenTriggerPrice.toLocaleString()} ➔ Move SL to ${analysis.executionPlan.entryPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Step 4: Take Profit Scaling */}
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-black/20">
                <span className="h-5 w-5 rounded-full bg-[#089981]/20 text-[#089981] flex items-center justify-center font-bold font-mono text-[11px] shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <div className="font-semibold text-slate-200">Scale-Out Take Profit Scaling</div>
                  <div className="grid grid-cols-3 gap-2 mt-1.5 font-mono text-[11px]">
                    <div className="p-2 rounded bg-black/30 border border-[#2a2e39]">
                      <span className="text-slate-400 block text-[10px]">TP1 (50% scale):</span>
                      <span className="text-[#089981] font-bold">${analysis.executionPlan.tp1.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded bg-black/30 border border-[#2a2e39]">
                      <span className="text-slate-400 block text-[10px]">TP2 (30% scale):</span>
                      <span className="text-[#089981] font-bold">${analysis.executionPlan.tp2.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded bg-black/30 border border-[#2a2e39]">
                      <span className="text-slate-400 block text-[10px]">TP3 (20% runner):</span>
                      <span className="text-[#089981] font-bold">${analysis.executionPlan.tp3.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. AI Generated Institutional Analysis Card (if available) */}
          {aiAnalysis && (
            <div className="p-4 rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 to-blue-950/20 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 font-mono uppercase">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  Gemini Deep Institutional Audit
                </h4>
                {aiAnalysis.riskScore && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                    Risk Assessment: {aiAnalysis.riskScore}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{aiAnalysis.thesis}</p>
              
              {aiAnalysis.executionBlueprint && (
                <div className="mt-3 space-y-1.5 border-t border-cyan-500/20 pt-2.5">
                  <span className="text-[11px] font-semibold text-cyan-300">Execution Directives:</span>
                  {aiAnalysis.executionBlueprint.map((rule, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiAnalysis.invalidationWarning && (
                <div className="mt-3 p-2.5 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Invalidation Threat: </span>
                    <span>{aiAnalysis.invalidationWarning}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Pre-Trade Verification Checklist */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#1e222d]/60 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-[#089981]" />
              <span>Pre-Execution Checklist</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {analysis.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-black/20">
                  <CheckCircle2 className="h-4 w-4 text-[#089981] shrink-0" />
                  <span className="text-slate-300">{item.item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${
          isDark ? 'border-[#2a2e39] bg-[#1e222d]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Bot className="h-4 w-4 text-cyan-400" />
            <span>Trades can be auto-executed or run by the Simulator Bot engine.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              id="execute-trade-from-analyzer-btn"
              onClick={() => {
                onExecuteTrade(signal);
                onClose();
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold font-mono text-xs text-white shadow-lg transition-all ${
                isBuy 
                  ? 'bg-[#089981] hover:bg-[#089981]/90 shadow-[#089981]/30' 
                  : 'bg-[#f23645] hover:bg-[#f23645]/90 shadow-[#f23645]/30'
              }`}
            >
              <span>Execute {signal.direction} ({signal.symbol})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
