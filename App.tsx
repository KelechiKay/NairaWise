
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PlayerStats, 
  Scenario, 
  GameLog, 
  GameStatus, 
  Choice,
  Stock,
  PortfolioItem,
  Goal,
  LeaderboardEntry
} from './types';
import { getNextScenario, getEndGameAnalysis } from './geminiService';
import Dashboard from './Dashboard';
import StockMarket from './StockMarket';
import { 
  Loader2, 
  Coins, 
  CheckCircle2, 
  UserCircle2,
  Banknote,
  Sparkles,
  Heart,
  GraduationCap,
  ChevronRight,
  Trophy,
  LogOut,
  AlertCircle,
  Briefcase,
  Wallet,
  Zap,
  RefreshCcw,
  Skull,
  Newspaper,
  Terminal
} from 'lucide-react';

const INITIAL_STOCKS: Stock[] = [
  { id: 'lagos-gas', name: 'Lagos Gas Ltd.', price: 12500, history: [12000, 12500], sector: 'Energy' },
  { id: 'kano-textiles', name: 'Kano Textiles PLC', price: 5000, history: [4800, 5000], sector: 'Manufacturing' },
  { id: 'nairatech', name: 'NairaTech Solutions', price: 25000, history: [22000, 25000], sector: 'Tech' },
  { id: 'obudu-agri', name: 'Obudu Agriculture', price: 8000, history: [8200, 8000], sector: 'Agriculture' },
];

const PRESET_GOALS: Goal[] = [
  { id: 'save-1m', title: 'Escape Sapa (₦1M)', target: 1000000, category: 'savings', completed: false },
  { id: 'land-ibeju', title: 'Lekki Landowner', target: 5000000, category: 'investment', completed: false },
  { id: 'japa', title: 'Global Relocation', target: 20000000, category: 'lifestyle', completed: false },
  { id: 'empire', title: 'Pan-African Empire', target: 100000000, category: 'investment', completed: false },
];

const ALL_NIGERIAN_STATES = [
  "FCT Abuja", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", 
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", 
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const CHALLENGES = [
  { id: 'black-tax', name: 'Heavy Black Tax', icon: Heart, description: 'Family needs a cut of everything.' },
  { id: 'no-capital', name: 'Zero Capital', icon: Banknote, description: 'Start with ₦0 and bills.' },
  { id: 'student-debt', name: 'Student Debt', icon: GraduationCap, description: '₦500k debt with interest.' },
  { id: 'fresh-start', name: 'Silver Spoon', icon: Sparkles, description: '₦200k inheritance start.' }
];

const FALLBACK_SCENARIO: Scenario = {
  title: "Morning in Nigeria",
  description: "The sun is up and the hustle begins. Your phone pings with an 'Urgent 2k' request.",
  imageTheme: "lagos",
  choices: [
    { text: "Send the 2k (Social)", consequence: "You're a good friend, but your wallet hurts.", impact: { balance: -2000, savings: 0, debt: 0, happiness: 10 } },
    { text: "Ignore the text (Prudent)", consequence: "Money saved, but your reputation is shaking.", impact: { balance: 0, savings: 0, debt: 0, happiness: -5 } },
    { text: "Ask for a favor back (Risky)", consequence: "They go silent. Awkward.", impact: { balance: 0, savings: 0, debt: 0, happiness: 0 } },
    { text: "Propose a small gig (Opportunistic)", consequence: "They help you with work instead of taking cash.", impact: { balance: 500, savings: 0, debt: 0, happiness: 5 } }
  ]
};

const SAPA_QUOTES = [
  "Calculating the velocity of your financial downfall...",
  "Reviewing your 'Urgent 2k' history...",
  "Sapa is reviewing your bank statement. It doesn't look good...",
  "Consulting the ancestors of the hustle...",
  "Analyzing why you didn't just save your money...",
  "Generating a report that will make you rethink your life choices..."
];

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [loadingType, setLoadingType] = useState<'scenario' | 'report'>('scenario');
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [nextScenario, setNextScenario] = useState<Scenario | null>(null);
  const [history, setHistory] = useState<GameLog[]>([]);
  const [lastConsequence, setLastConsequence] = useState<{text: string; title: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'scenario' | 'market' | 'history'>('scenario');
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showFallback, setShowFallback] = useState(false);
  const [gameOverReport, setGameOverReport] = useState<string>('');
  const [currentLoadingQuote, setCurrentLoadingQuote] = useState(0);
  const isPrefetching = useRef(false);

  useEffect(() => {
    let interval: any;
    if (status === GameStatus.LOADING) {
      interval = setInterval(() => {
        setCurrentLoadingQuote(prev => (prev + 1) % SAPA_QUOTES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [status]);

  const [setupData, setSetupData] = useState({
    name: '', 
    age: 22, 
    job: 'Digital Hustler', 
    salary: 150000, 
    city: 'Lagos',
    challengeId: 'no-capital', 
    selectedGoalId: 'save-1m'
  });

  const prefetchNext = useCallback(async (s: PlayerStats, h: GameLog[]) => {
    if (isPrefetching.current) return;
    isPrefetching.current = true;
    try {
      const scenario = await getNextScenario(s, h);
      setNextScenario(scenario);
    } catch (e) { 
      console.error("Prefetch failed", e);
      setNextScenario(FALLBACK_SCENARIO);
    }
    isPrefetching.current = false;
  }, []);

  const handleFinishSetup = async () => {
    if (!setupData.name || !setupData.job) return alert("Oga, complete your profile first!");
    if (setupData.salary < 10000) return alert("Haba, income too low! Even for survival.");

    const initial: PlayerStats = {
      name: setupData.name,
      age: setupData.age,
      job: setupData.job,
      salary: setupData.salary,
      balance: setupData.salary,
      savings: setupData.challengeId === 'fresh-start' ? 200000 : 0,
      debt: setupData.challengeId === 'student-debt' ? 500000 : 0,
      happiness: 80,
      currentWeek: 1,
      city: setupData.city,
      challenge: CHALLENGES.find(c => c.id === setupData.challengeId)?.name || ''
    };
    
    setLoadingType('scenario');
    setStatus(GameStatus.LOADING);
    setStats(initial);
    setGoals([{ ...PRESET_GOALS.find(g => g.id === setupData.selectedGoalId)! }]);
    
    const timeoutId = setTimeout(() => setShowFallback(true), 8000);

    try {
      const scenario = await getNextScenario(initial, []);
      clearTimeout(timeoutId);
      setCurrentScenario(scenario);
      setStatus(GameStatus.PLAYING);
      prefetchNext(initial, []);
    } catch (e) { 
      console.error("Initial load failed", e);
      setCurrentScenario(FALLBACK_SCENARIO);
      setStatus(GameStatus.PLAYING);
    }
  };

  const handleChoice = async (choice: Choice) => {
    if (!currentScenario || !stats) return;

    const nextStats = {
      ...stats,
      balance: stats.balance + choice.impact.balance,
      savings: Math.max(0, stats.savings + choice.impact.savings),
      debt: Math.max(0, stats.debt + choice.impact.debt),
      happiness: Math.min(100, Math.max(0, stats.happiness + choice.impact.happiness)),
      currentWeek: stats.currentWeek + 1
    };

    const entry = { week: stats.currentWeek, title: currentScenario.title, decision: choice.text, consequence: choice.consequence };
    const newHistory = [...history, entry];
    
    setHistory(newHistory);
    setStats(nextStats);

    if (nextStats.balance <= 0) {
      setLoadingType('report');
      setStatus(GameStatus.LOADING);
      setShowFallback(false);
      
      const analysisTimeout = setTimeout(() => setShowFallback(true), 10000);

      try {
        const report = await getEndGameAnalysis(nextStats, newHistory);
        clearTimeout(analysisTimeout);
        setGameOverReport(report);
        setStatus(GameStatus.GAMEOVER);
      } catch (e) {
        setGameOverReport("Sapa has finally won. The report failed to load because the economy is too tough even for AI. You are officially broke, oga.");
        setStatus(GameStatus.GAMEOVER);
      }
      return;
    }

    const assets = nextStats.balance + nextStats.savings - nextStats.debt;
    setGoals(goals.map(g => (assets >= g.target && !g.completed) ? { ...g, completed: true } : g));
    
    setLastConsequence({ text: choice.consequence, title: currentScenario.title });
    if (!nextScenario) prefetchNext(nextStats, newHistory);
  };

  const proceed = () => {
    if (nextScenario && stats) {
      setStocks(stocks.map(s => ({ 
        ...s, price: Math.max(10, Math.round(s.price * (1 + (Math.random() * 0.1 - 0.05)))),
        history: [...s.history, s.price].slice(-20) 
      })));
      setCurrentScenario(nextScenario);
      setLastConsequence(null);
      setNextScenario(null);
      prefetchNext(stats, history);
    } else {
      setLoadingType('scenario');
      setStatus(GameStatus.LOADING);
      const check = setInterval(() => {
        if (nextScenario) { clearInterval(check); setStatus(GameStatus.PLAYING); proceed(); }
      }, 100);
    }
  };

  const skipReport = () => {
    setGameOverReport("Analysis skipped. You reached Week " + (stats?.currentWeek || 0) + ". Sapa eventually got you.");
    setStatus(GameStatus.GAMEOVER);
  };

  const resetGame = () => {
    setStatus(GameStatus.START);
    setStats(null);
    setHistory([]);
    setPortfolio([]);
    setLastConsequence(null);
    setGameOverReport('');
    setShowFallback(false);
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8">
      {status === GameStatus.START && (
        <div className="max-w-4xl mx-auto text-center space-y-12 py-20 animate-in zoom-in duration-300">
          <div className="bg-white rounded-[4rem] p-20 shadow-2xl border border-slate-100">
            <Coins className="w-20 h-20 text-emerald-600 mx-auto mb-8" />
            <h2 className="text-7xl font-black text-slate-900 mb-4 tracking-tighter">NairaWise</h2>
            <p className="text-2xl text-slate-500 font-bold mb-12 uppercase tracking-widest">Endurance Strategy RPG</p>
            <button onClick={() => setStatus(GameStatus.SETUP)} className="px-16 py-8 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl flex items-center gap-4 mx-auto transition-all shadow-xl">
              Start Journey <ChevronRight />
            </button>
          </div>
        </div>
      )}

      {status === GameStatus.SETUP && (
        <div className="max-w-4xl mx-auto bg-white p-12 md:p-16 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-12 animate-in slide-in-from-bottom-6 duration-300">
          <div className="text-center">
             <h2 className="text-4xl font-black flex items-center justify-center gap-4 mb-2">
               <UserCircle2 className="text-emerald-600 w-10 h-10" /> 
               Identity & Economy
             </h2>
             <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Build your persona. Survive the cycle.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Your Name</label>
                <div className="relative">
                  <UserCircle2 className="absolute left-5 top-5 text-slate-300 w-5 h-5" />
                  <input type="text" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} placeholder="e.g. Ebuka" className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Current City</label>
                <select value={setupData.city} onChange={e => setSetupData({...setupData, city: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-colors">
                  {ALL_NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Job Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-5 top-5 text-slate-300 w-5 h-5" />
                  <input type="text" value={setupData.job} onChange={e => setSetupData({...setupData, job: e.target.value})} placeholder="e.g. Freelancer" className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Monthly Income (₦)</label>
                <div className="relative">
                  <Wallet className="absolute left-5 top-5 text-slate-300 w-5 h-5" />
                  <input type="number" value={setupData.salary} onChange={e => setSetupData({...setupData, salary: Number(e.target.value)})} className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleFinishSetup} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-emerald-600 transition-all shadow-xl">Go Live & Hustle</button>
        </div>
      )}

      {status === GameStatus.LOADING && (
        <div className="flex flex-col items-center justify-center py-48 text-center animate-in fade-in duration-500">
          <div className="relative mb-10">
            <Loader2 className={`w-24 h-24 ${loadingType === 'report' ? 'text-rose-500' : 'text-emerald-600'} animate-spin`} />
            {loadingType === 'report' && <Skull className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-rose-500" />}
          </div>
          
          <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-[0.2em]">
            {loadingType === 'report' ? 'The Post-Mortem' : 'Syncing Grid'}
          </h3>
          
          <div className="h-20 flex items-center justify-center">
            <p className="text-slate-400 font-bold text-xl italic animate-pulse max-w-md">
              {loadingType === 'report' ? SAPA_QUOTES[currentLoadingQuote] : 'Initializing your next economic challenge...'}
            </p>
          </div>

          {showFallback && (
            <div className="mt-12 space-y-4">
              <p className="text-slate-400 text-sm font-bold">Network is dragging? Your economy is slowing the AI down.</p>
              <button 
                onClick={loadingType === 'report' ? skipReport : () => proceed()} 
                className="px-8 py-4 bg-amber-50 text-amber-700 rounded-2xl font-black flex items-center gap-2 border-2 border-amber-100 mx-auto hover:bg-amber-100 transition-all"
              >
                <AlertCircle size={20} /> {loadingType === 'report' ? 'Skip Analysis' : 'Force Continue'}
              </button>
            </div>
          )}
        </div>
      )}

      {status === GameStatus.GAMEOVER && stats && (
        <div className="max-w-4xl mx-auto animate-in zoom-in duration-500">
          <div className="bg-slate-900 rounded-[4rem] p-16 md:p-24 shadow-2xl text-center text-white border-4 border-rose-500/30">
            <Skull className="w-24 h-24 text-rose-500 mx-auto mb-10 animate-pulse" />
            <h2 className="text-6xl font-black mb-4 tracking-tighter">GAME OVER</h2>
            <p className="text-rose-400 font-bold text-xl uppercase tracking-widest mb-12">Sapa has conquered {stats.name}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <div className="bg-white/5 p-6 rounded-3xl">
                <p className="text-[10px] font-black text-slate-500 uppercase">Weeks</p>
                <p className="text-2xl font-black">{stats.currentWeek}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl">
                <p className="text-[10px] font-black text-slate-500 uppercase">Balance</p>
                <p className="text-2xl font-black text-rose-400">₦{stats.balance}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl">
                <p className="text-[10px] font-black text-slate-500 uppercase">Peak Assets</p>
                <p className="text-2xl font-black text-emerald-400">₦{(stats.balance + stats.savings).toLocaleString()}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl">
                <p className="text-[10px] font-black text-slate-500 uppercase">Happiness</p>
                <p className="text-2xl font-black">{stats.happiness}%</p>
              </div>
            </div>

            <div className="bg-white/10 p-10 rounded-[3rem] text-left border border-white/5 mb-16 relative overflow-hidden">
               <Zap className="absolute top-4 right-4 text-amber-400 opacity-20 w-20 h-20" />
               <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                 <Newspaper className="text-indigo-400" /> Sapa Report
               </h3>
               <div className="text-lg text-slate-300 leading-relaxed font-medium whitespace-pre-line border-l-4 border-indigo-500 pl-6">
                 {gameOverReport}
               </div>
            </div>

            <button onClick={resetGame} className="px-16 py-8 bg-white text-slate-900 hover:bg-emerald-500 hover:text-white rounded-[2.5rem] font-black text-2xl flex items-center gap-4 mx-auto transition-all shadow-xl">
              Try Again <RefreshCcw />
            </button>
          </div>
        </div>
      )}

      {status === GameStatus.PLAYING && stats && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <header className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <Coins className="text-emerald-500 w-8 h-8" />
              <h1 className="text-2xl font-black tracking-tighter">NairaWise</h1>
            </div>
            <nav className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
              {['scenario', 'market', 'history'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>{tab}</button>
              ))}
            </nav>
          </header>

          {activeTab === 'market' ? (
            <StockMarket stocks={stocks} portfolio={portfolio} news={[]} onBuy={() => {}} onSell={() => {}} balance={stats.balance} onSetTrigger={() => {}} />
          ) : activeTab === 'history' ? (
             <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
               <h3 className="text-3xl font-black mb-10">Journal</h3>
               <div className="space-y-4">
                  {history.length === 0 && <p className="text-slate-400 italic font-bold">No history recorded yet.</p>}
                  {history.map((h, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center">
                       <div>
                          <p className="text-xs font-black text-indigo-500 uppercase mb-1">Week {h.week}</p>
                          <p className="font-black text-lg">{h.title}</p>
                          <p className="text-sm text-slate-500 italic">Decision: {h.decision}</p>
                       </div>
                    </div>
                  ))}
               </div>
             </div>
          ) : lastConsequence ? (
            <div className="bg-white p-20 rounded-[4.5rem] shadow-2xl text-center border border-slate-100 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto mb-10" />
              <h3 className="text-5xl font-black mb-6 text-slate-900 tracking-tight">{lastConsequence.title}</h3>
              <p className="text-2xl text-slate-500 italic mb-14 max-w-3xl mx-auto leading-relaxed font-medium">"{lastConsequence.text}"</p>
              <button onClick={proceed} className="px-24 py-8 bg-slate-900 hover:bg-emerald-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl transition-all active:scale-95">
                Go to Week {stats.currentWeek}
              </button>
            </div>
          ) : (
            <>
              <Dashboard stats={stats} goals={goals} netAssets={stats.balance + stats.savings - stats.debt} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-8">
                  <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 relative group">
                    <img src={`https://picsum.photos/seed/${currentScenario?.imageTheme || 'hustle'}/1200/800`} className="w-full h-[350px] object-cover transition-transform duration-1000 group-hover:scale-110" alt="Scenario" />
                    <div className="p-12 -mt-12 bg-white relative rounded-t-[3.5rem]">
                      <div className="flex items-center gap-2 mb-4">
                         <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                         <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Active Scenario</span>
                      </div>
                      <h3 className="text-3xl font-black mb-6 leading-tight tracking-tight text-slate-900">{currentScenario?.title}</h3>
                      <p className="text-slate-500 text-xl leading-relaxed font-medium">{currentScenario?.description}</p>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 mb-2">Select Your Strategy</p>
                  <div className="grid grid-cols-1 gap-4">
                    {currentScenario?.choices.map((choice, i) => (
                      <button key={i} onClick={() => handleChoice(choice)} className="w-full text-left p-8 bg-white border-2 border-slate-50 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-[2.5rem] transition-all group shadow-sm hover:shadow-xl active:scale-98">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-black text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">{i + 1}</div>
                          <div>
                            <p className="font-black text-xl mb-1 group-hover:text-emerald-700 leading-tight">{choice.text}</p>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Banknote size={14} /> Calculate Impact</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
