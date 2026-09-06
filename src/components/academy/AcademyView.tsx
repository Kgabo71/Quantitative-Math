import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Award, 
  CheckCircle2, 
  Code, 
  Sliders, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronRight,
  TrendingUp,
  Activity,
  Cpu,
  PieChart,
  Bot
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QUANT_MODULES } from '../../data/curriculumData';
import { Lesson, Module, UserProfile } from '../../types';
import { soundEngine } from '../../utils/quantEngine';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  AreaChart, 
  Area 
} from 'recharts';

interface AcademyViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onNavigateToTutor: (topic: string) => void;
  isDark: boolean;
}

export const AcademyView: React.FC<AcademyViewProps> = ({
  user,
  onUpdateUser,
  onNavigateToTutor,
  isDark,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(QUANT_MODULES[0].id);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(QUANT_MODULES[0].lessons[0].id);
  const [codeLanguage, setCodeLanguage] = useState<'typescript' | 'python'>('typescript');
  const [copied, setCopied] = useState(false);

  // Dynamic slider values for the active lesson
  const currentModule = QUANT_MODULES.find(m => m.id === selectedModuleId) || QUANT_MODULES[0];
  const currentLesson = currentModule.lessons.find(l => l.id === selectedLessonId) || currentModule.lessons[0];

  const [paramValues, setParamValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    currentLesson.interactiveParams.forEach(p => {
      initial[p.id] = p.defaultValue;
    });
    return initial;
  });

  // Update params when lesson changes
  const handleSelectLesson = (lesson: Lesson, moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedLessonId(lesson.id);
    const initial: Record<string, number> = {};
    lesson.interactiveParams.forEach(p => {
      initial[p.id] = p.defaultValue;
    });
    setParamValues(initial);
    setSelectedQuizOption({});
    setQuizSubmitted({});
  };

  // Quiz state
  const [selectedQuizOption, setSelectedQuizOption] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  const handleSelectOption = (quizId: string, optionIndex: number) => {
    if (quizSubmitted[quizId]) return;
    setSelectedQuizOption(prev => ({ ...prev, [quizId]: optionIndex }));
  };

  const handleCheckQuiz = (quizId: string, correctIndex: number) => {
    setQuizSubmitted(prev => ({ ...prev, [quizId]: true }));
    const isCorrect = selectedQuizOption[quizId] === correctIndex;
    if (isCorrect) {
      soundEngine.playAlert('success');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      // Award XP
      const newXp = user.xpPoints + 50;
      const completed = Array.from(new Set([...user.completedLessons, currentLesson.id]));
      onUpdateUser({ xpPoints: newXp, completedLessons: completed });
    } else {
      soundEngine.playAlert('warning');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentLesson.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate live simulation data based on the interactive parameter sliders
  const simulationChartData = useMemo(() => {
    const data: any[] = [];
    const type = currentLesson.defaultSimulationType;

    if (type === 'pairs_trading' || type === 'mean_reversion') {
      const lookback = paramValues['lookback'] || 30;
      const entryZ = paramValues['entryZ'] || 2.0;
      const exitZ = paramValues['exitZ'] || 0.3;
      const theta = paramValues['theta'] || 0.35;
      const sigma = paramValues['volatility'] || 0.5;

      let spread = 0;
      for (let t = 0; t < 60; t++) {
        // Discrete O-U process step
        const noise = (Math.sin(t * 0.4) + Math.cos(t * 0.7) * 0.5 + (Math.random() - 0.5) * 0.8) * sigma;
        spread = spread + theta * (0 - spread) * 0.5 + noise;
        const z = spread / (sigma || 0.5);

        data.push({
          step: `t+${t}`,
          spread: Number(spread.toFixed(2)),
          zScore: Number(z.toFixed(2)),
          upperThreshold: entryZ,
          lowerThreshold: -entryZ,
          exitUpper: exitZ,
          exitLower: -exitZ,
          action: z > entryZ ? 'Short Spread' : z < -entryZ ? 'Long Spread' : 'Neutral'
        });
      }
    } else if (type === 'black_scholes') {
      const S = paramValues['spot'] || 100;
      const K = paramValues['strike'] || 100;
      const T = paramValues['timeToExpiry'] || 0.25;
      const sigma = paramValues['volatility'] || 0.30;
      const r = paramValues['rate'] || 0.045;

      // Generate spot range curve
      for (let spot = S * 0.7; spot <= S * 1.3; spot += (S * 0.6) / 30) {
        const d1 = (Math.log(spot / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        const d2 = d1 - sigma * Math.sqrt(T);

        // Approximate normal CDF
        const normCdf = (x: number) => {
          const t = 1 / (1 + 0.2316419 * Math.abs(x));
          const d = 0.3989423 * Math.exp(-x * x / 2);
          let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
          return x > 0 ? 1 - p : p;
        };

        const callPrice = spot * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2);
        const delta = normCdf(d1);
        const gamma = (Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI)) / (spot * sigma * Math.sqrt(T));

        data.push({
          spot: Number(spot.toFixed(1)),
          callPrice: Number(Math.max(0, callPrice).toFixed(2)),
          delta: Number(delta.toFixed(3)),
          gamma: Number((gamma * 100).toFixed(3)),
          intrinsicValue: Number(Math.max(0, spot - K).toFixed(2))
        });
      }
    } else if (type === 'order_book') {
      const inv = paramValues['inventory'] || 8;
      const gamma = paramValues['gamma'] || 0.15;
      const vol = paramValues['volatility'] || 0.08;
      const mid = 100;

      const reservationPrice = mid - inv * gamma * (vol ** 2);
      const halfSpread = 0.5 * (gamma * (vol ** 2) + (2 / gamma) * Math.log(1 + gamma / 1.5));

      for (let i = -15; i <= 15; i++) {
        const testInv = i;
        const resP = mid - testInv * gamma * (vol ** 2);
        data.push({
          inventory: testInv,
          reservationPrice: Number(resP.toFixed(2)),
          optimalBid: Number((resP - halfSpread).toFixed(2)),
          optimalAsk: Number((resP + halfSpread).toFixed(2)),
          midPrice: mid
        });
      }
    } else {
      // General momentum & trend
      const fast = paramValues['fastEma'] || 12;
      const slow = paramValues['slowEma'] || 50;
      let p = 100;
      for (let i = 0; i < 40; i++) {
        p += (Math.sin(i * 0.3) * 1.5) + (i * 0.35);
        data.push({
          bar: `b${i}`,
          price: Number(p.toFixed(2)),
          fastTrend: Number((p * 0.98 + (fast / 50)).toFixed(2)),
          slowTrend: Number((98 + i * 0.25).toFixed(2))
        });
      }
    }

    return data;
  }, [currentLesson, paramValues]);

  const isCompleted = user.completedLessons.includes(currentLesson.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Academy Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <GraduationCap className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Quantitative Finance Academy
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Interactive mathematical models, algorithmic derivations, live parameter sandboxes, and code implementations.
          </p>
        </div>

        {/* Progress Stats */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="text-right">
              <div className="text-xs text-slate-400">Curriculum Progress</div>
              <div className="text-sm font-bold text-cyan-400">
                {user.completedLessons.length} / {QUANT_MODULES.reduce((acc, m) => acc + m.lessons.length, 0)} Lessons
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Modules & Lessons Navigation */}
        <div className="lg:col-span-4 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Curriculum Disciplines
          </div>

          <div className="space-y-3">
            {QUANT_MODULES.map((module) => {
              const isSelectedModule = module.id === selectedModuleId;
              return (
                <div
                  key={module.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    isSelectedModule
                      ? isDark ? 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/40' : 'bg-white border-cyan-300 shadow-md'
                      : isDark ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Module Header */}
                  <div
                    onClick={() => setSelectedModuleId(module.id)}
                    className="p-3.5 cursor-pointer flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isDark ? 'bg-cyan-950/60 border-cyan-800 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
                        }`}>
                          {module.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-200 leading-snug">
                        {module.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  {/* Module Lessons List */}
                  <div className={`border-t px-2 py-2 space-y-1 ${
                    isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
                  }`}>
                    {module.lessons.map((lesson) => {
                      const isLessonActive = lesson.id === selectedLessonId;
                      const isLessonCompleted = user.completedLessons.includes(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          id={`lesson-select-${lesson.id}`}
                          onClick={() => handleSelectLesson(lesson, module.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            isLessonActive
                              ? isDark ? 'bg-cyan-600/20 text-cyan-300 font-semibold border border-cyan-500/40' : 'bg-cyan-100 text-cyan-900 font-semibold border border-cyan-300'
                              : isDark ? 'text-slate-300 hover:bg-slate-800/60' : 'text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isLessonCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <BookOpen className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                            {lesson.estimatedMinutes}m
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Main Panel: Active Lesson Content & Interactive Sandbox */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lesson Header Card */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          } shadow-xl`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                  {currentLesson.category}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  {currentLesson.difficulty}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  {currentLesson.estimatedMinutes} min
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="ask-tutor-lesson-btn"
                  onClick={() => onNavigateToTutor(currentLesson.title)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 transition-colors"
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>Ask AI Tutor</span>
                </button>

                {isCompleted && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
                    <Check className="h-3.5 w-3.5" /> Completed
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-100 mb-2">
              {currentLesson.title}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {currentLesson.summary}
            </p>

            {/* Mathematical Formulation Callout */}
            <div className={`mt-5 p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                <Sparkles className="h-4 w-4" />
                Mathematical Formulation
              </div>
              <div className="font-mono text-base md:text-lg bg-black/40 border border-slate-800/80 p-3 rounded-lg text-cyan-300 overflow-x-auto text-center font-bold">
                {currentLesson.mathematicalFormula}
              </div>
              <p className="text-xs text-slate-400 mt-2 italic">
                {currentLesson.formulaExplanation}
              </p>
            </div>
          </div>

          {/* Interactive Simulation Sandbox */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Live Interactive Parameter Sandbox
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Adjust sliders to simulate mathematical dynamics
              </span>
            </div>

            {/* Parameter Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentLesson.interactiveParams.map((param) => {
                const val = paramValues[param.id] ?? param.defaultValue;
                return (
                  <div
                    key={param.id}
                    className={`p-3 rounded-xl border ${
                      isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">{param.label}</span>
                      <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                        {val} {param.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      value={val}
                      onChange={(e) => setParamValues(prev => ({ ...prev, [param.id]: parseFloat(e.target.value) }))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {param.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Live Chart Rendering */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-mono text-slate-400 mb-2 flex items-center justify-between">
                <span>Model Output Visualization ({currentLesson.defaultSimulationType.replace('_', ' ').toUpperCase()})</span>
                <span className="text-cyan-400 flex items-center gap-1">
                  <Activity className="h-3 w-3 animate-pulse" /> Live Dynamic Simulation
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {currentLesson.defaultSimulationType === 'pairs_trading' || currentLesson.defaultSimulationType === 'mean_reversion' ? (
                    <LineChart data={simulationChartData}>
                      <XAxis dataKey="step" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <ReferenceLine y={paramValues['entryZ'] || 2.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '+Entry σ', fill: '#ef4444', fontSize: 10 }} />
                      <ReferenceLine y={-(paramValues['entryZ'] || 2.0)} stroke="#22c55e" strokeDasharray="3 3" label={{ value: '-Entry σ', fill: '#22c55e', fontSize: 10 }} />
                      <ReferenceLine y={0} stroke="#64748b" />
                      <Line type="monotone" dataKey="zScore" stroke="#38bdf8" strokeWidth={2} dot={false} name="Spread Z-Score" />
                    </LineChart>
                  ) : currentLesson.defaultSimulationType === 'black_scholes' ? (
                    <AreaChart data={simulationChartData}>
                      <XAxis dataKey="spot" stroke="#64748b" fontSize={10} label={{ value: 'Underlying Spot ($)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 10 }} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <ReferenceLine x={paramValues['strike'] || 100} stroke="#f59e0b" label={{ value: 'Strike K', fill: '#f59e0b', fontSize: 10 }} />
                      <Area type="monotone" dataKey="callPrice" stroke="#818cf8" fill="#818cf8" fillOpacity={0.2} name="Call Option Premium ($)" />
                      <Line type="monotone" dataKey="delta" stroke="#34d399" strokeWidth={2} dot={false} name="Delta" />
                    </AreaChart>
                  ) : currentLesson.defaultSimulationType === 'order_book' ? (
                    <LineChart data={simulationChartData}>
                      <XAxis dataKey="inventory" stroke="#64748b" fontSize={10} label={{ value: 'Inventory (q)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 10 }} />
                      <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <ReferenceLine y={100} stroke="#64748b" strokeDasharray="3 3" label={{ value: 'Mid-Price $100', fill: '#64748b', fontSize: 10 }} />
                      <Line type="monotone" dataKey="optimalAsk" stroke="#ef4444" strokeWidth={2} dot={false} name="Optimal Ask Quoted" />
                      <Line type="monotone" dataKey="reservationPrice" stroke="#38bdf8" strokeWidth={2} dot={false} name="Reservation Price" />
                      <Line type="monotone" dataKey="optimalBid" stroke="#22c55e" strokeWidth={2} dot={false} name="Optimal Bid Quoted" />
                    </LineChart>
                  ) : (
                    <LineChart data={simulationChartData}>
                      <XAxis dataKey="bar" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Line type="monotone" dataKey="price" stroke="#f8fafc" strokeWidth={2} dot={false} name="Asset Price" />
                      <Line type="monotone" dataKey="fastTrend" stroke="#38bdf8" strokeWidth={1.5} dot={false} name="Fast EMA" />
                      <Line type="monotone" dataKey="slowTrend" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Slow EMA" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Theory & Mechanism Breakdown */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
          } shadow-xl`}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">
                Quantitative Theory & Mechanism Breakdown
              </h3>
            </div>

            <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-3">
              {currentLesson.theoryContent.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('### ')) {
                  return <h4 key={idx} className="text-base font-bold text-cyan-400 mt-4 mb-2">{paragraph.replace('### ', '')}</h4>;
                }
                if (paragraph.startsWith('#### ')) {
                  return <h5 key={idx} className="text-sm font-bold text-slate-200 mt-3 mb-1">{paragraph.replace('#### ', '')}</h5>;
                }
                return <p key={idx} className="text-slate-300 text-sm leading-relaxed">{paragraph}</p>;
              })}
            </div>

            {/* Key Takeaways */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Senior Researcher Key Takeaways:
              </h4>
              <ul className="space-y-1.5">
                {currentLesson.keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Code Implementation Sandbox */}
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-800'
          } shadow-xl`}>
            <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  Algorithm Implementation ({codeLanguage.toUpperCase()})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 overflow-x-auto">
              <pre className="font-mono text-xs text-cyan-300/90 leading-relaxed selection:bg-cyan-500/30">
                <code>{currentLesson.codeSnippet}</code>
              </pre>
            </div>
          </div>

          {/* Interactive Knowledge Quiz */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Concept Mastery Challenge
                </h3>
              </div>
              <span className="text-xs font-semibold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800">
                +50 XP per correct quiz
              </span>
            </div>

            <div className="space-y-6">
              {currentLesson.quizzes.map((quiz, qIdx) => {
                const isSelected = selectedQuizOption[quiz.id] !== undefined;
                const isSubmitted = quizSubmitted[quiz.id];
                const selectedOpt = selectedQuizOption[quiz.id];
                const isCorrect = selectedOpt === quiz.correctIndex;

                return (
                  <div
                    key={quiz.id}
                    className={`p-4 rounded-xl border ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-200 mb-3">
                      {qIdx + 1}. {quiz.question}
                    </div>

                    <div className="space-y-2 mb-3">
                      {quiz.options.map((option, optIdx) => {
                        const optSelected = selectedOpt === optIdx;
                        let optionStyle = isDark
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700';

                        if (isSubmitted) {
                          if (optIdx === quiz.correctIndex) {
                            optionStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-semibold';
                          } else if (optSelected && !isCorrect) {
                            optionStyle = 'bg-rose-950/80 border-rose-500 text-rose-300';
                          }
                        } else if (optSelected) {
                          optionStyle = isDark
                            ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-semibold'
                            : 'bg-cyan-100 border-cyan-500 text-cyan-900 font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            id={`quiz-${quiz.id}-opt-${optIdx}`}
                            onClick={() => handleSelectOption(quiz.id, optIdx)}
                            className={`w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${optionStyle}`}
                          >
                            <span>{option}</span>
                            {isSubmitted && optIdx === quiz.correctIndex && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {!isSubmitted ? (
                      <button
                        id={`submit-quiz-${quiz.id}`}
                        disabled={!isSelected}
                        onClick={() => handleCheckQuiz(quiz.id, quiz.correctIndex)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
                        isCorrect
                          ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                      }`}>
                        <div className="font-bold mb-1">
                          {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                        </div>
                        {quiz.explanation}
                      </div>
                    )}
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
