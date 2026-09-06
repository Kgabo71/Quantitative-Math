import { Module } from '../types';

export const QUANT_MODULES: Module[] = [
  {
    id: 'mod-stat-arb',
    title: 'Statistical Arbitrage & Pairs Trading',
    description: 'Master cointegration, Ornstein-Uhlenbeck mean reversion, Z-score spread thresholds, and spread half-life computation.',
    badge: 'Core StatArb',
    iconName: 'GitCompare',
    lessons: [
      {
        id: 'lesson-cointegration-pairs',
        title: 'Cointegration & Synthetic Spread Construction',
        difficulty: 'Intermediate',
        estimatedMinutes: 12,
        category: 'Statistical Arbitrage',
        summary: 'Learn why correlation does not imply cointegration, and construct stationary linear combinations between asset pairs.',
        mathematicalFormula: 'S_t = \\ln(P_A(t)) - \\beta \\cdot \\ln(P_B(t)) - \\mu',
        formulaExplanation: 'The spread S_t is stationary if the residual of the linear regression between ln(P_A) and ln(P_B) satisfies the Augmented Dickey-Fuller (ADF) t-statistic threshold (p < 0.05).',
        theoryContent: `### Why Correlation Fails in High-Frequency Trading
Correlation measures simultaneous directional co-movement over a fixed window, but two highly correlated assets can drift permanently apart (spurious correlation). Cointegration guarantees that a linear combination of non-stationary time series forms a **stationary process** with a stable long-term mean $\\mu$ and finite variance $\\sigma^2$.

#### The Two-Step Engle-Granger Methodology:
1. **Regress Asset A on Asset B:**
   $$\\ln(P_A) = \\alpha + \\beta \\cdot \\ln(P_B) + \\epsilon_t$$
   Here $\\beta$ represents the dynamic **Hedge Ratio**.
2. **Test Residuals for Stationarity:** Run the Augmented Dickey-Fuller (ADF) test on $\\epsilon_t$. If $\\tau < -3.45$ (at 5% significance), reject the unit root null hypothesis.
3. **Compute Dynamic Z-Score:**
   $$Z_t = \\frac{S_t - \\text{EMA}(S_t, k)}{\\text{StdDev}(S_t, k)}$$
4. **Execution Rule:** Enter when $|Z_t| > Z_{\\text{entry}}$ (typically 2.0) and exit when $|Z_t| < Z_{\\text{exit}}$ (typically 0.25).`,
        codeSnippet: `// TypeScript: Dynamic Spread & Z-Score Computation
export function computePairsSpread(
  priceA: number[], 
  priceB: number[], 
  lookback: number = 30
): { spread: number[]; zScore: number[] } {
  const n = Math.min(priceA.length, priceB.length);
  const spread: number[] = [];
  const zScore: number[] = [];

  // Simple OLS Hedge Ratio (beta)
  let sumA = 0, sumB = 0, sumAB = 0, sumB2 = 0;
  for (let i = 0; i < lookback; i++) {
    sumA += priceA[i];
    sumB += priceB[i];
    sumAB += priceA[i] * priceB[i];
    sumB2 += priceB[i] * priceB[i];
  }
  const beta = (lookback * sumAB - sumA * sumB) / (lookback * sumB2 - sumB * sumB);

  for (let i = 0; i < n; i++) {
    const s = priceA[i] - beta * priceB[i];
    spread.push(s);
  }

  // Rolling Z-score
  for (let i = 0; i < n; i++) {
    if (i < lookback) {
      zScore.push(0);
      continue;
    }
    const window = spread.slice(i - lookback, i);
    const mean = window.reduce((a, b) => a + b, 0) / lookback;
    const variance = window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lookback;
    const std = Math.sqrt(variance) || 1e-6;
    zScore.push((spread[i] - mean) / std);
  }

  return { spread, zScore };
}`,
        language: 'typescript',
        interactiveParams: [
          { id: 'lookback', label: 'Rolling Lookback Window', min: 10, max: 100, step: 5, defaultValue: 30, unit: 'bars', description: 'Period to compute rolling mean and variance.' },
          { id: 'entryZ', label: 'Entry Z-Score Threshold', min: 1.0, max: 3.5, step: 0.1, defaultValue: 2.0, unit: 'σ', description: 'Standard deviations before triggering contrarian pair orders.' },
          { id: 'exitZ', label: 'Exit Z-Score Threshold', min: 0.0, max: 1.0, step: 0.05, defaultValue: 0.3, unit: 'σ', description: 'Mean reversion convergence target.' },
          { id: 'stopLossZ', label: 'Stop Loss Z-Score', min: 2.5, max: 5.0, step: 0.25, defaultValue: 3.5, unit: 'σ', description: 'Risk exit for cointegration breakdown.' }
        ],
        defaultSimulationType: 'pairs_trading',
        quizzes: [
          {
            id: 'q-cointeg-1',
            question: 'Why is cointegration preferred over Pearson correlation for statistical arbitrage?',
            options: [
              'Correlation requires more CPU compute time.',
              'Cointegration guarantees mean-reverting stationary residuals, preventing divergent spread drift.',
              'Correlation only works on crypto assets.',
              'Cointegration eliminates transaction fees entirely.'
            ],
            correctIndex: 1,
            explanation: 'Two series can have 0.99 correlation yet diverge indefinitely (e.g. two random walks with drift). Cointegration proves the spread between them is stationary and mean-reverting.'
          },
          {
            id: 'q-cointeg-2',
            question: 'What does the Ornstein-Uhlenbeck half-life parameter determine in pairs trading?',
            options: [
              'The expected number of bars for a deviation to revert 50% back toward its mean.',
              'The time until the asset company declares bankruptcy.',
              'The optimal leverage ratio according to the SEC.',
              'The frequency of exchange WebSocket heartbeat pings.'
            ],
            correctIndex: 0,
            explanation: 'Half-life = ln(2) / θ in an Ornstein-Uhlenbeck process. A short half-life indicates rapid mean reversion, ideal for high-frequency stat-arb.'
          }
        ],
        keyTakeaways: [
          'Stationarity of the spread is the prerequisite for statistical arbitrage.',
          'Always test the ADF t-statistic rather than assuming correlation holds over time.',
          'Dynamic hedge ratios (Kalman Filter) adapt faster than static linear regressions.'
        ]
      },
      {
        id: 'lesson-ou-mean-reversion',
        title: 'Ornstein-Uhlenbeck Modeling & Optimal Stopping',
        difficulty: 'Advanced',
        estimatedMinutes: 15,
        category: 'Statistical Arbitrage',
        summary: 'Formulate spread dynamics using continuous-time stochastic calculus and calculate optimal entry/exit levels.',
        mathematicalFormula: 'dX_t = \\theta (\\mu - X_t) dt + \\sigma dW_t',
        formulaExplanation: 'The Ornstein-Uhlenbeck SDE models mean-reverting velocity with reversion speed θ, long-term equilibrium μ, volatility σ, and standard Brownian motion W_t.',
        theoryContent: `### Continuous-Time Mean Reversion Mechanics
Unlike Geometric Brownian Motion (which models drifting non-stationary asset prices), the Ornstein-Uhlenbeck (O-U) process models a particle bound to an equilibrium state by a restoring spring force.

$$\\text{Half-life } t_{1/2} = \\frac{\\ln(2)}{\\theta}$$

When estimating $\\theta$ from discrete historical prices $\\Delta t$:
$$X_t = a + b X_{t-1} + \\epsilon_t \\implies \\theta = -\\frac{\\ln(b)}{\\Delta t}$$

#### Key Analytical Implications:
- If $\\theta \\le 0$, the process does not mean-revert; it is a random walk or explosive explosive series.
- Optimal exit thresholds are derived by solving the Hamilton-Jacobi-Bellman (HJB) variational inequality with transaction costs.`,
        codeSnippet: `// TypeScript: Ornstein-Uhlenbeck Parameter Estimation
export function estimateOrnsteinUhlenbeck(spread: number[], dt: number = 1.0) {
  const n = spread.length - 1;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = spread[i];
    const y = spread[i + 1];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const b = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const a = (sumY - b * sumX) / n;

  const theta = -Math.log(Math.max(b, 1e-4)) / dt;
  const mu = a / (1 - b);
  const halfLife = Math.log(2) / Math.max(theta, 1e-5);

  return { theta, mu, halfLife, b, a };
}`,
        language: 'typescript',
        interactiveParams: [
          { id: 'theta', label: 'Mean Reversion Speed (θ)', min: 0.05, max: 1.5, step: 0.05, defaultValue: 0.35, unit: 's⁻¹', description: 'Higher values mean faster return to equilibrium.' },
          { id: 'volatility', label: 'Diffusion Volatility (σ)', min: 0.1, max: 2.0, step: 0.1, defaultValue: 0.5, unit: 'vol', description: 'Random diffusion noise amplitude.' },
          { id: 'equilibrium', label: 'Long-term Mean (μ)', min: -5.0, max: 5.0, step: 0.5, defaultValue: 0.0, unit: 'pts', description: 'Center equilibrium level.' }
        ],
        defaultSimulationType: 'mean_reversion',
        quizzes: [
          {
            id: 'q-ou-1',
            question: 'What happens to the mean reversion half-life when theta increases?',
            options: [
              'Half-life decreases, meaning deviations revert faster.',
              'Half-life increases, meaning deviations last longer.',
              'Half-life becomes negative.',
              'Theta has no mathematical relation to half-life.'
            ],
            correctIndex: 0,
            explanation: 'Because half-life is ln(2)/θ, an increased theta (faster pull) directly compresses the time needed to revert 50% back to equilibrium.'
          }
        ],
        keyTakeaways: [
          'The O-U process provides continuous probability distributions of spread duration.',
          'Half-life gives algorithmic traders a clear holding-period expectation.',
          'Failing to verify θ > 0 leads to catastrophic trend-fighting losses.'
        ]
      }
    ]
  },
  {
    id: 'mod-derivatives-greeks',
    title: 'Options Pricing, Greeks & Volatility Surface',
    description: 'Master Black-Scholes-Merton equations, second-order Greeks (Gamma, Vanna, Charm), and Delta-Neutral Gamma scalping.',
    badge: 'Derivatives & Vol',
    iconName: 'Activity',
    lessons: [
      {
        id: 'lesson-black-scholes',
        title: 'Black-Scholes-Merton Analytic Engine',
        difficulty: 'Intermediate',
        estimatedMinutes: 15,
        category: 'Derivatives & Options',
        summary: 'Derive European Call & Put prices, understand risk-neutral pricing, and compute the fundamental Greeks.',
        mathematicalFormula: 'C(S,t) = S_t N(d_1) - K e^{-r(T-t)} N(d_2)',
        formulaExplanation: 'Where d_1 = [ln(S/K) + (r + \\sigma^2 / 2)\\tau] / (\\sigma \\sqrt{\\tau}) and d_2 = d_1 - \\sigma \\sqrt{\\tau}.',
        theoryContent: `### The Risk-Neutral Replication Principle
Fischer Black, Myron Scholes, and Robert Merton established that an option can be perfectly replicated by a continuously adjusted dynamic portfolio of the underlying stock and a risk-free bond:

$$\\Pi_t = V_t - \\Delta \\cdot S_t$$

By choosing $\\Delta = \\frac{\\partial V}{\\partial S}$, the randomness $dW_t$ is eliminated, proving the portfolio must earn the risk-free rate $r$.

#### Core First & Second Order Greeks:
- **Delta ($\\Delta = \\partial V / \\partial S$):** Hedge ratio / sensitivity to underlying price movement ($0 \\le \\Delta_{\\text{call}} \\le 1$).
- **Gamma ($\\Gamma = \\partial^2 V / \\partial S^2$):** Rate of change of Delta. Highest for at-the-money options near expiry.
- **Vega ($\\nu = \\partial V / \\partial \\sigma$):** Sensitivity to Implied Volatility ($S \\sqrt{\\tau} N'(d_1)$).
- **Theta ($\\Theta = \\partial V / \\partial t$):** Time decay of option extrinsic value per day.`,
        codeSnippet: `// TypeScript: Black-Scholes & Greeks Calculator
function cdf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * absX);
  const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return 0.5 * (1.0 + sign * erf);
}

function pdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function calcBlackScholesGreeks(
  S: number, K: number, T: number, r: number, sigma: number, isCall: boolean = true
) {
  if (T <= 0.001) T = 0.001;
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const price = isCall 
    ? S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2)
    : K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1);

  const delta = isCall ? cdf(d1) : cdf(d1) - 1;
  const gamma = pdf(d1) / (S * sigma * Math.sqrt(T));
  const vega = (S * pdf(d1) * Math.sqrt(T)) / 100; // per 1% vol
  const theta = (-(S * pdf(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * (isCall ? cdf(d2) : cdf(-d2))) / 365;

  return { price, delta, gamma, vega, theta, d1, d2 };
}`,
        language: 'typescript',
        interactiveParams: [
          { id: 'spot', label: 'Spot Price (S)', min: 50, max: 200, step: 1, defaultValue: 100, unit: '$', description: 'Current price of underlying asset.' },
          { id: 'strike', label: 'Strike Price (K)', min: 50, max: 200, step: 1, defaultValue: 100, unit: '$', description: 'Agreed exercise strike price.' },
          { id: 'timeToExpiry', label: 'Time to Expiry (T)', min: 0.02, max: 1.0, step: 0.02, defaultValue: 0.25, unit: 'yr', description: 'Fraction of year until expiration.' },
          { id: 'volatility', label: 'Implied Volatility (σ)', min: 0.05, max: 1.5, step: 0.05, defaultValue: 0.30, unit: '%', description: 'Annualized asset price volatility.' },
          { id: 'rate', label: 'Risk-Free Rate (r)', min: 0.0, max: 0.10, step: 0.005, defaultValue: 0.045, unit: '%', description: 'Annualized risk-free interest rate.' }
        ],
        defaultSimulationType: 'black_scholes',
        quizzes: [
          {
            id: 'q-bs-1',
            question: 'What does an At-The-Money (ATM) option Gamma reach as expiration (T -> 0) approaches?',
            options: [
              'Gamma approaches zero.',
              'Gamma spikes towards infinity (a Dirac delta function).',
              'Gamma remains constant at exactly 0.5.',
              'Gamma turns deeply negative.'
            ],
            correctIndex: 1,
            explanation: 'Because Delta transitions abruptly from 0 to 1 as S crosses K at expiry, the derivative of Delta (Gamma) approaches infinity near ATM expiration (pin risk).'
          }
        ],
        keyTakeaways: [
          'Delta neutral hedging eliminates first-order directional exposure.',
          'Long Gamma positions profit from realized volatility outperforming implied volatility.',
          'Theta is the cost paid by option buyers to hold convex Gamma exposure.'
        ]
      }
    ]
  },
  {
    id: 'mod-microstructure',
    title: 'High-Frequency Market Microstructure & Order Books',
    description: 'Analyze Level 2/3 Limit Order Books, Bid-Ask Spreads, Adverse Selection, and the Avellaneda-Stoikov Market Making Model.',
    badge: 'Microstructure & HFT',
    iconName: 'Cpu',
    lessons: [
      {
        id: 'lesson-avellaneda-stoikov',
        title: 'Avellaneda-Stoikov Optimal Market Making',
        difficulty: 'Master',
        estimatedMinutes: 20,
        category: 'Market Microstructure',
        summary: 'Formulate dynamic bid/ask quoting spreads to capture the bid-ask bounce while managing inventory risk.',
        mathematicalFormula: 'r(s, q, t) = s - q \\gamma \\sigma^2 (T - t)',
        formulaExplanation: 'Reservation price r shifts downward when holding long inventory q > 0 and upward when short q < 0 to incentivize inventory flattening.',
        theoryContent: `### Market Making as an Optimal Control Problem
A quantitative market maker continuously posts limit buy (bid) and limit sell (ask) orders, earning the half-spread $\\delta^a, \\delta^b$ on matched flow.

However, the market maker faces two existential risks:
1. **Inventory Risk:** Holding accumulated positions during hostile market trends ($q \\ne 0$).
2. **Adverse Selection:** Toxic flow from informed traders filling orders right before sharp price moves.

#### The Avellaneda-Stoikov Solution:
- **Reservation (Indifference) Price:**
  $$r(s, q, t) = s - q \\gamma \\sigma^2 (T - t)$$
  where $\\gamma$ is inventory risk aversion, and $\\sigma$ is asset volatility.
- **Optimal Spread Distance:**
  $$\\delta^a + \\delta^b = \\gamma \\sigma^2 (T - t) + \\frac{2}{\\gamma} \\ln\\left(1 + \\frac{\\gamma}{\\kappa}\\right)$$
- **Asymmetric Quotes:**
  $$p^a = r + \\frac{\\delta}{2}, \\quad p^b = r - \\frac{\\delta}{2}$$`,
        codeSnippet: `// TypeScript: Avellaneda-Stoikov Quoter
export function calcAvellanedaQuotes(
  midPrice: number,
  inventory: number, // positive = long, negative = short
  volatility: number,
  gammaRiskAversion: number = 0.1,
  orderArrivalDensity: number = 1.5,
  timeRemaining: number = 1.0
) {
  // Reservation price adjusts for inventory penalty
  const reservationPrice = midPrice - inventory * gammaRiskAversion * (volatility ** 2) * timeRemaining;

  // Optimal total spread width
  const halfSpread = 0.5 * (
    gammaRiskAversion * (volatility ** 2) * timeRemaining +
    (2 / gammaRiskAversion) * Math.log(1 + gammaRiskAversion / orderArrivalDensity)
  );

  const optimalAsk = reservationPrice + halfSpread;
  const optimalBid = reservationPrice - halfSpread;

  return {
    reservationPrice,
    optimalBid,
    optimalAsk,
    spread: optimalAsk - optimalBid,
    bidDistance: midPrice - optimalBid,
    askDistance: optimalAsk - midPrice
  };
}`,
        language: 'typescript',
        interactiveParams: [
          { id: 'inventory', label: 'Current Inventory (q)', min: -20, max: 20, step: 1, defaultValue: 8, unit: 'contracts', description: 'Current accumulated inventory position.' },
          { id: 'gamma', label: 'Risk Aversion Parameter (γ)', min: 0.01, max: 0.5, step: 0.01, defaultValue: 0.15, unit: '', description: 'Penalizes holding unhedged inventory.' },
          { id: 'volatility', label: 'Mid-Price Volatility (σ)', min: 0.01, max: 0.20, step: 0.01, defaultValue: 0.08, unit: '', description: 'High volatility widens optimal quoting spread.' }
        ],
        defaultSimulationType: 'order_book',
        quizzes: [
          {
            id: 'q-as-1',
            question: 'If a market maker is long +15 contracts (q > 0), how does the Avellaneda-Stoikov model adjust their quotes?',
            options: [
              'Quotes are shifted upwards to buy even more inventory.',
              'Reservation price shifts downwards: the MM posts an attractive lower ask to unload inventory and lowers their bid to avoid buying.',
              'The market maker ceases quoting altogether.',
              'The bid and ask spreads remain perfectly symmetric.'
            ],
            correctIndex: 1,
            explanation: 'When long inventory, reservation price drops below mid-price, tilting quotes down to accelerate sell fills and deter buy fills.'
          }
        ],
        keyTakeaways: [
          'Spread width must dynamically expand during high volatility periods.',
          'Inventory skewness is essential to avoid toxic directional bag-holding.',
          'Order Flow Imbalance (OFI) gives short-horizon lead time on book pressure.'
        ]
      }
    ]
  },
  {
    id: 'mod-momentum-trend',
    title: 'Quantitative Trend Following & Momentum',
    description: 'Explore multi-timeframe moving average filters, Average True Range (ATR) volatility channels, and time-series momentum.',
    badge: 'Trend & Momentum',
    iconName: 'TrendingUp',
    lessons: [
      {
        id: 'lesson-dual-ema-atr',
        title: 'Adaptive Dual EMA with ATR Volatility Filter',
        difficulty: 'Beginner',
        estimatedMinutes: 10,
        category: 'Momentum Trading',
        summary: 'Build a systematic trend following model that scales position sizes inversely with market volatility.',
        mathematicalFormula: '\\text{Position Size} = \\frac{\\text{Capital} \\times \\text{Risk \\%}}{\\text{ATR}(14) \\times \\text{Point Value}}',
        formulaExplanation: 'Volatility parity position sizing ensures every trade risks identical portfolio basis points regardless of asset volatility regime.',
        theoryContent: `### Systematic Trend Following Principles
Trend following exploits behavioral under-reaction (investors slowly adjusting to new fundamental information) and subsequent herd momentum.

#### The 3 Pillars of a Robust Trend Engine:
1. **Trend Filter:** Fast EMA crossing Slow EMA ($EMA_{12} > EMA_{50}$).
2. **Breakout Confirmation:** Closing price exceeds the 20-period Donchian Upper Channel.
3. **Volatility Parity Risk Sizing:** Size inversely proportional to market noise (ATR). When volatility surges, positions automatically contract.`,
        codeSnippet: `// TypeScript: Dual EMA + ATR Volatility Sizing
export function computeTrendSignals(
  prices: number[],
  highs: number[],
  lows: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 50,
  atrPeriod: number = 14
) {
  // Compute Exponential Moving Average
  function calcEma(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  }

  const fastEma = calcEma(prices, fastPeriod);
  const slowEma = calcEma(prices, slowPeriod);

  // Compute ATR
  const atr: number[] = [highs[0] - lows[0]];
  for (let i = 1; i < prices.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - prices[i - 1]),
      Math.abs(lows[i] - prices[i - 1])
    );
    atr.push((atr[i - 1] * (atrPeriod - 1) + tr) / atrPeriod);
  }

  return { fastEma, slowEma, atr };
}`,
        language: 'typescript',
        interactiveParams: [
          { id: 'fastEma', label: 'Fast EMA Period', min: 5, max: 30, step: 1, defaultValue: 12, unit: 'bars', description: 'Fast responsive trend line.' },
          { id: 'slowEma', label: 'Slow EMA Period', min: 20, max: 100, step: 5, defaultValue: 50, unit: 'bars', description: 'Slow baseline trend filter.' },
          { id: 'atrMult', label: 'ATR Trailing Stop Multiplier', min: 1.0, max: 5.0, step: 0.25, defaultValue: 2.5, unit: 'x', description: 'Distance for volatility-based trailing stop.' }
        ],
        defaultSimulationType: 'momentum',
        quizzes: [
          {
            id: 'q-trend-1',
            question: 'Why is volatility parity position sizing crucial in multi-asset trend following portfolios?',
            options: [
              'It eliminates the need to pay exchange trading commissions.',
              'It equalizes risk contributions so high-volatility assets do not dominate portfolio variance.',
              'It ensures the strategy always achieves a 100% win rate.',
              'It automatically predicts the exact top of every market cycle.'
            ],
            correctIndex: 1,
            explanation: 'Without volatility normalization, a high-beta crypto or volatile tech stock would drive 90% of portfolio PnL, rendering bond/FX trend signals meaningless.'
          }
        ],
        keyTakeaways: [
          'Trend following has positive skewness: many small losses cut fast, few large outsized winners.',
          'ATR-based stops prevent getting shaken out during normal market noise.',
          'Never optimize indicator periods on past data without walk-forward out-of-sample testing.'
        ]
      }
    ]
  },
  {
    id: 'mod-portfolio-opt',
    title: 'Portfolio Optimization, Markowitz & Risk Factors',
    description: 'Learn modern portfolio theory (MPT), Sharpe ratio maximization, Kelly Criterion sizing, and Value-at-Risk (VaR/CVaR).',
    badge: 'Portfolio & Risk',
    iconName: 'PieChart',
    lessons: [
      {
        id: 'lesson-markowitz-sharpe',
        title: 'Modern Portfolio Theory & The Efficient Frontier',
        difficulty: 'Intermediate',
        estimatedMinutes: 14,
        category: 'Portfolio Management',
        summary: 'Derive the Markowitz Tangency Portfolio that maximizes the Sharpe Ratio through covariance diversification.',
        mathematicalFormula: '\\max_{w} \\frac{w^T \\mu - r_f}{\\sqrt{w^T \\Sigma w}} \\quad \\text{s.t.} \\quad \\sum w_i = 1',
        formulaExplanation: 'Where w is asset weight vector, μ is expected returns vector, Σ is covariance matrix, and r_f is risk-free rate.',
        theoryContent: `### The Power of Non-Correlated Asset Covariance
Harry Markowitz proved that the risk of a portfolio (variance $\\sigma_p^2$) is not the weighted average of individual asset risks, but is governed by their pairwise covariance $\\sigma_{ij}$:

$$\\sigma_p^2 = \\sum_i w_i^2 \\sigma_i^2 + \\sum_i \\sum_{j \\ne i} w_i w_j \\sigma_{ij}$$

When correlation $\\rho_{ij} < 1$, combining assets reduces portfolio risk without sacrificing expected return.

#### Risk Metrics Used by Prime Brokers:
- **Value at Risk (VaR 99%):** Maximum expected loss over a 1-day horizon at 99% confidence level ($-\\mu + 2.33 \\cdot \\sigma$).
- **Expected Shortfall (CVaR):** The average loss conditional on the loss exceeding the VaR threshold (captures tail risk).
- **Kelly Criterion ($f^* = \\frac{p b - q}{b}$):** Mathematically optimal capital fraction to maximize logarithmic growth rate.`,
        codeSnippet: `// TypeScript: Two-Asset Efficient Frontier Calculator
export function calcTwoAssetFrontier(
  r1: number, r2: number,
  vol1: number, vol2: number,
  correlation: number,
  riskFreeRate: number = 0.04
) {
  const points = [];
  for (let w1 = 0; w1 <= 1.0; w1 += 0.05) {
    const w2 = 1.0 - w1;
    const expReturn = w1 * r1 + w2 * r2;
    const portfolioVariance = (w1 ** 2) * (vol1 ** 2) + 
                              (w2 ** 2) * (vol2 ** 2) + 
                              2 * w1 * w2 * vol1 * vol2 * correlation;
    const portfolioVol = Math.sqrt(portfolioVariance);
    const sharpe = (expReturn - riskFreeRate) / (portfolioVol || 1e-6);

    points.push({
      weightAsset1: Number(w1.toFixed(2)),
      weightAsset2: Number(w2.toFixed(2)),
      expectedReturn: Number((expReturn * 100).toFixed(2)),
      volatility: Number((portfolioVol * 100).toFixed(2)),
      sharpeRatio: Number(sharpe.toFixed(2))
    });
  }

  // Find max Sharpe Tangency point
  const tangency = points.reduce((best, p) => p.sharpeRatio > best.sharpeRatio ? p : best, points[0]);

  return { points, tangency };
}`,
        language: 'typescript',
        interactiveParams: [
          { id: 'corr', label: 'Correlation (ρ₁₂)', min: -0.9, max: 0.9, step: 0.1, defaultValue: 0.1, unit: '', description: 'Correlation between Asset 1 and Asset 2.' },
          { id: 'ret1', label: 'Asset 1 Expected Return', min: 0.04, max: 0.35, step: 0.01, defaultValue: 0.18, unit: '%', description: 'Expected annual return for Asset 1.' },
          { id: 'vol1', label: 'Asset 1 Volatility', min: 0.10, max: 0.60, step: 0.02, defaultValue: 0.28, unit: '%', description: 'Annualized volatility for Asset 1.' },
          { id: 'ret2', label: 'Asset 2 Expected Return', min: 0.02, max: 0.20, step: 0.01, defaultValue: 0.08, unit: '%', description: 'Expected annual return for Asset 2.' },
          { id: 'vol2', label: 'Asset 2 Volatility', min: 0.05, max: 0.30, step: 0.01, defaultValue: 0.12, unit: '%', description: 'Annualized volatility for Asset 2.' }
        ],
        defaultSimulationType: 'portfolio_opt',
        quizzes: [
          {
            id: 'q-mpt-1',
            question: 'What is the diversification effect when two assets have a correlation of ρ = -1.0?',
            options: [
              'Portfolio risk increases exponentially.',
              'A specific weight combination exists that yields zero portfolio variance with positive expected return.',
              'No combination can be calculated.',
              'The Sharpe ratio drops to zero.'
            ],
            correctIndex: 1,
            explanation: 'With perfect negative correlation (ρ = -1), variance can be completely neutralized: w1*σ1 = w2*σ2, yielding a riskless synthetic asset earning the weighted return.'
          }
        ],
        keyTakeaways: [
          'Diversification is the only "free lunch" in financial economics.',
          'Always optimize for Expected Shortfall (CVaR) instead of simple variance when returns exhibit fat tails.',
          'Never use full Kelly sizing in live trading—use Half-Kelly or Fractional Kelly (0.25x - 0.5x) to withstand estimation errors.'
        ]
      }
    ]
  }
];
