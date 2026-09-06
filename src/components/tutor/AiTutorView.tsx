import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Code, 
  BookOpen, 
  HelpCircle, 
  Check, 
  Copy, 
  RotateCcw,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../../types';
import { soundEngine } from '../../utils/quantEngine';

interface AiTutorViewProps {
  user: UserProfile;
  initialTopic?: string;
  isDark: boolean;
}

export const AiTutorView: React.FC<AiTutorViewProps> = ({
  user,
  initialTopic,
  isDark,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: "Hello! I am your Senior Quantitative Finance & Algorithmic Trading Mentor powered by Gemini 3.8. Ask me to derive stochastic differential equations (Itô calculus), explain Black-Scholes Greeks, design cointegrated Stat-Arb pairs models, optimize portfolio risk, or audit your trading algorithms.",
      timestamp: Date.now(),
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If initial topic provided from lesson
  useEffect(() => {
    if (initialTopic) {
      const prompt = `Can you explain the mathematical foundation and practical trading application of "${initialTopic}"?`;
      handleSendMessage(prompt);
    }
  }, [initialTopic]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context: `User completed lessons: ${user.completedLessons.join(', ')}. User XP: ${user.xpPoints}. User Level: ${user.level}.`,
          userLevel: user.level,
        }),
      });

      const data = await response.json();
      const aiReplyText = data.reply || "I'm analyzing your quantitative query. Let's look into the stochastic mechanics and risk parameters.";

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
      soundEngine.playAlert('success');
    } catch (err) {
      console.error('AI Tutor failed:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: "I experienced a momentary connection timeout. Please try asking your question again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const starterPrompts = [
    "Explain how Cointegration differs from Correlation in Statistical Arbitrage.",
    "Derive the Black-Scholes PDE using Itô's Lemma and Delta hedging.",
    "Why does high negative Gamma create explosive risk for market makers during volatility spikes?",
    "How does the Avellaneda-Stoikov model dynamically adjust bid/ask quotes based on inventory?",
    "Explain how to construct a Minimum Variance Portfolio using covariance shrinkage (Ledoit-Wolf)."
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-950">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Gemini Quantitative Tutor
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                Gemini 3.8 Flash
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive mathematical derivations, code auditing, and algorithmic trading guidance.
            </p>
          </div>
        </div>
      </div>

      {/* Starter Prompts Carousel */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          Recommended Deep-Dive Inquiries
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {starterPrompts.map((prompt, idx) => (
            <button
              key={idx}
              id={`starter-prompt-${idx}`}
              onClick={() => handleSendMessage(prompt)}
              className={`p-2.5 rounded-xl border text-xs text-left whitespace-normal shrink-0 max-w-xs transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-200 hover:border-cyan-400 text-slate-700 hover:text-slate-900'
              }`}
            >
              <div className="line-clamp-2 leading-snug">{prompt}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className={`p-6 rounded-2xl border min-h-[420px] max-h-[550px] overflow-y-auto space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } shadow-xl`}>
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
            >
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                isAi
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-cyan-600 text-white shadow-md'
              }`}>
                {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div className={`p-4 rounded-2xl max-w-2xl text-xs leading-relaxed ${
                isAi
                  ? isDark
                    ? 'bg-slate-950/80 border border-slate-800 text-slate-200'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                  : 'bg-cyan-600 text-white font-medium shadow-md shadow-cyan-600/20'
              }`}>
                {isAi ? (
                  <div className="space-y-2">
                    {msg.text.split('\n\n').map((para, i) => {
                      if (para.startsWith('```')) {
                        const code = para.replace(/```[a-z]*\n?/g, '');
                        return (
                          <pre key={i} className="p-3 bg-black/60 border border-slate-800 rounded-lg text-cyan-300 font-mono text-[11px] overflow-x-auto my-2">
                            <code>{code}</code>
                          </pre>
                        );
                      }
                      if (para.startsWith('### ')) {
                        return <h4 key={i} className="font-bold text-cyan-400 text-sm mt-2">{para.replace('### ', '')}</h4>;
                      }
                      return <p key={i}>{para}</p>;
                    })}
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
                <div className={`text-[9px] mt-2 font-mono ${isAi ? 'text-slate-500' : 'text-cyan-200'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className={`p-4 rounded-2xl border text-xs text-slate-400 flex items-center gap-2 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>Formulating quantitative response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          id="ai-tutor-input"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask anything about quantitative finance, Ito calculus, or market microstructure..."
          disabled={isLoading}
          className={`flex-1 p-3.5 rounded-xl border text-xs focus:outline-none focus:border-cyan-500 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
          }`}
        />
        <button
          type="submit"
          id="ai-tutor-send-btn"
          disabled={!inputPrompt.trim() || isLoading}
          className={`p-3.5 rounded-xl text-white font-bold transition-all cursor-pointer ${
            inputPrompt.trim() && !isLoading
              ? 'bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
