import React, { useState } from 'react';
import { 
  BellRing, 
  Bell, 
  BellOff, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  ShieldAlert, 
  Volume2, 
  VolumeX,
  Radio
} from 'lucide-react';
import { VolatilityAlert, MarketTicker } from '../../types';
import { soundEngine } from '../../utils/quantEngine';

interface VolatilityAlertsViewProps {
  alerts: VolatilityAlert[];
  tickers: MarketTicker[];
  onAddAlert: (alert: Omit<VolatilityAlert, 'id' | 'createdAt'>) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  isDark: boolean;
}

export const VolatilityAlertsView: React.FC<VolatilityAlertsViewProps> = ({
  alerts,
  tickers,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert,
  isDark,
}) => {
  const [symbol, setSymbol] = useState<string>('BTC/USDT');
  const [type, setType] = useState<VolatilityAlert['type']>('VOLATILITY_SPIKE');
  const [threshold, setThreshold] = useState<number>(3.5);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false);

  // Request Push Notification Permission
  const handleRequestPush = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        new Notification('QuantEdge Volatility Alerts Enabled', {
          body: 'You will receive real-time push notifications when statistical risk thresholds are breached.',
          icon: '/favicon.ico',
        });
        soundEngine.playAlert('success');
      }
    } catch (e) {
      console.error('Failed push permission:', e);
    }
  };

  // Send Test Push Alert
  const handleSendTestPush = () => {
    soundEngine.playAlert('warning');
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('⚠️ Volatility Alert: BTC/USDT', {
        body: '1-Minute Realized Volatility surged past 3.8% (3.2σ extension). Liquidity imbalance detected.',
      });
    }
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAlert({
      symbol,
      type,
      threshold,
      enabled: true,
      pushNotification: true,
      soundAlert: true,
    });
    soundEngine.playAlert('fill');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <BellRing className="h-5 w-5 animate-pulse" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Real-Time Volatility & Risk Alerts
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Configure automated browser push notifications and acoustic alerts for volatility spikes, spread widening, and liquidation surges.
          </p>
        </div>

        {/* Push Notification Status Banner */}
        <div className="flex items-center gap-3">
          {pushPermission === 'granted' ? (
            <button
              id="send-test-push-btn"
              onClick={handleSendTestPush}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition-colors cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>{testNotificationSent ? 'Push Dispatched!' : 'Test Volatility Shock Push'}</span>
            </button>
          ) : (
            <button
              id="enable-push-btn"
              onClick={handleRequestPush}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              <span>Enable Browser Push Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Create Alert on Left, Active Rules on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Alert Configuration Rule Form */}
        <div className="lg:col-span-4 space-y-4">
          <form
            onSubmit={handleCreateAlert}
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } shadow-xl space-y-4`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                New Volatility Rule
              </h3>
              <Radio className="h-4 w-4 text-cyan-400" />
            </div>

            {/* Asset Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Asset</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {tickers.map(t => (
                  <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                ))}
              </select>
            </div>

            {/* Trigger Type */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Anomaly Condition</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="VOLATILITY_SPIKE">1-Minute Realized Volatility Spike (%)</option>
                <option value="SPREAD_WIDENING">Spread Blowup (Basis Points)</option>
                <option value="PRICE_ABOVE">Price Rallies Above ($)</option>
                <option value="PRICE_BELOW">Price Drops Below ($)</option>
                <option value="DRAWDOWN_LIMIT">Portfolio Drawdown Exceeds (%)</option>
              </select>
            </div>

            {/* Threshold Input */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Trigger Threshold</span>
                <span className="text-amber-400 font-mono font-bold">{threshold}</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              id="create-alert-rule-btn"
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Arm Volatility Trigger</span>
            </button>
          </form>
        </div>

        {/* Right 8 Cols: Active Volatility Alerts List */}
        <div className="lg:col-span-8 space-y-4">
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-xl space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                Active Monitoring Rules ({alerts.length})
              </h3>
              <span className="text-xs text-slate-400">
                Automated background dispatch
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => {
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      alert.enabled
                        ? isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        : isDark ? 'bg-slate-950/40 border-slate-900 opacity-60' : 'bg-slate-100 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        alert.enabled
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-200">{alert.symbol}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {alert.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Threshold: <span className="text-amber-400 font-bold">{alert.threshold}</span>
                          {alert.lastTriggered && (
                            <span className="text-rose-400 ml-2">
                              • Last fired: {new Date(alert.lastTriggered).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleAlert(alert.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                          alert.enabled
                            ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {alert.enabled ? 'ACTIVE' : 'MUTED'}
                      </button>

                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
