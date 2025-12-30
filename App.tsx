
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
import { getNextScenario } from './geminiService';
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
  AlertCircle
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
    { text: "Ask for a favor back (Risky)", consequence: "They go silent. Awkward.", impact: { balance: 0, savings: 0, debt: 0, happiness: 0 } }
  ]
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
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
  const isPrefetching = useRef(false);

  const [setupData, setSetupData] = useState({
    name: '', age: 22, job: 'Entrepreneur', salary: 150000, city: 'Lagos',
    challengeId: 'no-capital', selectedGoalId: 'save-1m'
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
    if (!setupData.name) return alert("Oga, enter your name!");
    const initial = {
      name: setupData.name, age: setupData.age, job: setupData.job,
      salary: setupData.salary, balance: setupData.salary,
      savings: setupData.challengeId === 'fresh-start' ? 200000 : 0,
      debt: setupData.challengeId === 'student-debt' ? 500000 : 0,
      happiness: 80, currentWeek: 1, city: setupData.city,
      challenge: CHALLENGES.find(c => c.id === setupData.challengeId)?.name || ''
    };
    
    setStatus(GameStatus.LOADING);
    setStats(initial);
    setGoals([{ ...PRESET_GOALS.find(g => g.id === setupData.selectedGoalId)! }]);
    
    const timeoutId = setTimeout(() => setShowFallback(true), 6000);

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

  const handleSkipLoading = () => {
    if (!stats) return;
    setCurrentScenario(FALLBACK_SCENARIO);
    setStatus(GameStatus.PLAYING);
    prefetchNext(stats, []);
  };

  const handleChoice = async (choice: Choice) => {
    if (!currentScenario || !stats) return;
    const nextStats = {
      ...stats,
      balance: Math.max(0, stats.balance + choice.impact.balance),
      savings: Math.max(0, stats.savings + choice.impact.savings),
      debt: Math.max(0, stats.debt + choice.impact.debt),
      happiness: Math.min(100, Math.max(0, stats.happiness + choice.impact.happiness)),
      currentWeek: stats.currentWeek + 1
    };
    const assets = nextStats.balance + nextStats.savings - nextStats.debt;
    setGoals(goals.map(g => (assets >= g.target && !g.completed) ? { ...g, completed: true } : g));
    const entry = { week: stats.currentWeek, title: currentScenario.title, decision: choice.text, consequence: choice.consequence };
    setHistory([...history, entry]);
    setStats(nextStats);
    setLastConsequence({ text: choice.consequence, title: currentScenario.title });
    if (!nextScenario) prefetchNext(nextStats, [...history, entry]);
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
      setStatus(GameStatus.LOADING);
      const check = setInterval(() => {
        if (nextScenario) { clearInterval(check); setStatus(GameStatus.PLAYING); proceed(); }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8">
      {status === GameStatus.START && (
        <div className="max-w-4xl mx-auto text-center space-y-12 py-20 animate-in zoom-in duration-300">
          <div className="bg-white rounded-[4rem] p-20 shadow-2xl border border-slate-100">
            <Coins className="w-20 h-20 text-emerald-600 mx-auto mb-8" />
            <h2 className="text-7xl font-black text-slate-900 mb-4 tracking-tighter">NairaWise</h2>
            <p className="text-2xl text-slate-500 font-bold mb-12 uppercase tracking-widest">Financial Legend Simulator</p>
            <button onClick={() => setStatus(GameStatus.SETUP)} className="px-16 py-8 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl flex items-center gap-4 mx-auto transition-all shadow-xl">
              Start Journey <ChevronRight />
            </button>
          </div>
        </div>
      )}

      {status === GameStatus.SETUP && (
        <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10 animate-in slide-in-from-bottom-6 duration-300">
          <h2 className="text-4xl font-black flex items-center gap-4"><UserCircle2 className="text-emerald-600" /> Create Persona</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <input type="text" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} placeholder="Name" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-emerald-500 transition-colors" />
            <select value={setupData.city} onChange={e => setSetupData({...setupData, city: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-emerald-500 transition-colors">
              {ALL_NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CHALLENGES.map(c => (
              <button key={c.id} onClick={() => setSetupData({...setupData, challengeId: c.id})} className={`p-6 border-4 rounded-[2rem] text-left transition-all ${setupData.challengeId === c.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-50 hover:bg-slate-50'}`}>
                <p className="font-black text-lg">{c.name}</p>
                <p className="text-xs text-slate-400 font-bold">{c.description}</p>
              </button>
            ))}
          </div>
          <button onClick={handleFinishSetup} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-emerald-600 transition-all shadow-xl">Start Lifestyle</button>
        </div>
      )}

      {status === GameStatus.LOADING && (
        <div className="flex flex-col items-center justify-center py-48 text-center px-4 animate-in fade-in duration-500">
          <Loader2 className="w-20 h-20 text-emerald-600 animate-spin mb-10" />
          <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-[0.3em]">Hustle Grid Syncing</h3>
          <p className="text-slate-400 font-bold mb-10">Initializing economic parameters for {stats?.city}...</p>
          {showFallback && (
            <button onClick={handleSkipLoading} className="px-10 py-5 bg-amber-50 text-amber-700 rounded-3xl font-black flex items-center gap-3 border-2 border-amber-100 hover:bg-amber-100 transition-all">
              <AlertCircle /> Connection Slow? Skip Loading
            </button>
          )}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white rounded-[4rem] overflow-hidden shadow-2xl border border-slate-100 relative group">
                  <img src={`https://picsum.photos/seed/${currentScenario?.imageTheme || 'hustle'}/1200/800`} className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-110" alt="Scenario" />
                  <div className="p-14 -mt-14 bg-white relative rounded-t-[4rem]">
                    <h3 className="text-4xl font-black mb-8 leading-tight tracking-tight text-slate-900">{currentScenario?.title}</h3>
                    <p className="text-slate-500 text-2xl leading-relaxed font-medium">{currentScenario?.description}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {currentScenario?.choices.map((choice, i) => (
                    <button key={i} onClick={() => handleChoice(choice)} className="w-full text-left p-12 bg-white border-2 border-slate-50 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-[3.5rem] transition-all group shadow-sm hover:shadow-2xl">
                      <p className="font-black text-3xl mb-3 group-hover:text-emerald-700 leading-tight">{choice.text}</p>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Banknote size={18} /> Impact Cycle Pending</span>
                    </button>
                  ))}
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
