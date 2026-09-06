import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Candle, 
  MarketTicker, 
  OrderBook 
} from '../../types';
import { 
  ChartStyleType, 
  TimeframeType, 
  IndicatorSettings 
} from './TradingViewHeader';
import { DrawingToolType } from './DrawingToolbar';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  EyeOff, 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw,
  Zap,
  Volume2
} from 'lucide-react';

interface TradingViewChartProps {
  ticker: MarketTicker;
  candles: Candle[];
  orderBook: OrderBook;
  chartStyle: ChartStyleType;
  timeframe: TimeframeType;
  indicators: IndicatorSettings;
  activeDrawingTool: DrawingToolType;
  hideDrawings: boolean;
  onQuickTrade: (side: 'BUY' | 'SELL', amount: number) => void;
  isReplayOpen: boolean;
  onCloseReplay: () => void;
}

interface CustomDrawing {
  id: string;
  type: DrawingToolType;
  price1: number;
  price2?: number;
  time1: number;
  time2?: number;
  label?: string;
  color?: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  ticker,
  candles,
  orderBook,
  chartStyle,
  timeframe,
  indicators,
  activeDrawingTool,
  hideDrawings,
  onQuickTrade,
  isReplayOpen,
  onCloseReplay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 500 });
  
  // Interactive Crosshair coordinates
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  // Quick Trade Lot Quantity
  const [lotSize, setLotSize] = useState<number>(1.0);

  // Bar Replay State
  const [replayIndex, setReplayIndex] = useState<number>(candles.length);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);

  // Persistent user drawings on the chart
  const [drawings, setDrawings] = useState<CustomDrawing[]>([
    {
      id: 'draw-default-long',
      type: 'long_position',
      price1: ticker.price * 0.9985, // Entry
      price2: ticker.price * 1.0040, // TP
      time1: 15,
      time2: 45,
      label: 'ORB Long Execution'
    },
    {
      id: 'draw-default-fvg',
      type: 'fvg',
      price1: ticker.price * 0.9990,
      price2: ticker.price * 0.9975,
      time1: 5,
      time2: 25,
      label: '09:30 FVG Breaker'
    }
  ]);

  // Handle Container Resize using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 500,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Replay tick loop
  useEffect(() => {
    if (!isReplaying || !isReplayOpen) return;
    const interval = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= candles.length) {
          setIsReplaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isReplaying, isReplayOpen, candles.length]);

  // Displayed candles (either full series or replayed subset)
  const displayCandles = useMemo(() => {
    if (isReplayOpen && replayIndex < candles.length) {
      return candles.slice(0, Math.max(10, replayIndex));
    }
    return candles;
  }, [candles, isReplayOpen, replayIndex]);

  // Compute Heikin-Ashi candles if requested
  const processedCandles = useMemo(() => {
    if (chartStyle !== 'heikin_ashi') return displayCandles;
    const ha: Candle[] = [];
    for (let i = 0; i < displayCandles.length; i++) {
      const current = displayCandles[i];
      if (i === 0) {
        ha.push({ ...current });
      } else {
        const prevHa = ha[i - 1];
        const haClose = (current.open + current.high + current.low + current.close) / 4;
        const haOpen = (prevHa.open + prevHa.close) / 2;
        const haHigh = Math.max(current.high, haOpen, haClose);
        const haLow = Math.min(current.low, haOpen, haClose);
        ha.push({
          ...current,
          open: haOpen,
          high: haHigh,
          low: haLow,
          close: haClose,
        });
      }
    }
    return ha;
  }, [displayCandles, chartStyle]);

  // Chart Layout Calculations
  const chartHeight = indicators.rsi || indicators.macd ? dimensions.height * 0.75 : dimensions.height - 30;
  const subChartHeight = dimensions.height - chartHeight - 20;
  const priceAxisWidth = 72;
  const timeAxisHeight = 24;
  const plotWidth = Math.max(100, dimensions.width - priceAxisWidth);
  const plotHeight = Math.max(100, chartHeight - timeAxisHeight);

  // Determine Price Domain (Min, Max)
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (processedCandles.length === 0) {
      return { minPrice: 100, maxPrice: 110, priceRange: 10 };
    }
    let min = Infinity;
    let max = -Infinity;

    for (const c of processedCandles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (indicators.bb && c.upperBand && c.upperBand > max) max = c.upperBand;
      if (indicators.bb && c.lowerBand && c.lowerBand < min) min = c.lowerBand;
    }

    // Add 4% vertical breathing room like TradingView
    const pad = (max - min) * 0.05 || 1.0;
    return {
      minPrice: min - pad,
      maxPrice: max + pad,
      priceRange: (max + pad) - (min - pad),
    };
  }, [processedCandles, indicators.bb]);

  // Coordinate Conversion Helpers
  const candleCount = processedCandles.length;
  const candleWidth = Math.max(3, (plotWidth / Math.max(1, candleCount)) * 0.72);
  const candleGap = (plotWidth / Math.max(1, candleCount));

  const getY = (price: number) => {
    if (priceRange === 0) return plotHeight / 2;
    return plotHeight - ((price - minPrice) / priceRange) * plotHeight;
  };

  const getPriceAtY = (y: number) => {
    const fraction = (plotHeight - y) / plotHeight;
    return minPrice + fraction * priceRange;
  };

  const getX = (index: number) => {
    return index * candleGap + candleGap / 2;
  };

  // Latest candle & active OHLCV values
  const activeCandle = hoveredCandle || processedCandles[processedCandles.length - 1] || candles[0];
  const prevCandle = processedCandles[processedCandles.length - 2] || activeCandle;
  const candleDelta = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const candleDeltaPct = activeCandle && activeCandle.open > 0 ? (candleDelta / activeCandle.open) * 100 : 0;
  const isBullishActive = candleDelta >= 0;

  // Max Volume for bar scaling
  const maxVolume = useMemo(() => {
    return Math.max(...processedCandles.map(c => c.volume || 1000), 1000);
  }, [processedCandles]);

  // Handle Mouse Hover / Crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= 0 && x <= plotWidth && y >= 0 && y <= plotHeight) {
      setCrosshair({ x, y, active: true });
      const candleIndex = Math.min(
        candleCount - 1,
        Math.max(0, Math.floor(x / candleGap))
      );
      setHoveredCandle(processedCandles[candleIndex] || null);
    } else {
      setCrosshair(prev => ({ ...prev, active: false }));
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setCrosshair({ x: 0, y: 0, active: false });
    setHoveredCandle(null);
  };

  // Handle Drawing Tool Click on Canvas
  const handleChartClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeDrawingTool === 'cursor' || activeDrawingTool === 'crosshair') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x > plotWidth || y > plotHeight) return;

    const clickedPrice = getPriceAtY(y);
    const clickedIndex = Math.floor(x / candleGap);

    if (activeDrawingTool === 'long_position') {
      const newDrawing: CustomDrawing = {
        id: `draw-${Date.now()}`,
        type: 'long_position',
        price1: clickedPrice,
        price2: clickedPrice + (priceRange * 0.15),
        time1: clickedIndex,
        time2: Math.min(candleCount - 1, clickedIndex + 25),
        label: 'Long Setup'
      };
      setDrawings(prev => [...prev, newDrawing]);
    } else if (activeDrawingTool === 'short_position') {
      const newDrawing: CustomDrawing = {
        id: `draw-${Date.now()}`,
        type: 'short_position',
        price1: clickedPrice,
        price2: clickedPrice - (priceRange * 0.15),
        time1: clickedIndex,
        time2: Math.min(candleCount - 1, clickedIndex + 25),
        label: 'Short Setup'
      };
      setDrawings(prev => [...prev, newDrawing]);
    } else if (activeDrawingTool === 'horizontal') {
      const newDrawing: CustomDrawing = {
        id: `draw-${Date.now()}`,
        type: 'horizontal',
        price1: clickedPrice,
        time1: 0,
        time2: candleCount - 1,
        label: `Key Level: $${clickedPrice.toFixed(2)}`
      };
      setDrawings(prev => [...prev, newDrawing]);
    } else if (activeDrawingTool === 'fibonacci') {
      const newDrawing: CustomDrawing = {
        id: `draw-${Date.now()}`,
        type: 'fibonacci',
        price1: clickedPrice,
        price2: clickedPrice + (priceRange * 0.25),
        time1: Math.max(0, clickedIndex - 15),
        time2: Math.min(candleCount - 1, clickedIndex + 20),
        label: 'Fib Retracement'
      };
      setDrawings(prev => [...prev, newDrawing]);
    } else if (activeDrawingTool === 'rectangle' || activeDrawingTool === 'fvg') {
      const newDrawing: CustomDrawing = {
        id: `draw-${Date.now()}`,
        type: activeDrawingTool,
        price1: clickedPrice + (priceRange * 0.04),
        price2: clickedPrice - (priceRange * 0.04),
        time1: Math.max(0, clickedIndex - 5),
        time2: Math.min(candleCount - 1, clickedIndex + 15),
        label: activeDrawingTool === 'fvg' ? 'FVG Liquidity Gap' : 'Supply / Demand Zone'
      };
      setDrawings(prev => [...prev, newDrawing]);
    }
  };

  // Horizontal Price Ticks on Right Y-Axis
  const priceTicks = useMemo(() => {
    const tickCount = 8;
    const step = priceRange / tickCount;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(minPrice + i * step);
    }
    return ticks;
  }, [minPrice, priceRange]);

  // Current live price & countdown
  const currentPrice = ticker.price;
  const currentPriceY = getY(currentPrice);

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 w-full h-full bg-[#131722] overflow-hidden select-none cursor-crosshair font-sans"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleChartClick}
    >
      {/* Top Floating TradingView OHLCV Legend Bar */}
      <div className="absolute top-2 left-3 z-20 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono pointer-events-none">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-white text-xs">{ticker.symbol}</span>
          <span className="text-[#787b86]">·</span>
          <span className="text-[#2962ff]">{timeframe}</span>
          <span className="text-[#787b86]">·</span>
          <span className="text-[#787b86] text-[10px]">OANDA</span>
        </div>

        {activeCandle && (
          <div className="flex items-center gap-2">
            <span className="text-[#787b86]">O<span className="text-[#d1d4dc] ml-1">{activeCandle.open.toFixed(2)}</span></span>
            <span className="text-[#787b86]">H<span className="text-[#d1d4dc] ml-1">{activeCandle.high.toFixed(2)}</span></span>
            <span className="text-[#787b86]">L<span className="text-[#d1d4dc] ml-1">{activeCandle.low.toFixed(2)}</span></span>
            <span className="text-[#787b86]">C<span className="text-[#d1d4dc] ml-1">{activeCandle.close.toFixed(2)}</span></span>
            <span className={`font-bold ml-1 ${isBullishActive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
              {candleDelta >= 0 ? '+' : ''}{candleDelta.toFixed(2)} ({candleDeltaPct >= 0 ? '+' : ''}{candleDeltaPct.toFixed(2)}%)
            </span>
            <span className="text-[#787b86]">Vol<span className="text-[#d1d4dc] ml-1">{(activeCandle.volume / 1000).toFixed(1)}K</span></span>
          </div>
        )}

        {/* Indicators Legend */}
        <div className="flex items-center gap-2 text-[10px]">
          {indicators.ema20 && activeCandle?.sma20 && (
            <span className="text-[#eab308]">EMA 20: {(activeCandle.sma20 * 0.999).toFixed(2)}</span>
          )}
          {indicators.ema50 && (
            <span className="text-[#06b6d4]">EMA 50: {((activeCandle?.sma20 || currentPrice) * 0.996).toFixed(2)}</span>
          )}
          {indicators.bb && activeCandle?.upperBand && (
            <span className="text-[#818cf8]">BB (20, 2): [{activeCandle.lowerBand?.toFixed(1)}, {activeCandle.upperBand?.toFixed(1)}]</span>
          )}
          {indicators.vwap && (
            <span className="text-[#f97316]">VWAP: {(currentPrice * 0.9992).toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Floating TradingView DOM Quick Trade Widget (Top-Left) */}
      <div className="absolute top-10 left-3 z-20 flex items-center bg-[#1e222d]/90 backdrop-blur border border-[#2a2e39] rounded shadow-xl p-1 text-xs select-none">
        {/* SELL Button */}
        <button
          type="button"
          id="tv-quick-sell-btn"
          onClick={(e) => {
            e.stopPropagation();
            onQuickTrade('SELL', lotSize);
          }}
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded bg-[#f23645] hover:bg-[#f23645]/90 text-white font-bold transition-transform active:scale-95 cursor-pointer min-w-[76px]"
        >
          <span className="text-[9px] uppercase tracking-wider opacity-80">SELL</span>
          <span className="font-mono text-xs font-black">
            {orderBook.bids[0]?.price.toFixed(ticker.type === 'commodity' ? 2 : 1) || ticker.price.toFixed(1)}
          </span>
        </button>

        {/* Lot Quantity Input */}
        <div className="px-2 flex flex-col items-center">
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="50"
            value={lotSize}
            onChange={(e) => setLotSize(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-[#131722] border border-[#2a2e39] rounded text-center text-xs font-mono font-bold text-[#d1d4dc] py-1 focus:outline-none focus:border-[#2962ff]"
          />
          <span className="text-[8px] text-[#787b86] uppercase mt-0.5">Lots</span>
        </div>

        {/* BUY Button */}
        <button
          type="button"
          id="tv-quick-buy-btn"
          onClick={(e) => {
            e.stopPropagation();
            onQuickTrade('BUY', lotSize);
          }}
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded bg-[#2962ff] hover:bg-[#2962ff]/90 text-white font-bold transition-transform active:scale-95 cursor-pointer min-w-[76px]"
        >
          <span className="text-[9px] uppercase tracking-wider opacity-80">BUY</span>
          <span className="font-mono text-xs font-black">
            {orderBook.asks[0]?.price.toFixed(ticker.type === 'commodity' ? 2 : 1) || ticker.price.toFixed(1)}
          </span>
        </button>
      </div>

      {/* Main SVG Chart Canvas */}
      <svg width={dimensions.width} height={chartHeight} className="overflow-visible">
        <defs>
          {/* Bollinger Band Shaded Area Gradient */}
          <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.04" />
          </linearGradient>

          {/* Area Chart Gradient */}
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2962ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2962ff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* 1. Coordinate Grid Lines */}
        {/* Horizontal Price Grid */}
        {priceTicks.map((tick, idx) => {
          const y = getY(tick);
          return (
            <line
              key={`h-grid-${idx}`}
              x1={0}
              y1={y}
              x2={plotWidth}
              y2={y}
              stroke="#2a2e39"
              strokeDasharray="2 4"
              strokeWidth={1}
            />
          );
        })}

        {/* Vertical Time Grid */}
        {processedCandles.map((c, idx) => {
          if (idx % 10 !== 0) return null;
          const x = getX(idx);
          return (
            <line
              key={`v-grid-${idx}`}
              x1={x}
              y1={0}
              x2={x}
              y2={plotHeight}
              stroke="#2a2e39"
              strokeDasharray="2 4"
              strokeWidth={1}
            />
          );
        })}

        {/* 2. Technical Indicator Overlays */}
        {/* Bollinger Bands Shaded Band */}
        {indicators.bb && processedCandles.some(c => c.upperBand && c.lowerBand) && (
          <path
            d={(() => {
              const upperPts = processedCandles.map((c, i) => `${getX(i)},${getY(c.upperBand || c.high)}`).join(' L ');
              const lowerPts = processedCandles.slice().reverse().map((c, i) => `${getX(candleCount - 1 - i)},${getY(c.lowerBand || c.low)}`).join(' L ');
              return `M ${upperPts} L ${lowerPts} Z`;
            })()}
            fill="url(#bbGradient)"
          />
        )}

        {/* Bollinger Bands Upper and Lower Lines */}
        {indicators.bb && (
          <>
            <polyline
              fill="none"
              stroke="#818cf8"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.8}
              points={processedCandles.map((c, i) => `${getX(i)},${getY(c.upperBand || c.high)}`).join(' ')}
            />
            <polyline
              fill="none"
              stroke="#818cf8"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.8}
              points={processedCandles.map((c, i) => `${getX(i)},${getY(c.lowerBand || c.low)}`).join(' ')}
            />
          </>
        )}

        {/* EMA 20 (Yellow) */}
        {indicators.ema20 && (
          <polyline
            fill="none"
            stroke="#eab308"
            strokeWidth={1.5}
            opacity={0.9}
            points={processedCandles.map((c, i) => `${getX(i)},${getY(c.sma20 || c.close)}`).join(' ')}
          />
        )}

        {/* EMA 50 (Cyan) */}
        {indicators.ema50 && (
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth={1.5}
            opacity={0.85}
            points={processedCandles.map((c, i) => `${getX(i)},${getY((c.sma20 || c.close) * 0.998)}`).join(' ')}
          />
        )}

        {/* VWAP (Orange) */}
        {indicators.vwap && (
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth={1.5}
            points={processedCandles.map((c, i) => `${getX(i)},${getY(c.close * 0.9995)}`).join(' ')}
          />
        )}

        {/* 3. Volume Histogram Bars at Base */}
        {indicators.volume && (
          <g opacity={0.35}>
            {processedCandles.map((c, idx) => {
              const x = getX(idx) - candleWidth / 2;
              const volHeight = ((c.volume || 1000) / maxVolume) * (plotHeight * 0.22);
              const y = plotHeight - volHeight;
              const isBull = c.close >= c.open;
              return (
                <rect
                  key={`vol-${idx}`}
                  x={x}
                  y={y}
                  width={candleWidth}
                  height={volHeight}
                  fill={isBull ? '#089981' : '#f23645'}
                />
              );
            })}
          </g>
        )}

        {/* 4. Area / Line Chart Style Option */}
        {chartStyle === 'area' && (
          <path
            d={`M ${getX(0)},${plotHeight} L ${processedCandles.map((c, i) => `${getX(i)},${getY(c.close)}`).join(' L ')} L ${getX(candleCount - 1)},${plotHeight} Z`}
            fill="url(#areaGradient)"
          />
        )}
        {(chartStyle === 'line' || chartStyle === 'area') && (
          <polyline
            fill="none"
            stroke="#2962ff"
            strokeWidth={2}
            points={processedCandles.map((c, i) => `${getX(i)},${getY(c.close)}`).join(' ')}
          />
        )}

        {/* 5. Authentic Candlesticks (Candles / Heikin-Ashi) */}
        {(chartStyle === 'candles' || chartStyle === 'heikin_ashi') && (
          <g>
            {processedCandles.map((c, idx) => {
              const isBull = c.close >= c.open;
              const color = isBull ? '#089981' : '#f23645';
              const xCenter = getX(idx);
              const xLeft = xCenter - candleWidth / 2;

              const yHigh = getY(c.high);
              const yLow = getY(c.low);
              const yOpen = getY(c.open);
              const yClose = getY(c.close);

              const bodyY = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(1.5, Math.abs(yOpen - yClose));

              return (
                <g key={`candle-${idx}`}>
                  {/* High/Low Wick */}
                  <line
                    x1={xCenter}
                    y1={yHigh}
                    x2={xCenter}
                    y2={yLow}
                    stroke={color}
                    strokeWidth={1}
                  />

                  {/* Candle Body */}
                  <rect
                    x={xLeft}
                    y={bodyY}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    stroke={color}
                    strokeWidth={0.5}
                    rx={0.5}
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* 6. On-Chart Active User Drawings */}
        {!hideDrawings && drawings.map((d) => {
          if (d.type === 'long_position' && d.price2) {
            const entryY = getY(d.price1);
            const tpY = getY(d.price2);
            const stopDistance = Math.abs(d.price2 - d.price1) * 0.45;
            const slY = getY(d.price1 - stopDistance);
            const startX = getX(d.time1 || 10);
            const endX = getX(d.time2 || Math.min(candleCount - 1, 40));
            const boxWidth = Math.max(80, endX - startX);
            const riskReward = (Math.abs(d.price2 - d.price1) / stopDistance).toFixed(2);

            return (
              <g key={d.id} className="cursor-move opacity-90">
                {/* Target Zone (Green) */}
                <rect
                  x={startX}
                  y={tpY}
                  width={boxWidth}
                  height={Math.max(2, entryY - tpY)}
                  fill="#089981"
                  fillOpacity={0.18}
                  stroke="#089981"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                {/* Risk Zone (Red) */}
                <rect
                  x={startX}
                  y={entryY}
                  width={boxWidth}
                  height={Math.max(2, slY - entryY)}
                  fill="#f23645"
                  fillOpacity={0.18}
                  stroke="#f23645"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                {/* Entry Center Line */}
                <line
                  x1={startX}
                  y1={entryY}
                  x2={startX + boxWidth}
                  y2={entryY}
                  stroke="#d1d4dc"
                  strokeWidth={1.5}
                />
                {/* Risk Reward Ratio Tag */}
                <rect
                  x={startX + 6}
                  y={entryY - 10}
                  width={82}
                  height={20}
                  rx={3}
                  fill="#1e222d"
                  stroke="#2a2e39"
                />
                <text
                  x={startX + 12}
                  y={entryY + 4}
                  fill="#2962ff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  R:R {riskReward}
                </text>
              </g>
            );
          }

          if (d.type === 'horizontal') {
            const y = getY(d.price1);
            return (
              <g key={d.id}>
                <line
                  x1={0}
                  y1={y}
                  x2={plotWidth}
                  y2={y}
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
                <rect
                  x={plotWidth - 110}
                  y={y - 9}
                  width={105}
                  height={18}
                  rx={3}
                  fill="#1e222d"
                  stroke="#fbbf24"
                />
                <text
                  x={plotWidth - 104}
                  y={y + 3}
                  fill="#fbbf24"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {d.label || `$${d.price1.toFixed(2)}`}
                </text>
              </g>
            );
          }

          if (d.type === 'fvg') {
            const y1 = getY(d.price1);
            const y2 = getY(d.price2 || d.price1 * 0.998);
            const topY = Math.min(y1, y2);
            const boxH = Math.abs(y1 - y2);
            const startX = getX(d.time1 || 5);
            const endX = getX(d.time2 || 25);
            return (
              <g key={d.id}>
                <rect
                  x={startX}
                  y={topY}
                  width={Math.max(40, endX - startX)}
                  height={boxH}
                  fill="#06b6d4"
                  fillOpacity={0.15}
                  stroke="#06b6d4"
                  strokeWidth={1}
                />
                <text
                  x={startX + 6}
                  y={topY + 12}
                  fill="#06b6d4"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  FVG IMBALANCE
                </text>
              </g>
            );
          }

          return null;
        })}

        {/* 7. Live Pulsing Price Line */}
        <g>
          <line
            x1={0}
            y1={currentPriceY}
            x2={plotWidth}
            y2={currentPriceY}
            stroke={ticker.change24h >= 0 ? '#089981' : '#f23645'}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        </g>

        {/* 8. Crosshair Lines */}
        {crosshair.active && (
          <g>
            {/* Horizontal Line */}
            <line
              x1={0}
              y1={crosshair.y}
              x2={plotWidth}
              y2={crosshair.y}
              stroke="#787b86"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {/* Vertical Line */}
            <line
              x1={crosshair.x}
              y1={0}
              x2={crosshair.x}
              y2={plotHeight}
              stroke="#787b86"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </g>
        )}

        {/* 9. Right Y-Axis Background & Price Labels */}
        <rect
          x={plotWidth}
          y={0}
          width={priceAxisWidth}
          height={dimensions.height}
          fill="#131722"
          stroke="#2a2e39"
          strokeWidth={1}
        />

        {/* Static Price Ticks on Y-Axis */}
        {priceTicks.map((tick, idx) => {
          const y = getY(tick);
          return (
            <text
              key={`tick-${idx}`}
              x={plotWidth + 8}
              y={y + 4}
              fill="#787b86"
              fontSize="10"
              fontFamily="monospace"
            >
              {tick.toFixed(ticker.type === 'commodity' ? 2 : 1)}
            </text>
          );
        })}

        {/* Current Live Price Tag on Right Y-Axis */}
        <g>
          <rect
            x={plotWidth}
            y={currentPriceY - 11}
            width={priceAxisWidth}
            height={22}
            fill={ticker.change24h >= 0 ? '#089981' : '#f23645'}
            rx={2}
          />
          <text
            x={plotWidth + 6}
            y={currentPriceY + 4}
            fill="#ffffff"
            fontSize="11"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {currentPrice.toFixed(ticker.type === 'commodity' ? 2 : 1)}
          </text>
        </g>

        {/* Crosshair Price Tag on Y-Axis */}
        {crosshair.active && (
          <g>
            <rect
              x={plotWidth}
              y={crosshair.y - 10}
              width={priceAxisWidth}
              height={20}
              fill="#2a2e39"
              rx={2}
            />
            <text
              x={plotWidth + 6}
              y={crosshair.y + 4}
              fill="#d1d4dc"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {getPriceAtY(crosshair.y).toFixed(ticker.type === 'commodity' ? 2 : 1)}
            </text>
          </g>
        )}

        {/* Bottom Time Axis */}
        <rect
          x={0}
          y={plotHeight}
          width={plotWidth}
          height={timeAxisHeight}
          fill="#131722"
          stroke="#2a2e39"
          strokeWidth={1}
        />

        {/* Time Ticks on X-Axis */}
        {processedCandles.map((c, idx) => {
          if (idx % 12 !== 0) return null;
          const x = getX(idx);
          return (
            <text
              key={`time-${idx}`}
              x={x - 14}
              y={plotHeight + 16}
              fill="#787b86"
              fontSize="9"
              fontFamily="monospace"
            >
              {c.time}
            </text>
          );
        })}

        {/* Crosshair Time Tag on X-Axis */}
        {crosshair.active && hoveredCandle && (
          <g>
            <rect
              x={crosshair.x - 25}
              y={plotHeight}
              width={50}
              height={20}
              fill="#2a2e39"
              rx={2}
            />
            <text
              x={crosshair.x - 18}
              y={plotHeight + 14}
              fill="#d1d4dc"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {hoveredCandle.time}
            </text>
          </g>
        )}
      </svg>

      {/* Sub-Panel: RSI (14) Oscillator */}
      {indicators.rsi && (
        <div 
          className="w-full border-t border-[#2a2e39] bg-[#131722] px-3 py-1.5"
          style={{ height: `${subChartHeight}px` }}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-[#787b86] mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#fbbf24]">RSI 14 close</span>
              <span className="text-[#d1d4dc] font-bold">
                {activeCandle?.rsi || 52.4}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Overbought 70</span>
              <span>·</span>
              <span>Oversold 30</span>
            </div>
          </div>

          <svg width={plotWidth} height={subChartHeight - 24} className="overflow-visible">
            {/* Shaded 30 - 70 Band */}
            <rect
              x={0}
              y={(subChartHeight - 24) * 0.3}
              width={plotWidth}
              height={(subChartHeight - 24) * 0.4}
              fill="#fbbf24"
              fillOpacity={0.06}
            />
            {/* 70 Line */}
            <line
              x1={0}
              y1={(subChartHeight - 24) * 0.3}
              x2={plotWidth}
              y2={(subChartHeight - 24) * 0.3}
              stroke="#f23645"
              strokeDasharray="2 3"
              strokeWidth={1}
            />
            {/* 30 Line */}
            <line
              x1={0}
              y1={(subChartHeight - 24) * 0.7}
              x2={plotWidth}
              y2={(subChartHeight - 24) * 0.7}
              stroke="#089981"
              strokeDasharray="2 3"
              strokeWidth={1}
            />
            {/* RSI Line */}
            <polyline
              fill="none"
              stroke="#fbbf24"
              strokeWidth={1.5}
              points={processedCandles.map((c, i) => {
                const x = getX(i);
                const rsiVal = c.rsi || 50;
                const y = (subChartHeight - 24) * (1 - (rsiVal / 100));
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>
        </div>
      )}

      {/* Floating Bar Replay Controls (When Replay Mode is Active) */}
      {isReplayOpen && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl p-2.5 flex items-center gap-3 select-none">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-amber-400">BAR REPLAY</span>
            <span className="text-[10px] text-[#787b86]">
              Bar {displayCandles.length} / {candles.length}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-[#2a2e39]" />

          {/* Jump to Start */}
          <button
            type="button"
            onClick={() => setReplayIndex(10)}
            className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Step Back */}
          <button
            type="button"
            onClick={() => setReplayIndex(prev => Math.max(10, prev - 1))}
            className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={() => setIsReplaying(!isReplaying)}
            className="p-1.5 rounded bg-[#2962ff] text-white hover:bg-[#2962ff]/90"
          >
            {isReplaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          </button>

          {/* Step Forward */}
          <button
            type="button"
            onClick={() => setReplayIndex(prev => Math.min(candles.length, prev + 1))}
            className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-[#2a2e39]" />

          {/* Close Replay */}
          <button
            type="button"
            onClick={onCloseReplay}
            className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-rose-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
