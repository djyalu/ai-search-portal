import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, Sparkles, Brain, Zap, Clock, ShieldCheck, FileText, CheckCircle2, BarChart3, Info } from 'lucide-react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';

const socket = io('http://localhost:3000');

function App() {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('optimal');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const timelineEndRef = useRef(null);

  useEffect(() => {
    socket.on('progress', (step) => {
      setTimeline((prev) => [...prev, { ...step, time: new Date().toLocaleTimeString() }]);
    });

    socket.on('completed', (data) => {
      setResults(data);
      setIsAnalyzing(false);
      setTimeline((prev) => [...prev, { status: 'all_done', message: '에이전시 기반 상호검증 분석 완료!', time: new Date().toLocaleTimeString() }]);
    });

    socket.on('error', (err) => {
      alert(err);
      setIsAnalyzing(false);
    });

    return () => {
      socket.off('progress');
      socket.off('completed');
      socket.off('error');
    };
  }, []);

  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleAnalyze = () => {
    if (!prompt.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setResults(null);
    setTimeline([]);
    setActiveTab('optimal');
    socket.emit('start-analysis', prompt);
  };

  const ServiceSmallCard = ({ title, icon: Icon, text, color }) => (
    <div className="bg-white dark:bg-[#0d0d10] border-2 border-slate-100 dark:border-slate-800/50 rounded-[2rem] p-6 h-full overflow-hidden flex flex-col hover:border-indigo-500/30 transition-all duration-300 shadow-xl shadow-black/5 dark:shadow-none">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl bg-${color}-500/10`}>
          <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <span className="text-sm font-black tracking-tight text-slate-700 dark:text-slate-200 uppercase">{title}</span>
      </div>
      <div className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto custom-scrollbar font-medium">
        {text}
      </div>
    </div>
  );

  const MarkdownContent = ({ content }) => {
    const html = marked.parse(content || '');
    return (
      <div
        className="prose prose-slate dark:prose-invert prose-indigo max-w-none 
                   prose-headings:text-indigo-600 dark:prose-headings:text-indigo-400 prose-headings:font-black 
                   prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ease-in-out ${theme === 'dark' ? 'bg-[#050507] text-slate-200' : 'bg-[#fcfdfe] text-slate-900'} font-sans selection:bg-indigo-500/30 overflow-x-hidden`}>
      <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12">

        {/* Futuristic Header */}
        <header className="flex flex-col xl:flex-row items-center justify-between gap-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative bg-[#0a0a0c] p-0.5 rounded-[1.8rem] overflow-hidden border border-white/10 shadow-2xl">
                <img src="/favicon.png" alt="Logo" className="w-16 h-16 object-cover scale-110 group-hover:scale-125 transition-transform duration-700" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                Multi-Agent Hub
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse delay-75"></span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-black opacity-70">Unified Intelligence Orchestrator</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 max-w-3xl w-full flex items-center gap-5"
          >
            <div className="flex-1 relative group">
              <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-20 transition duration-1000 ${isAnalyzing ? 'opacity-30' : ''}`}></div>
              <div className={`relative flex items-center bg-white dark:bg-[#0d0d10] rounded-[1.8rem] border-2 ${theme === 'dark' ? 'border-slate-800 focus-within:border-indigo-500/50' : 'border-slate-100 focus-within:border-indigo-400'} p-2.5 shadow-2xl transition-all duration-500 ring-1 ring-black/5`}>
                <div className="pl-5 text-indigo-500">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="분석할 대상을 입력하세요..."
                  className="flex-1 bg-transparent border-none outline-none px-5 py-3 text-lg placeholder-slate-300 dark:placeholder-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  disabled={isAnalyzing}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white pl-8 pr-10 py-4 rounded-[1.4rem] font-black transition-all flex items-center gap-4 active:scale-95 disabled:grayscale disabled:opacity-50 shadow-xl shadow-indigo-600/30"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  )}
                  <span className="text-xs uppercase tracking-widest">{isAnalyzing ? 'Running' : 'Analyze'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className={`p-5 rounded-[1.6rem] transition-all duration-500 shadow-2xl border-2 ${theme === 'dark'
                ? 'bg-[#0d0d10] border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-400/30'
                : 'bg-white border-slate-100 text-slate-500 hover:text-amber-500 hover:border-amber-400/30 shadow-black/5'
                }`}
            >
              {theme === 'dark' ? <Zap className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
            </button>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">

          {/* Timeline Sidebar */}
          <aside className="lg:col-span-3">
            <div className={`bg-white dark:bg-[#0d0d10] border-2 ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-100'} rounded-[3rem] p-8 h-[800px] flex flex-col shadow-2xl relative overflow-hidden transition-all duration-700 shadow-black/5`}>
              <div className="flex items-center gap-4 mb-10 border-b-2 dark:border-slate-800/50 pb-8">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <Clock className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tighter text-slate-800 dark:text-slate-200">Activity</h2>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-500 font-black opacity-70">Real-time Stream</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-10 pr-2 custom-scrollbar">
                {timeline.length === 0 && !isAnalyzing && (
                  <div className="text-center py-40 text-slate-200 dark:text-slate-800 space-y-6">
                    <div className="relative inline-block scale-125">
                      <Zap className="w-20 h-20 mx-auto opacity-10" />
                      <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 animate-pulse"></div>
                    </div>
                    <p className="text-[10px] font-black tracking-[0.4em] italic opacity-40 uppercase">System Ready</p>
                  </div>
                )}

                <div className="relative pl-3">
                  <div className="absolute left-[11.5px] top-4 bottom-0 w-1.5 bg-slate-100 dark:bg-slate-900 rounded-full"></div>
                  {timeline.map((step, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx}
                      className="relative pl-12 pb-12 last:pb-2 group"
                    >
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 transition-all duration-500 z-10 ${idx === timeline.length - 1
                        ? 'bg-indigo-500 border-white dark:border-[#0d0d10] shadow-[0_0_25px_rgba(99,102,241,1)] scale-125'
                        : 'bg-slate-200 dark:bg-slate-800 border-white dark:border-[#0d0d10]'
                        }`}></div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black font-mono text-slate-400 group-last:text-indigo-500 tracking-widest uppercase">
                          {step.time}
                        </span>
                        <p className={`text-[14px] font-bold leading-relaxed transition-all duration-500 ${idx === timeline.length - 1 ? 'text-indigo-600 dark:text-indigo-300 translate-x-1' : 'text-slate-500 dark:text-slate-600'
                          }`}>
                          {step.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {isAnalyzing && (
                  <div className="flex items-center gap-5 pl-12">
                    <div className="flex gap-2">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></span>
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    </div>
                    <span className="text-[11px] tracking-[0.4em] uppercase font-black italic text-indigo-500 animate-pulse">Orchestrating</span>
                  </div>
                )}
                <div ref={timelineEndRef} />
              </div>
            </div>
          </aside>

          {/* Main Visual Content */}
          <main className="lg:col-span-9 space-y-12">

            {/* Elegant Tabs */}
            {results && (
              <div className="flex flex-wrap gap-4 p-2.5 bg-white dark:bg-[#0d0d10] border-2 ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-100'} rounded-[2.5rem] max-w-fit shadow-2xl shadow-black/5">
                {[
                  { id: 'optimal', icon: BarChart3, label: '최적 인텔리전스' },
                  { id: 'individual', icon: FileText, label: '개별 에이전트' },
                  { id: 'report', icon: Brain, label: '상호검증 분석' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-5 px-12 py-5 rounded-[1.8rem] text-sm font-black transition-all duration-700 ease-out z-10 ${activeTab === tab.id
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="premium-active-tab"
                        className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 shadow-[0_10px_40px_rgba(99,102,241,0.4)] rounded-[1.8rem] -z-10"
                        transition={{ type: "spring", bounce: 0.1, duration: 0.8 }}
                      />
                    )}
                    <tab.icon className={`w-5.5 h-5.5 transition-transform duration-700 ${activeTab === tab.id ? 'scale-125' : ''}`} />
                    <span className="tracking-tight uppercase">{tab.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="min-h-[750px] flex flex-col">
              <AnimatePresence mode="wait">
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    className={`flex flex-col items-center justify-center flex-1 space-y-20 py-40 bg-white dark:bg-[#0d0d10] rounded-[4rem] border-2 ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-100'} shadow-[0_40px_100px_rgba(0,0,0,0.05)] relative overflow-hidden transition-all duration-700`}
                  >
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none grid grid-cols-12 grid-rows-12 gap-1 px-4">
                      {Array.from({ length: 144 }).map((_, i) => <div key={i} className="border border-indigo-500 rounded-sm"></div>)}
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-10"></div>
                      <div className="relative w-64 h-64 bg-white dark:bg-[#050507] rounded-full border-4 border-indigo-500/30 flex items-center justify-center shadow-2xl overflow-hidden ring-4 ring-indigo-500/5">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-4 border-2 border-dashed border-indigo-500/20 rounded-full"
                        />
                        <Bot className="w-24 h-24 text-indigo-500 drop-shadow-[0_0_30px_rgba(129,140,248,0.8)] animate-pulse" />
                      </div>
                    </div>

                    <div className="text-center space-y-8 max-w-2xl px-12 relative z-10">
                      <h3 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-tight">
                        Orchestrating <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Intelligence</span>
                      </h3>
                      <p className="text-slate-400 dark:text-slate-500 text-lg font-bold leading-relaxed max-w-lg mx-auto">
                        GPT-4, Claude 3.5, Gemini Pro, Perplexity 에이전트가 <br />
                        데이터 수집 및 상호 검증 작업을 수행하고 있습니다.
                      </p>
                    </div>
                  </motion.div>
                )}

                {!isAnalyzing && results && (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.99, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full flex-1"
                  >
                    {activeTab === 'optimal' && (
                      <div className="space-y-12">
                        {/* Dynamic Hero Display */}
                        {results.heroImage && (
                          <div className="relative h-[500px] w-full overflow-hidden rounded-[4rem] shadow-2xl group border-8 border-white dark:border-[#0d0d10] ring-1 ring-black/5">
                            <img
                              src={results.heroImage}
                              alt="Result Visualization"
                              className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
                            <div className="absolute bottom-16 left-16 space-y-6">
                              <div className="flex items-center gap-4 bg-white/20 backdrop-blur-3xl px-8 py-3 rounded-full border border-white/30 w-fit">
                                <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
                                <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Agency Consolidated</span>
                              </div>
                              <h2 className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl max-w-2xl leading-none">종합 인텔리전스 분석</h2>
                            </div>
                          </div>
                        )}

                        <div className="bg-white dark:bg-[#0d0d10] border-2 ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-100'} rounded-[4rem] p-16 shadow-2xl relative overflow-hidden transition-all duration-700 shadow-black/5">
                          <div className="absolute top-0 right-0 p-16 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
                            <Bot className="w-[500px] h-[500px] text-slate-800 dark:text-white" />
                          </div>
                          <div className="relative z-10">
                            <MarkdownContent content={results.optimalAnswer} />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'individual' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-full">
                        <ServiceSmallCard title="Perplexity" icon={Zap} color="sky" text={results.results.perplexity} />
                        <ServiceSmallCard title="ChatGPT" icon={Bot} color="emerald" text={results.results.chatgpt} />
                        <ServiceSmallCard title="Gemini" icon={Sparkles} color="indigo" text={results.results.gemini} />
                        <ServiceSmallCard title="Claude" icon={Brain} color="amber" text={results.results.claude} />
                      </div>
                    )}

                    {activeTab === 'report' && (
                      <div className="bg-white dark:bg-[#0d0d10] border-2 ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-100'} rounded-[4rem] p-20 space-y-16 shadow-2xl transition-all duration-700 shadow-black/5">
                        <div className="flex items-center justify-between border-b-4 border-slate-50 dark:border-slate-900 pb-12">
                          <div className="flex items-center gap-8">
                            <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2.5rem] shadow-2xl shadow-indigo-600/30">
                              <Brain className="w-12 h-12 text-white" />
                            </div>
                            <div>
                              <h2 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic">분석 리포트</h2>
                              <p className="text-[11px] text-indigo-500 mt-3 font-black tracking-[0.4em] uppercase opacity-70">Cross-Validation Analytics</p>
                            </div>
                          </div>
                          <div className="hidden sm:flex items-center gap-5 bg-slate-50 dark:bg-slate-900 px-8 py-4 rounded-3xl border border-slate-200 dark:border-slate-800">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Logic Certified</span>
                          </div>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-[#0a0a0c] p-16 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800 relative">
                          <div className="flex items-start gap-6 mb-12">
                            <Info className="w-7 h-7 text-indigo-500 mt-2" />
                            <p className="text-lg text-slate-500 dark:text-slate-400 italic leading-relaxed font-bold max-w-3xl">
                              본 검증 리포트는 각 서비스의 원문을 대조하여 데이터의 <span className="text-indigo-600">신뢰도, 중복성, 논리적 결점</span>을 에이전트가 재분석한 최종 자료입니다.
                            </p>
                          </div>
                          <MarkdownContent content={results.validationReport} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {!isAnalyzing && !results && (
                  <div className="flex flex-col items-center justify-center flex-1 text-slate-200 dark:text-slate-800 py-32 border-4 border-dashed border-slate-100 dark:border-slate-900 rounded-[5rem] bg-white dark:bg-black/5 shadow-inner group overflow-hidden relative">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[120px]"></div>
                    <motion.div
                      animate={{ y: [0, -25, 0], scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="relative z-10"
                    >
                      <Bot className="w-40 h-40 opacity-[0.03] dark:opacity-[0.05] mb-12 text-slate-900 dark:text-white" />
                    </motion.div>
                    <p className="text-xs font-black tracking-[0.5em] text-slate-300 dark:text-slate-700 uppercase relative z-10">Neural Hub Idle</p>
                    <p className="text-base font-bold text-slate-400 dark:text-slate-600 mt-6 relative z-10 italic">Your analysis journey begins here</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </main>

        </div>
      </div>

      {/* Premium Global Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=JetBrains+Mono:wght@500;800&display=swap');
        
        body { font-family: 'Montserrat', sans-serif; letter-spacing: -0.02em; }
        .font-mono { font-family: 'JetBrains Mono', monospace !important; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#1e1e24' : '#e2e8f0'}; border-radius: 30px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4f46e5; }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Premium Markdown Overrides */
        .prose { font-size: 1.1rem; }
        .prose h1, .prose h2, .prose h3 { font-weight: 900; letter-spacing: -0.06em; margin-top: 3.5rem; margin-bottom: 1.8rem; border-left: 8px solid #4f46e5; padding-left: 2rem; color: ${theme === 'dark' ? '#fff' : '#0f172a'}; }
        .prose p { margin-bottom: 2.2rem; line-height: 2; font-weight: 600; color: ${theme === 'dark' ? '#94a3b8' : '#475569'}; }
        .prose table { display: block; width: 100%; border-collapse: separate; border-spacing: 0; overflow-x: auto; margin: 4rem 0; border: 3px solid ${theme === 'dark' ? '#1e1e24' : '#f1f5f9'}; border-radius: 3rem; }
        .prose th, .prose td { padding: 28px 32px; text-align: left; font-size: 1rem; border-bottom: 2px solid ${theme === 'dark' ? '#1e1e24' : '#f1f5f9'}; }
        .prose th { background: ${theme === 'dark' ? '#111115' : '#f8fafc'}; font-weight: 900; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.15em; font-size: 0.8rem; }
        .prose tr:last-child td { border-bottom: none; }
        .prose tr:hover { background: ${theme === 'dark' ? '#14141d' : '#f8fafc'}; transition: background 0.4s ease; }
        .prose strong { color: #6366f1; font-weight: 900; }
        .prose li { margin-bottom: 1.2rem; padding-left: 0.8rem; color: ${theme === 'dark' ? '#94a3b8' : '#475569'}; font-weight: 600; }
        
        /* Custom Hover Effect for Lists */
        .prose li:hover { transform: translateX(5px); color: #6366f1; transition: all 0.3s ease; }
      `}} />
    </div>
  );
}

export default App;
