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
    <div className="bg-white dark:bg-[#1e1e24] border border-slate-200 dark:border-slate-800 rounded-lg p-4 h-full overflow-hidden flex flex-col hover:border-indigo-500/30 transition-colors shadow-sm dark:shadow-none">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
        <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">{title}</span>
      </div>
      <div className="text-[11px] text-slate-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto custom-scrollbar">
        {text}
      </div>
    </div>
  );

  const MarkdownContent = ({ content }) => {
    const html = marked.parse(content || '');
    return (
      <div
        className="prose prose-invert prose-indigo max-w-none 
                   prose-headings:text-indigo-400 prose-headings:font-bold 
                   prose-p:text-slate-300 prose-p:leading-relaxed
                   prose-table:border prose-table:border-slate-800
                   prose-th:bg-slate-900 prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-slate-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Multi-GPT Agency
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold tracking-wider">Agency-based Cross-Validation</p>
            </div>
          </div>

          <div className="flex-1 max-w-xl w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex bg-[#16161a] rounded-xl border border-slate-800 p-1.5 overflow-hidden">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="상호 검증이 필요한 질문을 입력하세요..."
                className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm placeholder-slate-600"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                disabled={isAnalyzing}
              />
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>분석 실행</span>
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Timeline Section */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-[#121216] border border-slate-800 rounded-2xl p-4 h-[600px] flex flex-col shadow-xl">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-300">실시간 타임라인</h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {timeline.length === 0 && !isAnalyzing && (
                  <div className="text-center py-12 text-slate-600 space-y-2">
                    <Zap className="w-10 h-10 mx-auto opacity-10" />
                    <p className="text-xs">프롬프트를 입력하면<br />분석 과정이 표시됩니다.</p>
                  </div>
                )}
                {timeline.map((step, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx}
                    className="relative pl-6 border-l border-slate-800"
                  >
                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                    <p className="text-[11px] text-slate-500">{step.time}</p>
                    <p className="text-xs font-medium text-slate-300 mt-1 leading-snug">{step.message}</p>
                  </motion.div>
                ))}
                {isAnalyzing && (
                  <div className="flex items-center gap-2 pl-6 text-indigo-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-[10px] animate-pulse">에이전트 작업 중...</span>
                  </div>
                )}
                <div ref={timelineEndRef} />
              </div>
            </div>
          </aside>

          {/* Main Display Area */}
          <main className="lg:col-span-9 space-y-6">

            {/* Tabs */}
            {results && (
              <div className="flex gap-2 p-1 bg-white dark:bg-[#121216] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-fit shadow-md dark:shadow-none">
                <button
                  onClick={() => setActiveTab('optimal')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'optimal' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
                >
                  <BarChart3 className="w-4 h-4" />
                  종합 분석 결과
                </button>
                <button
                  onClick={() => setActiveTab('individual')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'individual' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
                >
                  <FileText className="w-4 h-4" />
                  서비스별 원문
                </button>
                <button
                  onClick={() => setActiveTab('report')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
                >
                  <Brain className="w-4 h-4" />
                  교차 검증 리포트
                </button>
              </div>
            )}

            <div className="min-h-[530px]">
              <AnimatePresence mode="wait">
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full space-y-6 pt-20"
                  >
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 bg-indigo-600 rounded-full animate-ping opacity-20"></div>
                      <div className="absolute inset-2 bg-indigo-500 rounded-full animate-pulse opacity-40"></div>
                      <div className="absolute inset-4 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <Bot className="absolute inset-0 m-auto w-10 h-10 text-white" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-white">상호검증 분석 진행 중</h3>
                      <p className="text-slate-500 text-sm">4개의 AI 에이전트가 최적의 결과를 위해 협업하고 있습니다.</p>
                    </div>
                  </motion.div>
                )}

                {!isAnalyzing && results && (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                  >
                    {activeTab === 'optimal' && (
                      <div className="space-y-6">
                        {/* Hero Image Section */}
                        {results.heroImage && (
                          <div className="relative h-60 w-full overflow-hidden rounded-3xl shadow-2xl group">
                            <img
                              src={results.heroImage}
                              alt="Analysis Visualization"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent opacity-60"></div>
                            <div className="absolute bottom-6 left-8 flex items-center gap-3">
                              <div className="p-2 bg-indigo-600 rounded-lg">
                                <Sparkles className="w-4 h-4 text-white" />
                              </div>
                              <h2 className="text-2xl font-bold text-white tracking-tight">AI 에이전시 검증 결과</h2>
                            </div>
                          </div>
                        )}

                        <div className="bg-white dark:bg-[#121216] border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-xl dark:shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-5 text-slate-900 dark:text-white">
                            <Bot className="w-40 h-40" />
                          </div>
                          <div className="relative z-10">
                            <MarkdownContent content={results.optimalAnswer} />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'individual' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full">
                        <ServiceSmallCard title="Perplexity" icon={Zap} color="teal" text={results.results.perplexity} />
                        <ServiceSmallCard title="ChatGPT" icon={Bot} color="emerald" text={results.results.chatgpt} />
                        <ServiceSmallCard title="Gemini" icon={Sparkles} color="blue" text={results.results.gemini} />
                        <ServiceSmallCard title="Claude" icon={Brain} color="orange" text={results.results.claude} />
                      </div>
                    )}

                    {activeTab === 'report' && (
                      <div className="bg-white dark:bg-[#121216] border border-slate-200 dark:border-slate-800 rounded-3xl p-10 space-y-8 shadow-xl dark:shadow-2xl">
                        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
                          <div className="p-3 bg-purple-600/10 rounded-2xl">
                            <Brain className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">상호검증 분석 리포트</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">AI 모델 간의 논리적 일관성 및 차이점 분석</p>
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                          <div className="flex items-start gap-3 mb-4">
                            <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mt-1" />
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed">
                              이 리포트는 전문 AI 에이전트가 각 서비스의 답변을 심층 분석하여 생성한 교차 검토 결과입니다.
                            </p>
                          </div>
                          <MarkdownContent content={results.validationReport} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {!isAnalyzing && !results && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-700 py-32 border-2 border-dashed border-slate-900 rounded-3xl">
                    <Bot className="w-16 h-16 opacity-10 mb-4" />
                    <p className="text-sm font-medium">검증할 프롬프트를 상단에 입력해 주세요.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </main>

        </div>
      </div>

      {/* Global CSS for scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2d2d39; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4f46e5; }
      `}} />
    </div>
  );
}

export default App;
