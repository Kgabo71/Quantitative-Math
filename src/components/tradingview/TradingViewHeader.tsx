import React, { useState } from 'react';
import { 
  ChevronDown, 
  CandlestickChart, 
  TrendingUp, 
  BarChart2, 
  Sliders, 
  Bell, 
  RotateCcw, 
  Play, 
  Pause, 
  FastForward, 
  Camera, 
  Maximize2, 
  Sparkles,
  Layers,
  Settings,
  Grid,
  Search,
  Check
} from 'lucide-react';
import { MarketTicker } from '../../types';

export type ChartStyleType = 'candles' | 'heikin_ashi' | 'line' | 'area';
export type TimeframeType = '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

export interface IndicatorSettings {
  ema20: boolean;
  ema50: boolean;
  ema200: boolean;
  bb: boolean;
  vwap: boolean;
  rsi: boolean;
  macd: boolean;
  volume: boolean;
}

interface TradingViewHeaderProps {
  currentTicker: MarketTicker;
  tickers: MarketTicker[];
  onSelectSymbol: (symbol: string) => void;
  timeframe: TimeframeType;
  onChangeTimeframe: (tf: TimeframeType) => void;
  chartStyle: ChartStyleType;
  onChangeChartStyle: (style: ChartStyleType) => void;
  indicators: IndicatorSettings;
  onToggleIndicator: (key: keyof IndicatorSettings) => void;
  isReplayOpen: boolean;
  onToggleReplay: () => void;
  onOpenAlertModal: () => void;
  onTakeSnapshot: () => void;
  activeRegime: 'normal' | 'bull' | 'flash_crash' | 'range' | 'high_vol';
  onChangeRegime: (regime: 'normal' | 'bull' | 'flash_crash' | 'range' | 'high_vol') => void;
  simulationSpeed: number;
  onChangeSpeed: (speed: number) => void;
  isPlayingFeed: boolean;
  onTogglePlayFeed: () => void;
}

export const TradingViewHeader: React.FC<TradingViewHeaderProps> = ({
  currentTicker,
  tickers,
  onSelectSymbol,
  timeframe,
  onChangeTimeframe,
  chartStyle,
  onChangeChartStyle,
  indicators,
  onToggleIndicator,
  isReplayOpen,
  onToggleReplay,
  onOpenAlertModal,
  onTakeSnapshot,
  activeRegime,
  onChangeRegime,
  simulationSpeed,
  onChangeSpeed,
  isPlayingFeed,
  onTogglePlayFeed,
}) => {
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [showChartStyleMenu, setShowChartStyleMenu] = useState(false);
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);
  const [showRegimeMenu, setShowRegimeMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const timeframes: TimeframeType[] = ['1s', '1m', '5m', '15m', '1h', '4h', '1D'];

  const activeIndicatorCount = Object.values(indicators).filter(Boolean).length;

  const filteredTickers = tickers.filter(t => 
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="h-12 bg-[#131722] border-b border-[#2a2e39] px-3 flex items-center justify-between text-xs text-[#d1d4dc] select-none z-30 shrink-0">
      {/* Left Section: Symbol, Timeframes, Chart Type, Indicators */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {/* Symbol Search Button */}
        <div className="relative">
          <button
            type="button"
            id="tv-symbol-select"
            onClick={() => setShowSymbolSearch(!showSymbolSearch)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] text-[#d1d4dc] font-bold text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-extrabold text-[#2962ff] text-sm">
                {currentTicker.symbol}
              </span>
              <span className="text-[10px] text-[#787b86] font-normal hidden md:inline">
                {currentTicker.symbol === 'US30' ? 'DOW 30 INDEX' : currentTicker.symbol === 'NAS100' ? 'NASDAQ 100' : currentTicker.symbol === 'XAU/USD' ? 'GOLD SPOT' : currentTicker.symbol}
              </span>
            </div>
            <span className="text-[9px] bg-[#2a2e39] px-1 py-0.5 rounded text-[#787b86]">
              {currentTicker.type === 'index' ? 'INDEX' : currentTicker.type === 'commodity' ? 'COMMODITY' : 'SPOT'}
            </span>
            <ChevronDown className="h-3 w-3 text-[#787b86]" />
          </button>

          {/* Symbol Dropdown Menu */}
          {showSymbolSearch && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl p-2 z-50">
              <div className="relative mb-2">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787b86]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search symbol (e.g. US30, Gold)..."
                  className="w-full bg-[#131722] border border-[#2a2e39] rounded pl-8 pr-3 py-1.5 text-xs text-[#d1d4dc] focus:outline-none focus:border-[#2962ff]"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredTickers.map((t) => {
                  const isSelected = t.symbol === currentTicker.symbol;
                  return (
                    <button
                      key={t.symbol}
                      type="button"
                      onClick={() => {
                        onSelectSymbol(t.symbol);
                        setShowSymbolSearch(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#2962ff]/20 text-[#2962ff]' : 'hover:bg-[#2a2e39] text-[#d1d4dc]'
                      }`}
                    >
                      <div>
                        <div className="font-mono font-bold text-xs">{t.symbol}</div>
                        <div className="text-[10px] text-[#787b86]">
                          {t.symbol === 'US30' ? 'Wall Street 30 Index' : t.symbol === 'NAS100' ? 'US Tech 100 Index' : t.symbol === 'XAU/USD' ? 'Gold vs US Dollar' : 'Spot Market'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs font-semibold">${t.price.toLocaleString()}</div>
                        <div className={`text-[10px] font-mono ${t.change24h >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                          {t.change24h >= 0 ? '+' : ''}{t.change24h}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-[1px] h-5 bg-[#2a2e39] mx-1" />

        {/* Timeframe Selectors */}
        <div className="flex items-center gap-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf}
              type="button"
              id={`tv-tf-${tf}`}
              onClick={() => onChangeTimeframe(tf)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                timeframe === tf
                  ? 'text-[#2962ff] font-bold bg-[#2962ff]/10'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-[1px] h-5 bg-[#2a2e39] mx-1" />

        {/* Chart Style Switcher */}
        <div className="relative">
          <button
            type="button"
            id="tv-chart-style-btn"
            onClick={() => setShowChartStyleMenu(!showChartStyleMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] transition-colors cursor-pointer"
          >
            <CandlestickChart className="h-4 w-4 text-[#2962ff]" />
            <span className="capitalize hidden sm:inline">{chartStyle.replace('_', ' ')}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showChartStyleMenu && (
            <div className="absolute left-0 top-full mt-1 w-40 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl p-1 z-50">
              {[
                { id: 'candles', label: 'Candles' },
                { id: 'heikin_ashi', label: 'Heikin Ashi' },
                { id: 'line', label: 'Line' },
                { id: 'area', label: 'Area' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    onChangeChartStyle(style.id as any);
                    setShowChartStyleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                    chartStyle === style.id ? 'bg-[#2962ff]/20 text-[#2962ff] font-bold' : 'text-[#d1d4dc] hover:bg-[#2a2e39]'
                  }`}
                >
                  <span>{style.label}</span>
                  {chartStyle === style.id && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Indicators Button */}
        <div className="relative">
          <button
            type="button"
            id="tv-indicators-btn"
            onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer border ${
              showIndicatorsMenu || activeIndicatorCount > 0
                ? 'bg-[#2962ff]/10 text-[#2962ff] border-[#2962ff]/30'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] border-transparent'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="font-semibold hidden sm:inline">Indicators</span>
            {activeIndicatorCount > 0 && (
              <span className="h-4 w-4 rounded-full bg-[#2962ff] text-white text-[10px] font-bold flex items-center justify-center">
                {activeIndicatorCount}
              </span>
            )}
          </button>

          {/* Indicators Selection Popover */}
          {showIndicatorsMenu && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl p-2 z-50">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#787b86] px-2 py-1 mb-1 border-b border-[#2a2e39]">
                Technical Overlays & Oscillators
              </div>
              <div className="space-y-1">
                {[
                  { key: 'ema20', label: 'EMA (20) Exponential MA', color: '#eab308' },
                  { key: 'ema50', label: 'EMA (50) Medium Trend', color: '#06b6d4' },
                  { key: 'ema200', label: 'EMA (200) Macro Baseline', color: '#a855f7' },
                  { key: 'bb', label: 'Bollinger Bands (20, 2σ)', color: '#818cf8' },
                  { key: 'vwap', label: 'VWAP (Volume Weighted Avg)', color: '#f97316' },
                  { key: 'volume', label: 'Volume Bars & Profile', color: '#64748b' },
                  { key: 'rsi', label: 'RSI (14) Momentum Sub-chart', color: '#fbbf24' },
                  { key: 'macd', label: 'MACD (12, 26, 9) Oscillator', color: '#38bdf8' },
                ].map((item) => {
                  const isChecked = indicators[item.key as keyof IndicatorSettings];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onToggleIndicator(item.key as keyof IndicatorSettings)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                        isChecked ? 'bg-[#2a2e39] text-[#d1d4dc]' : 'text-[#787b86] hover:bg-[#2a2e39]/50 hover:text-[#d1d4dc]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span>{item.label}</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked ? 'bg-[#2962ff] border-[#2962ff] text-white' : 'border-[#2a2e39]'
                      }`}>
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bar Replay Mode Toggle */}
        <button
          type="button"
          id="tv-replay-btn"
          onClick={onToggleReplay}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer border ${
            isReplayOpen
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] border-transparent'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="font-semibold hidden md:inline">Bar Replay</span>
        </button>

        {/* Quick Alert Bell */}
        <button
          type="button"
          id="tv-quick-alert-btn"
          onClick={onOpenAlertModal}
          className="flex items-center gap-1 px-2 py-1 rounded text-[#787b86] hover:text-amber-400 hover:bg-[#2a2e39] transition-colors cursor-pointer"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Alert</span>
        </button>
      </div>

      {/* Right Section: Feed Play/Pause, Speed, Market Regime, Snapshot */}
      <div className="flex items-center gap-2">
        {/* Live Feed Status & Play/Pause */}
        <div className="flex items-center gap-1.5 bg-[#1e222d] border border-[#2a2e39] px-2 py-1 rounded">
          <button
            type="button"
            id="tv-feed-play-btn"
            onClick={onTogglePlayFeed}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isPlayingFeed ? 'text-[#089981] hover:bg-[#089981]/20' : 'text-amber-400 hover:bg-amber-400/20'
            }`}
          >
            {isPlayingFeed ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
          </button>
          
          <div className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${isPlayingFeed ? 'bg-[#089981] animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[10px] font-mono uppercase text-[#787b86] hidden sm:inline">
              {isPlayingFeed ? 'Live Feed' : 'Paused'}
            </span>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-0.5 ml-1 border-l border-[#2a2e39] pl-1 text-[10px] font-mono">
            {[1, 5, 20].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onChangeSpeed(spd)}
                className={`px-1 rounded ${simulationSpeed === spd ? 'bg-[#2962ff] text-white font-bold' : 'text-[#787b86] hover:text-[#d1d4dc]'}`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Market Regime Injector */}
        <div className="relative">
          <button
            type="button"
            id="tv-regime-btn"
            onClick={() => setShowRegimeMenu(!showRegimeMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] transition-colors cursor-pointer text-xs"
          >
            <span className="capitalize">{activeRegime.replace('_', ' ')}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showRegimeMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl p-1 z-50">
              {[
                { id: 'normal', label: 'Normal Noise' },
                { id: 'bull', label: 'Bull Trend' },
                { id: 'flash_crash', label: 'Flash Crash' },
                { id: 'high_vol', label: 'Volatility Spike' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onChangeRegime(r.id as any);
                    setShowRegimeMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                    activeRegime === r.id ? 'bg-[#2962ff]/20 text-[#2962ff] font-bold' : 'text-[#d1d4dc] hover:bg-[#2a2e39]'
                  }`}
                >
                  <span>{r.label}</span>
                  {activeRegime === r.id && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Snapshot Camera */}
        <button
          type="button"
          id="tv-snapshot-btn"
          onClick={onTakeSnapshot}
          className="p-1.5 rounded text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] transition-colors cursor-pointer"
          title="Take Chart Screenshot"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
