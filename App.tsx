
import React, { useState, useEffect } from 'react';
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
import { getNextScenario } from './services/geminiService';
import Dashboard from './components/Dashboard';
import StockMarket from './components/StockMarket';
import { 
  Loader2, 
  Coins, 
  CheckCircle2, 
  Bell,
  UserCircle2,
  Banknote,
  Target,
  Sparkles,
  Heart,
  MapPin,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  ChevronRight,
  TrendingUp,
  History,
  Zap,
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
  { id: 'black-tax', name: 'Heavy Black Tax', icon: Heart, description: 'Family expects a cut of every Naira you make.' },
  { id: 'no-capital', name: 'Zero Capital', icon: Banknote, description: 'Start with ₦0 in savings and high bills.' },
  { id: 'student-debt', name: 'Massive Student Debt', icon: GraduationCap, description: '₦500k debt at 10% weekly interest.' },
  { id: 'fresh-start', name: 'Silver Spoon (Mini)', icon: Sparkles, description: 'Start with a small inheritance (₦200k).' }
];

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [nextScenario, setNextScenario] = useState<Scenario | null>(null);
  const [history, setHistory] = useState<GameLog[]>([]);
  const [lastConsequence, setLastConsequence] = useState<{text: string; title: string} | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenario' | 'market' | 'history' | 'leaderboard'>('scenario');
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [marketNews, setMarketNews] = useState<MarketNews[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [setupData, setSetupData] = useState({
    name: '',
    age: 22,
    job: 'Junior Accountant',
    salary: 85000,
    city: 'Lagos',
    challengeId: 'no-capital',
    selectedGoalId: 'save-1m'
  });

  useEffect(() => {
    const saved = localStorage.getItem('nairawise_1000w_v2');
    const savedLeaderboard = localStorage.getItem('nairawise_leaderboard');
    
    if (savedLeaderboard) setLeaderboard(JSON.parse(savedLeaderboard));
    
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.status === GameStatus.PLAYING) {
          setStats(data.stats);
          setGoals(data.goals);
          setHistory(data.history);
          setStocks(data.stocks || INITIAL_STOCKS);
          setPortfolio(data.portfolio || []);
          setMarketNews(data.marketNews || []);
          setCurrentScenario(data.currentScenario);
          setStatus(GameStatus.PLAYING);
          prefetchScenario(data.stats, data.history);
        }
      } catch (e) { console.error("Restore failed", e); }
    }
  }, []);

  useEffect(() => {
    if (status === GameStatus.PLAYING && stats) {
      localStorage.setItem('nairawise_1000w_v2', JSON.stringify({
        status, stats, goals, history, stocks, portfolio, marketNews, currentScenario
      }));
    }
    localStorage.setItem('nairawise_leaderboard', JSON.stringify(leaderboard));
  }, [status, stats, goals, history, stocks, portfolio, marketNews, currentScenario, leaderboard]);

  const prefetchScenario = async (currentStats: PlayerStats, gameHistory: GameLog[]) => {
    if (loadingNext) return;
    setLoadingNext(true);
    try {
      const scenario = await getNextScenario(currentStats, gameHistory);
      setNextScenario(scenario);
    } catch (e) { console.error(e); }
    setLoadingNext(false);
  };

  const calculateNetAssets = (currentStats: PlayerStats | null, currentPortfolio: PortfolioItem[]) => {
    if (!currentStats) return 0;
    const portfolioValue = currentPortfolio.reduce((total, p) => {
      const stock = stocks.find(s => s.id === p.stockId);
      return total + (stock ? stock.price * p.shares : 0);
    }, 0);
    return currentStats.balance + currentStats.savings + portfolioValue - currentStats.debt;
  };

  const getWealthRank = (netAssets: number) => {
    if (netAssets >= 100000000) return "Pan-African Legend";
    if (netAssets >= 20000000) return "Oga at the Top";
    if (netAssets >= 5000000) return "Confirmed Boss";
    if (netAssets >= 1000000) return "Middle Class Sapa-Survivor";
    if (netAssets < 0) return "Dept-Ridden Debtor";
    return "Hustler Extraordinaire";
  };

  const handleRetire = () => {
    if (!stats) return;
    const netAssets = calculateNetAssets(stats, portfolio);
    const entry: LeaderboardEntry = {
      name: stats.name,
      city: stats.city,
      netAssets,
      week: stats.currentWeek,
      rank: getWealthRank(netAssets),
      timestamp: Date.now()
    };
    
    setLeaderboard(prev => [...prev, entry].sort((a, b) => b.netAssets - a.netAssets).slice(0, 20));
    alert(`Retired as a ${entry.rank} with ₦${netAssets.toLocaleString()}!`);
    setStatus(GameStatus.START);
    localStorage.removeItem('nairawise_1000w_v2');
  };

  const handleFinishSetup = async () => {
    if (!setupData.name) { alert("Oga, tell us your name!"); return; }

    const initialStats: PlayerStats = {
      name: setupData.name,
      age: setupData.age,
      job: setupData.job,
      salary: setupData.salary,
      balance: setupData.salary,
      savings: setupData.challengeId === 'fresh-start' ? 200000 : 0,
      debt: setupData.challengeId === 'student-debt' ? 500000 : 0,
      happiness: setupData.challengeId === 'black-tax' ? 60 : 80,
      currentWeek: 1,
      city: setupData.city,
      challenge: CHALLENGES.find(c => c.id === setupData.challengeId)?.name || ''
    };

    const initialGoal = PRESET_GOALS.find(g => g.id === setupData.selectedGoalId)!;

    setStatus(GameStatus.LOADING);
    setStats(initialStats);
    setGoals([{ ...initialGoal }]);
    
    try {
      const scenario = await getNextScenario(initialStats, []);
      setCurrentScenario(scenario);
      setStatus(GameStatus.PLAYING);
      prefetchScenario(initialStats, []);
    } catch (e) {
      console.error(e);
      setStatus(GameStatus.SETUP);
    }
  };

  const handleChoice = async (choice: Choice) => {
    if (!currentScenario || !stats) return;
    
    const debtInterest = stats.debt > 0 ? Math.floor(stats.debt * 0.02) : 0;
    const newStats = {
      ...stats,
      balance: Math.max(0, stats.balance + choice.impact.balance),
      savings: Math.max(0, stats.savings + choice.impact.savings),
      debt: Math.max(0, stats.debt + choice.impact.debt + debtInterest),
      happiness: Math.min(100, Math.max(0, stats.happiness + choice.impact.happiness)),
      currentWeek: stats.currentWeek + 1
    };
    
    const netAssets = calculateNetAssets(newStats, portfolio);
    const updatedGoals = goals.map(g => {
      if (!g.completed && netAssets >= g.target) {
        setNotifications(prev => [...prev, `🎉 DREAM REALIZED: ${g.title}!`]);
        return { ...g, completed: true };
      }
      return g;
    });

    setGoals(updatedGoals);
    setHistory([...history, { 
      week: stats.currentWeek, 
      title: currentScenario.title, 
      decision: choice.text, 
      consequence: choice.consequence 
    }]);
    setStats(newStats);
    setLastConsequence({ text: choice.consequence, title: currentScenario.title });

    // Pre-fetch if we haven't already
    if (!nextScenario && !loadingNext) {
        prefetchScenario(newStats, history);
    }
  };

  const proceedToNextWeek = () => {
    if (!stats) return;
    setNotifications([]);
    if (nextScenario) {
      // Basic market update
      setStocks(prev => prev.map(s => ({
        ...s,
        price: Math.max(10, Math.round(s.price * (1 + (Math.random() * 0.1 - 0.05)))),
        history: [...s.history, s.price].slice(-20)
      })));
      
      setCurrentScenario(nextScenario);
      setLastConsequence(null);
      setNextScenario(null);
      // Immediately start pre-fetching the one after that
      prefetchScenario(stats, history);
    } else {
      // If next scenario isn't ready yet, only show a loader until it is.
      // We don't want to add artificial delays.
      setStatus(GameStatus.LOADING);
      const checkReady = setInterval(() => {
          if (nextScenario) {
              clearInterval(checkReady);
              setStatus(GameStatus.PLAYING);
              proceedToNextWeek();
          }
      }, 100);
    }
  };

  const netAssets = calculateNetAssets(stats, portfolio);

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-10 selection:bg-indigo-100">
      {status === GameStatus.START && (
        <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in duration-300">
          <div className="bg-white rounded-[3.5rem] p-20 shadow-2xl text-center border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500"></div>
            <div className="bg-emerald-50 w-28 h-28 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
              <Sparkles className="w-14 h-14 text-emerald-600" />
            </div>
            <h2 className="text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">1000 Weeks to <br /><span className="text-emerald-600">Legendary Wealth.</span></h2>
            <div className="flex justify-center gap-4 mb-14">
              <button onClick={() => setStatus(GameStatus.SETUP)} className="px-16 py-8 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2.5rem] font-black text-2xl transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-4">
                Build Your Persona <ChevronRight className="w-8 h-8" />
              </button>
              <button onClick={() => {setStatus(GameStatus.PLAYING); setActiveTab('leaderboard'); setStats({} as any)}} className="px-8 py-8 bg-amber-50 text-amber-600 border border-amber-200 rounded-[2.5rem] font-black text-xl hover:bg-amber-100 transition-all">
                <Trophy className="w-8 h-8" />
              </button>
            </div>
          </div>
          
          {/* Quick Hall of Fame Preview */}
          {leaderboard.length > 0 && (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
               <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Trophy className="text-amber-500" /> NairaWise Hall of Fame</h3>
               <div className="space-y-4">
                  {leaderboard.slice(0, 3).map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                       <div className="flex items-center gap-4">
                          <span className="text-2xl font-black text-slate-300">#{i+1}</span>
                          <div>
                            <p className="font-black text-slate-900">{e.name}</p>
                            <p className="text-xs text-slate-400">{e.city} • {e.rank}</p>
                          </div>
                       </div>
                       <p className="text-xl font-black text-emerald-600">₦{e.netAssets.toLocaleString()}</p>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      )}

      {status === GameStatus.SETUP && (
        <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-6 duration-300">
          <header className="flex justify-between items-end">
             <div>
                <h2 className="text-5xl font-black text-slate-900">Your Identity</h2>
                <p className="text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Targeting all 36 States</p>
             </div>
             <MapPin className="w-12 h-12 text-emerald-500" />
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
              <h3 className="text-2xl font-black flex items-center gap-3"><UserCircle2 className="w-8 h-8 text-emerald-600" /> Identity & Economy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-1">Full Name</label>
                  <input type="text" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500 outline-none font-bold text-lg" placeholder="e.g. Ebuka" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-1">Regional HQ (State)</label>
                  <select value={setupData.city} onChange={e => setSetupData({...setupData, city: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500 outline-none font-bold text-lg">
                    {ALL_NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-1">Career / Role</label>
                  <input type="text" value={setupData.job} onChange={e => setSetupData({...setupData, job: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500 outline-none font-bold text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-1">Monthly Salary (₦)</label>
                  <input type="number" value={setupData.salary} onChange={e => setSetupData({...setupData, salary: Number(e.target.value)})} className="w-full p-5 bg-emerald-50 border-2 border-emerald-100 rounded-3xl focus:border-emerald-500 outline-none font-bold text-lg text-emerald-700" />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                <h3 className="text-xl font-black flex items-center gap-3 mb-6"><ShieldAlert className="w-6 h-6 text-rose-500" /> Initial Challenge</h3>
                <div className="space-y-3">
                  {CHALLENGES.map(c => (
                    <button key={c.id} onClick={() => setSetupData({...setupData, challengeId: c.id})} className={`w-full p-5 rounded-[2rem] border-2 text-left transition-all ${setupData.challengeId === c.id ? 'border-rose-500 bg-rose-50' : 'border-slate-50 hover:border-slate-200'}`}>
                      <div className="flex items-center gap-3 mb-1">
                        <c.icon className={`w-5 h-5 ${setupData.challengeId === c.id ? 'text-rose-600' : 'text-slate-400'}`} />
                        <p className="font-black text-sm">{c.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <button onClick={handleFinishSetup} className="w-full py-8 bg-slate-900 hover:bg-emerald-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl transition-all">Initialize Wealth Cycle</button>
        </div>
      )}

      {status === GameStatus.LOADING && (
        <div className="flex flex-col items-center justify-center py-48">
          <Loader2 className="w-24 h-24 text-emerald-600 animate-spin" />
          <p className="text-slate-400 font-black uppercase text-sm tracking-[0.5em] mt-10 animate-pulse">Syncing with Nigerian Bureau of Stats...</p>
        </div>
      )}

      {status === GameStatus.PLAYING && stats && (
        <div className="space-y-10 animate-in fade-in duration-300">
          <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 p-3.5 rounded-2xl shadow-xl"><Coins className="w-8 h-8 text-white" /></div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">NairaWise</h1>
            </div>
            <div className="flex gap-2 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
              <button onClick={() => setActiveTab('scenario')} className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all ${activeTab === 'scenario' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>LIFE</button>
              <button onClick={() => setActiveTab('market')} className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all ${activeTab === 'market' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>MARKET</button>
              <button onClick={() => setActiveTab('history')} className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>JOURNAL</button>
              <button onClick={() => setActiveTab('leaderboard')} className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all ${activeTab === 'leaderboard' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>BOARD</button>
            </div>
          </header>

          {activeTab === 'leaderboard' ? (
            <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in duration-300">
               <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden">
                  <Trophy className="absolute top-0 right-0 w-64 h-64 text-white/5 -rotate-12" />
                  <h3 className="text-4xl font-black mb-10 flex items-center gap-4"><Trophy className="text-amber-400" /> Collation Hub</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                     <div className="bg-white/10 p-8 rounded-[2rem] border border-white/10">
                        <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Your Current Legend</p>
                        <p className="text-3xl font-black text-emerald-400">₦{netAssets.toLocaleString()}</p>
                        <p className="text-sm font-bold text-slate-300 mt-2">{getWealthRank(netAssets)}</p>
                        {stats.name && (
                          <button onClick={handleRetire} className="mt-6 w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                            <LogOut className="w-5 h-5" /> Retire & Save Score
                          </button>
                        )}
                     </div>
                     <div className="bg-white/10 p-8 rounded-[2rem] border border-white/10">
                        <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Sharing Meta</p>
                        <button onClick={() => alert("Legend copied to clipboard!")} className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                           <Share2 className="w-5 h-5" /> Export Wisdom
                        </button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-xs font-black uppercase text-slate-400 tracking-widest px-4">Global Collation</p>
                     {leaderboard.length === 0 ? (
                       <p className="text-center py-20 text-slate-500 italic">No legends found yet. Start your journey.</p>
                     ) : (
                       leaderboard.map((e, i) => (
                         <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                            <div className="flex items-center gap-6">
                               <span className="text-3xl font-black text-white/10">#{i+1}</span>
                               <div>
                                  <p className="text-lg font-black text-white">{e.name}</p>
                                  <p className="text-xs text-slate-400 uppercase font-black">{e.city} • {e.rank}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-xl font-black text-emerald-400">₦{e.netAssets.toLocaleString()}</p>
                               <p className="text-[10px] text-slate-500">Week {e.week}</p>
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>
          ) : (
            <>
              <Dashboard stats={stats} goals={goals} netAssets={netAssets} />

              {activeTab === 'market' ? (
                <StockMarket stocks={stocks} portfolio={portfolio} news={marketNews} onBuy={() => {}} onSell={() => {}} balance={stats.balance} onSetTrigger={() => {}} />
              ) : activeTab === 'history' ? (
                <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
                    <h3 className="text-2xl font-black mb-8">Naira Journal</h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                        {[...history].reverse().map((log, i) => (
                            <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Week {log.week}</span>
                                    <span className="text-sm font-bold text-slate-900">{log.title}</span>
                                </div>
                                <p className="text-slate-500 text-sm">Action: <span className="text-slate-900 font-bold">{log.decision}</span></p>
                            </div>
                        ))}
                    </div>
                </div>
              ) : lastConsequence ? (
                <div className="bg-white p-20 rounded-[4rem] shadow-2xl text-center border border-slate-100 animate-in fade-in duration-300">
                  <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-10" />
                  <h3 className="text-4xl font-black mb-6 text-slate-900">{lastConsequence.title}</h3>
                  <p className="text-2xl text-slate-500 italic mb-14 max-w-2xl mx-auto font-medium">"{lastConsequence.text}"</p>
                  <button onClick={proceedToNextWeek} className="px-20 py-7 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl transition-all shadow-2xl">
                    {loadingNext && !nextScenario ? 'Preparing Next Week...' : `Proceed to Week ${stats.currentWeek}`}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="bg-white rounded-[4rem] overflow-hidden shadow-2xl border border-slate-100 relative group">
                    <img src={`https://picsum.photos/seed/${currentScenario?.imageTheme || 'financial'}/1200/800`} className="w-full h-96 object-cover" alt="Scenario" />
                    <div className="p-14 -mt-16 bg-white relative rounded-t-[4rem]">
                      <h3 className="text-4xl font-black mb-8 leading-tight tracking-tight text-slate-900">{currentScenario?.title}</h3>
                      <p className="text-slate-500 text-2xl leading-relaxed font-medium">{currentScenario?.description}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] px-8">Executive Mandate</p>
                    {currentScenario?.choices.map((choice, i) => (
                      <button key={i} onClick={() => handleChoice(choice)} className="w-full text-left p-10 bg-white border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-[3rem] transition-all group shadow-sm hover:shadow-2xl relative">
                        <p className="font-black text-2xl mb-4 group-hover:text-indigo-700 leading-tight pr-4">{choice.text}</p>
                        <div className="flex gap-6">
                          <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                            <Banknote className="w-4 h-4" /> ₦ Liquidity Impact
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
