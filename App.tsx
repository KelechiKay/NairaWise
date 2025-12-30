
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PlayerStats, 
  Scenario, 
  GameLog, 
  GameStatus, 
  Choice,
  Stock,
  PortfolioItem,
  MarketNews,
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
  Target,
  Sparkles,
  Heart,
  MapPin,
  ShieldAlert,
  GraduationCap,
  ChevronRight,
  TrendingUp,
  History,
  Trophy,
  Share2,
  LogOut
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

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [nextScenario, setNextScenario] = useState<Scenario | null>(null);
  const [history, setHistory] = useState<GameLog[]>([]);
  const [lastConsequence, setLastConsequence] = useState<{text: string; title: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'scenario' | 'market' | 'history' | 'leaderboard'>('scenario');
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const isPrefetching = useRef(false);

  const [setupData, setSetupData] = useState({
    name: '',
    age: 22,
    job: 'Hustler',
    salary: 100000,
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
    } catch (e) { console.error("Prefetch failed", e); }
    isPrefetching.current = false;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('nairawise_v4');
    const savedLB = localStorage.getItem('nairawise_leaderboard_v4');
    if (savedLB) setLeaderboard(JSON.parse(savedLB));
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStats(data.stats);
        setGoals(data.goals);
        setHistory(data.history);
        setStocks(data.stocks || INITIAL_STOCKS);
        setPortfolio(data.portfolio || []);
        setCurrentScenario(data.currentScenario);
        setStatus(GameStatus.PLAYING);
        prefetchNext(data.stats, data.history);
      } catch (e) { console.error(e); }
    }
  }, [prefetchNext]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && stats) {
      localStorage.setItem('nairawise_v4', JSON.stringify({ stats, goals, history, stocks, portfolio, currentScenario, status }));
    }
    localStorage.setItem('nairawise_leaderboard_v4', JSON.stringify(leaderboard));
  }, [status, stats, goals, history, stocks, portfolio, currentScenario, leaderboard]);

  const calculateNetAssets = (s: PlayerStats | null, p: PortfolioItem[]) => {
    if (!s) return 0;
    const pVal = p.reduce((total, item) => {
      const stock = stocks.find(st => st.id === item.stockId);
      return total + (stock ? stock.price * item.shares : 0);
    }, 0);
    return s.balance + s.savings + pVal - s.debt;
  };

  // Fix: Implemented handleBuy to process stock purchases and update balance.
  const handleBuy = (stockId: string) => {
    if (!stats) return;
    const stock = stocks.find(s => s.id === stockId);
    if (!stock || stats.balance < stock.price) return;
    setStats({ ...stats, balance: stats.balance - stock.price });
    setPortfolio(prev => {
      const existing = prev.find(p => p.stockId === stockId);
      if (existing) {
        return prev.map(p => p.stockId === stockId ? { ...p, shares: p.shares + 1 } : p);
      }
      return [...prev, { stockId, shares: 1, averagePrice: stock.price }];
    });
  };

  // Fix: Implemented handleSell to process stock sales and update balance.
  const handleSell = (stockId: string) => {
    if (!stats) return;
    const stock = stocks.find(s => s.id === stockId);
    const holding = portfolio.find(p => p.stockId === stockId);
    if (!stock || !holding || holding.shares <= 0) return;
    setStats({ ...stats, balance: stats.balance + stock.price });
    setPortfolio(prev => prev.map(p => p.stockId === stockId ? { ...p, shares: p.shares - 1 } : p).filter(p => p.shares > 0));
  };

  // Fix: Implemented handleSetTrigger to update portfolio stop-loss and take-profit values.
  const handleSetTrigger = (stockId: string, type: 'stopLoss' | 'takeProfit', value: number | undefined) => {
    setPortfolio(prev => prev.map(p => p.stockId === stockId ? { ...p, [type]: value } : p));
  };

  // Fix: Implemented handleRetire to archive game session and record final net assets on leaderboard.
  const handleRetire = () => {
    if (!stats) return;
    const finalAssets = calculateNetAssets(stats, portfolio);
    const entry: LeaderboardEntry = {
      name: stats.name,
      city: stats.city,
      netAssets: finalAssets,
      week: stats.currentWeek,
      rank: finalAssets > 50000000 ? 'Industrialist' : finalAssets > 5000000 ? 'Oga' : 'Hustler',
      timestamp: Date.now()
    };
    const newLB = [...leaderboard, entry].sort((a, b) => b.netAssets - a.netAssets).slice(0, 10);
    setLeaderboard(newLB);
    localStorage.removeItem('nairawise_v4');
    setStats(null);
    setHistory([]);
    setPortfolio([]);
    setCurrentScenario(null);
    setNextScenario(null);
    setStatus(GameStatus.START);
  };

  const handleFinishSetup = async () => {
    if (!setupData.name) return alert("Oga, name please!");
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
    try {
      const scenario = await getNextScenario(initial, []);
      setCurrentScenario(scenario);
      setStatus(GameStatus.PLAYING);
      prefetchNext(initial, []);
    } catch (e) { setStatus(GameStatus.SETUP); }
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
    const assets = calculateNetAssets(nextStats, portfolio);
    setGoals(goals.map(g => (assets >= g.target && !g.completed) ? { ...g, completed: true } : g));
    const entry = { week: stats.currentWeek, title: currentScenario.title, decision: choice.text, consequence: choice.consequence };
    setHistory([...history, entry]);
    setStats(nextStats);
    setLastConsequence({ text: choice.consequence, title: currentScenario.title });
    
    // Start prefetching IMMEDIATELY
    if (!nextScenario) prefetchNext(nextStats, [...history, entry]);
  };

  const proceed = () => {
    if (nextScenario && stats) {
      setStocks(stocks.map(s => ({ 
        ...s, 
        price: Math.max(10, Math.round(s.price * (1 + (Math.random() * 0.1 - 0.05)))),
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
      }, 50);
    }
  };

  const netAssets = calculateNetAssets(stats, portfolio);

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8 selection:bg-emerald-100">
      {status === GameStatus.START && (
        <div className="max-w-4xl mx-auto text-center space-y-12 py-20 animate-in zoom-in duration-200">
          <div className="bg-white rounded-[3rem] p-16 shadow-2xl border border-slate-100">
            <h2 className="text-7xl font-black text-slate-900 mb-6 tracking-tighter">NairaWise</h2>
            <p className="text-xl text-slate-500 font-bold mb-10">The #1 Nigerian Financial Survival Game</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setStatus(GameStatus.SETUP)} className="px-14 py-6 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2rem] font-black text-2xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-xl">
                Build Legend <ChevronRight />
              </button>
              <button onClick={() => {setStatus(GameStatus.PLAYING); setActiveTab('leaderboard')}} className="p-6 bg-amber-50 text-amber-600 rounded-[2rem] border border-amber-200 hover:bg-amber-100 transition-all">
                <Trophy size={32} />
              </button>
            </div>
          </div>
        </div>
      )}

      {status === GameStatus.SETUP && (
        <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4 duration-200">
          <h2 className="text-4xl font-black flex items-center gap-3"><UserCircle2 className="text-emerald-600" /> Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} placeholder="Full Name" className="p-5 bg-slate-50 border rounded-2xl font-bold focus:ring-2 ring-emerald-500 outline-none" />
            <select value={setupData.city} onChange={e => setSetupData({...setupData, city: e.target.value})} className="p-5 bg-slate-50 border rounded-2xl font-bold">
              {ALL_NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {CHALLENGES.map(c => (
              <button key={c.id} onClick={() => setSetupData({...setupData, challengeId: c.id})} className={`p-5 border-2 rounded-3xl text-left transition-all ${setupData.challengeId === c.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                <p className="font-black text-sm">{c.name}</p>
              </button>
            ))}
          </div>
          <button onClick={handleFinishSetup} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-2xl hover:bg-emerald-600 transition-all shadow-xl">Start Lifecycle</button>
        </div>
      )}

      {status === GameStatus.LOADING && (
        <div className="flex flex-col items-center justify-center py-48">
          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
          <p className="mt-8 font-black text-slate-400 uppercase tracking-[0.4em] text-sm">Syncing Scenarios...</p>
        </div>
      )}

      {status === GameStatus.PLAYING && stats && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <header className="flex justify-between items-center bg-white p-5 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h1 className="text-2xl font-black flex items-center gap-3"><Coins className="text-emerald-500" /> NairaWise</h1>
            <nav className="flex gap-1 p-1 bg-slate-50 rounded-2xl border">
              {['scenario', 'market', 'leaderboard'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>{tab}</button>
              ))}
            </nav>
          </header>

          {activeTab === 'leaderboard' ? (
            <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white animate-in zoom-in duration-200 relative overflow-hidden">
              <Trophy className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 -rotate-12" />
              <h3 className="text-3xl font-black mb-8">Naira Board</h3>
              <div className="space-y-4">
                {leaderboard.map((e, i) => (
                  <div key={i} className="flex justify-between p-6 bg-white/5 rounded-3xl border border-white/5 items-center">
                    <span className="font-bold">{i+1}. {e.name} <span className="text-slate-500 text-xs italic ml-2">{e.city}</span></span>
                    <span className="text-emerald-400 font-black text-xl">₦{e.netAssets.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {stats.name && (
                <button onClick={() => { if(confirm("End this legacy?")) handleRetire(); }} className="mt-10 w-full py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all"><LogOut /> Retire & Archive</button>
              )}
            </div>
          ) : activeTab === 'market' ? (
            <StockMarket 
              stocks={stocks} 
              portfolio={portfolio} 
              news={[]} 
              onBuy={handleBuy} 
              onSell={handleSell} 
              balance={stats.balance} 
              onSetTrigger={handleSetTrigger} 
            />
          ) : lastConsequence ? (
            <div className="bg-white p-16 rounded-[4rem] shadow-2xl text-center border border-slate-100 animate-in zoom-in duration-200">
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-8" />
              <h3 className="text-4xl font-black mb-6 text-slate-900">{lastConsequence.title}</h3>
              <p className="text-2xl text-slate-500 italic mb-12 max-w-2xl mx-auto font-medium leading-relaxed">"{lastConsequence.text}"</p>
              <button onClick={proceed} className="px-20 py-7 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all active:scale-95">
                {nextScenario ? `Week ${stats.currentWeek}` : 'Preparing Next Week...'}
              </button>
            </div>
          ) : (
            <>
              <Dashboard stats={stats} goals={goals} netAssets={netAssets} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 group">
                  <img src={`https://picsum.photos/seed/${currentScenario?.imageTheme || 'money'}/800/500`} className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-105" alt="Scenario" />
                  <div className="p-12 -mt-12 bg-white relative rounded-t-[3.5rem]">
                    <h3 className="text-3xl font-black mb-6 tracking-tight">{currentScenario?.title}</h3>
                    <p className="text-slate-500 text-xl leading-relaxed font-medium">{currentScenario?.description}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-8">Decision Required</p>
                  {currentScenario?.choices.map((choice, i) => (
                    <button key={i} onClick={() => handleChoice(choice)} className="w-full text-left p-9 bg-white border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-[3rem] transition-all group shadow-sm hover:shadow-xl">
                      <p className="font-black text-2xl mb-2 group-hover:text-emerald-700 leading-tight">{choice.text}</p>
                      <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Banknote size={16} /> Impact Analysis Pending</span>
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
