import React from 'react';
import { 
  Plus, 
  Minus, 
  Slash, 
  Maximize2, 
  Type, 
  Square, 
  Ruler, 
  Magnet, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Trash2, 
  ArrowUpRight, 
  TrendingUp, 
  CircleDot,
  MousePointer,
  Compass,
  Layers,
  Crosshair
} from 'lucide-react';

export type DrawingToolType = 
  | 'cursor' 
  | 'crosshair' 
  | 'trendline' 
  | 'horizontal' 
  | 'fibonacci' 
  | 'rectangle' 
  | 'long_position' 
  | 'short_position' 
  | 'fvg' 
  | 'ruler' 
  | 'text';

interface DrawingToolbarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  magnetEnabled: boolean;
  onToggleMagnet: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
  hideDrawings: boolean;
  onToggleHideDrawings: () => void;
  onClearDrawings: () => void;
  drawingsCount: number;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  magnetEnabled,
  onToggleMagnet,
  isLocked,
  onToggleLock,
  hideDrawings,
  onToggleHideDrawings,
  onClearDrawings,
  drawingsCount,
}) => {
  const tools: { id: DrawingToolType; icon: React.ElementType; label: string; shortcut?: string }[] = [
    { id: 'crosshair', icon: Crosshair, label: 'Crosshair', shortcut: 'Alt+C' },
    { id: 'cursor', icon: MousePointer, label: 'Cursor Pointer' },
    { id: 'trendline', icon: Slash, label: 'Trendline', shortcut: 'Alt+T' },
    { id: 'horizontal', icon: Minus, label: 'Horizontal Ray / Level', shortcut: 'Alt+H' },
    { id: 'fibonacci', icon: Compass, label: 'Fib Retracement (0.618 Golden Pocket)', shortcut: 'Alt+F' },
    { id: 'rectangle', icon: Square, label: 'Order Block / Zone', shortcut: 'Alt+R' },
    { id: 'long_position', icon: TrendingUp, label: 'Long Position (R:R Risk/Reward Tool)', shortcut: 'Alt+L' },
    { id: 'short_position', icon: ArrowUpRight, label: 'Short Position (R:R Tool)', shortcut: 'Alt+S' },
    { id: 'fvg', icon: Layers, label: 'Fair Value Gap (FVG Imbalance)' },
    { id: 'ruler', icon: Ruler, label: 'Measure Tool (Pips / % / Bars)' },
    { id: 'text', icon: Type, label: 'Text Annotation' },
  ];

  return (
    <div className="w-11 bg-[#131722] border-r border-[#2a2e39] flex flex-col items-center py-2 select-none z-20 shrink-0">
      {/* Primary Drawing Tools */}
      <div className="flex flex-col items-center gap-1 w-full px-1">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <div key={t.id} className="relative group w-full flex justify-center">
              <button
                type="button"
                id={`tv-tool-${t.id}`}
                onClick={() => onSelectTool(t.id)}
                className={`h-8 w-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#2962ff] text-white shadow-sm'
                    : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>

              {/* TradingView Tooltip */}
              <div className="absolute left-11 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-[#1e222d] text-[#d1d4dc] border border-[#2a2e39] text-[11px] font-medium px-2.5 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
                <span>{t.label}</span>
                {t.shortcut && (
                  <span className="text-[9px] bg-[#2a2e39] text-[#787b86] px-1.5 py-0.5 rounded font-mono">
                    {t.shortcut}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-6 h-[1px] bg-[#2a2e39] my-2" />

      {/* Utility Controls (Magnet, Lock, Hide, Trash) */}
      <div className="flex flex-col items-center gap-1 w-full px-1 mt-auto">
        {/* Magnet Tool */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            id="tv-tool-magnet"
            onClick={onToggleMagnet}
            className={`h-8 w-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
              magnetEnabled
                ? 'bg-[#2962ff]/20 text-[#2962ff]'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
          >
            <Magnet className="h-4 w-4" />
          </button>
          <div className="absolute left-11 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#1e222d] text-[#d1d4dc] border border-[#2a2e39] text-[11px] font-medium px-2.5 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
            <span>Magnet Mode ({magnetEnabled ? 'Enabled' : 'Off'})</span>
          </div>
        </div>

        {/* Lock Drawings */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            id="tv-tool-lock"
            onClick={onToggleLock}
            className={`h-8 w-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
              isLocked
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
          >
            {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>
          <div className="absolute left-11 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#1e222d] text-[#d1d4dc] border border-[#2a2e39] text-[11px] font-medium px-2.5 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
            <span>{isLocked ? 'Unlock All Drawing Tools' : 'Lock All Drawing Tools'}</span>
          </div>
        </div>

        {/* Hide / Show Drawings */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            id="tv-tool-hide"
            onClick={onToggleHideDrawings}
            className={`h-8 w-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
              hideDrawings
                ? 'bg-[#2a2e39] text-rose-400'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
          >
            {hideDrawings ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <div className="absolute left-11 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#1e222d] text-[#d1d4dc] border border-[#2a2e39] text-[11px] font-medium px-2.5 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
            <span>{hideDrawings ? 'Show Drawings' : 'Hide All Drawings'}</span>
          </div>
        </div>

        {/* Clear Drawings Trash */}
        <div className="relative group w-full flex justify-center">
          <button
            type="button"
            id="tv-tool-clear"
            onClick={onClearDrawings}
            disabled={drawingsCount === 0}
            className={`h-8 w-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
              drawingsCount > 0
                ? 'text-[#787b86] hover:text-rose-400 hover:bg-[#2a2e39]'
                : 'text-[#787b86]/40 cursor-not-allowed'
            }`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="absolute left-11 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#1e222d] text-[#d1d4dc] border border-[#2a2e39] text-[11px] font-medium px-2.5 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
            <span>Remove Drawings ({drawingsCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
