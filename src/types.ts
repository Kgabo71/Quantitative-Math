export type AssetClass = 'crypto' | 'equity' | 'fx' | 'index' | 'commodity';

export interface MarketTicker {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  change24h: number;
  volume: number;
  volatility1m: number;
  type: AssetClass;
  timestamp: number;
}

export interface OrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  midPrice: number;
  imbalance: number; // -1 to 1 (negative = selling pressure, positive = buying pressure)
}

export interface MarketTrade {
  id: string;
  symbol: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface Candle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  ema50?: number;
  upperBand?: number;
  lowerBand?: number;
  rsi?: number;
}

// Interactive Quant Academy Types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface InteractiveParameter {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  description: string;
}

export interface Lesson {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  estimatedMinutes: number;
  category: string;
  summary: string;
  mathematicalFormula: string;
  formulaExplanation: string;
  theoryContent: string;
  codeSnippet: string;
  language: 'typescript' | 'python';
  interactiveParams: InteractiveParameter[];
  defaultSimulationType: 'mean_reversion' | 'momentum' | 'black_scholes' | 'order_book' | 'pairs_trading' | 'portfolio_opt';
  quizzes: QuizQuestion[];
  keyTakeaways: string[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  badge: string;
  iconName: string;
  lessons: Lesson[];
}

// Strategy & Backtesting Types
export type StrategyType = 
  | 'mean_reversion_bollinger'
  | 'dual_ema_crossover'
  | 'pairs_trading_stat_arb'
  | 'volatility_breakout_atr'
  | 'market_making_avellaneda'
  | 'ml_momentum_factor';

export interface BacktestConfig {
  strategyType: StrategyType;
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  leverage: number;
  makerFeeBps: number;
  takerFeeBps: number;
  slippageBps: number;
  stopLossPct: number;
  takeProfitPct: number;
  // Strategy specific parameters
  lookbackPeriod: number;
  zScoreThreshold: number;
  fastEma: number;
  slowEma: number;
  atrMultiplier: number;
  positionSizing: 'fixed' | 'kelly' | 'volatility_parity';
}

export interface BacktestTrade {
  id: string;
  symbol: string;
  type: 'BUY_LONG' | 'SELL_SHORT';
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  amount: number;
  pnl: number;
  pnlPct: number;
  slippagePaid: number;
  feesPaid: number;
  reason: 'take_profit' | 'stop_loss' | 'signal_flip' | 'end_of_period';
}

export interface EquityPoint {
  date: string;
  timestamp: number;
  equity: number;
  benchmarkEquity: number;
  drawdownPct: number;
}

export interface MonteCarloPath {
  id: number;
  finalEquity: number;
  data: { step: number; equity: number }[];
}

export interface BacktestResult {
  config: BacktestConfig;
  initialCapital: number;
  finalEquity: number;
  netProfit: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
  benchmarkReturnPct: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdownPct: number;
  maxDrawdownDurationDays: number;
  profitFactor: number;
  winRatePct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgTradeReturnPct: number;
  var95: number;
  var99: number;
  cvar95: number;
  beta: number;
  alphaAnnualizedPct: number;
  equityCurve: EquityPoint[];
  trades: BacktestTrade[];
  monteCarloPaths: MonteCarloPath[];
  monthlyReturns: { month: string; returnPct: number }[];
}

// Risk Management Types
export interface StressScenario {
  id: string;
  name: string;
  description: string;
  assetShockPct: Record<string, number>;
  volatilityShockPct: number;
  spreadMultiplier: number;
  estimatedPortfolioImpactPct: number;
  estimatedLossUsd: number;
}

export interface PositionRisk {
  symbol: string;
  side: 'LONG' | 'SHORT';
  amount: number;
  entryPrice: number;
  markPrice: number;
  notionalUsd: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  delta: number;
  gamma: number;
  liquidationPrice: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
}

// Trade Tracking & Journal Types
export interface TradeRecord {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_MARKET';
  price: number;
  amount: number;
  totalUsd: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  strategyTag: string;
  pnl?: number;
  pnlPct?: number;
  notes: string;
  createdAt: number;
  closedAt?: number;
}

// User Profile & Authentication
export interface UserProfile {
  id: string;
  name?: string;
  username?: string;
  email: string;
  role?: 'Junior Quant' | 'Senior Algorithmic Trader' | 'Head of Quantitative Research' | 'Risk Manager';
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';
  riskTolerance?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  avatarUrl?: string;
  balanceUsd: number;
  marginUsedUsd?: number;
  maxDailyLossLimitUsd?: number;
  maxPositionSizeUsd?: number;
  xpPoints: number;
  streakDays?: number;
  completedLessons: string[];
  bookmarkedLessons?: string[];
  watchlist?: string[];
  soundEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
}

// Chat Messages for AI Tutor
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

// Volatility Alerts & Notification
export interface VolatilityAlert {
  id: string;
  symbol: string;
  type: 'VOLATILITY_SPIKE' | 'PRICE_PERCENT_MOVE' | 'DRAWDOWN_BREACH' | 'ORDER_BOOK_IMBALANCE' | 'PRICE_ABOVE' | 'PRICE_BELOW' | 'SPREAD_WIDENING' | 'DRAWDOWN_LIMIT';
  threshold: number;
  enabled: boolean;
  pushNotification?: boolean;
  soundAlert?: boolean;
  lastTriggered?: number;
  createdAt: number;
}

export interface VolatilityAlertRule {
  id: string;
  symbol: string;
  type: 'VOLATILITY_SPIKE' | 'PRICE_PERCENT_MOVE' | 'DRAWDOWN_BREACH' | 'ORDER_BOOK_IMBALANCE';
  thresholdValue: number;
  timeWindowSeconds: number;
  enabled: boolean;
  lastTriggered?: number;
}

export interface AlertNotification {
  id: string;
  ruleId?: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  symbol?: string;
  read: boolean;
}
