
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
  Goal
} from './types';
import { getNextScenario } from './geminiService';
import Dashboard from './Dashboard';
import StockMarket from './StockMarket';
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
  Briefcase
} from 'lucide-react';

const INITIAL_STOCKS: Stock[] = [
  { id: 'lagos-gas', name: 'Lagos Gas Ltd.', price: 12500, history: [12000, 12500], sector: 'Energy' },
  { id: 'kano-textiles', name: 'Kano Textiles PLC', price: 5000, history: [4800, 5000], sector: 'Manufacturing' },
  { id: 'nairatech', name: 'NairaTech Solutions', price: 25000, history: [22000, 25000], sector: 'Tech' },
  { id: 'obudu-agri', name: 'Obudu Agriculture', price: 8000, history: [8200, 8000], sector: 'Agriculture' },
];

const PRESET_GOALS: Goal[] = [
  { id: 'save-1m', title: 'Escape Sapa (₦1M Savings)', target: 1000000, category: 'savings', completed: false },
  { id: 'land-ibeju', title: 'Ibeju-Lekki Landowner', target: 5000000, category: 'investment', completed: false },
  { id: 'japa', title: 'Japa to Canada/UK', target: 15000000, category: 'lifestyle', completed: false },
  { id: 'wedding', title: 'Royal Nigerian Wedding', target: 3000000, category: 'lifestyle', completed: false },
  { id: 'mercedes', title: 'Buy "Pure Water" Mercedes', target: 8000000, category: 'lifestyle', completed: false },
];

const CITIES = ['Lagos (Island)', 'Lagos (Mainland)', 'Abuja', 'Kano', 'Port Harcourt', 'Ibadan'];
const CHALLENGES = [
  { id: 'black-tax', name: 'Family Black Tax', icon: Heart, description: 'High social costs from relatives.' },
  { id: 'biz-cap', name: 'Small Biz Capital', icon: Briefcase, description: 'Low cash, but high hustle potential.' },
  { id: 'student-debt', name: 'Student Loan Debt', icon: GraduationCap, description: 'Start with ₦250k debt to clear.' },
  { id: 'fresh-start', name: 'Clean Slate', icon: Sparkles, description: 'No baggage, just vibes and dreams.' }
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
  const [activeTab, setActiveTab] = useState<'scenario' | 'market' | 'history'>('scenario');
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [marketNews, setMarketNews] = useState<MarketNews[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  const [setupData, setSetupData] = useState({
    name: '',
    age: 24,
    job: 'Social Media Manager',
    salary: 120000,
    city: 'Lagos (Mainland)',
    challengeId: 'fresh-start',
    selectedGoalId: 'save-1m'
  });

  useEffect(() => {
    const saved = localStorage.getItem('nairawise_session_v3');
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
      localStorage.setItem('nairawise_session_v3', JSON.stringify({
        status, stats, goals, history, stocks, portfolio, marketNews, currentScenario
      }));
    }
  }, [status, stats, goals, history, stocks, portfolio, marketNews, currentScenario]);

  const prefetchScenario = async (currentStats: PlayerStats, gameHistory: GameLog[]) => {
    setLoadingNext(true);
    try {
      const scenario = await getNextScenario(currentStats, gameHistory);
      setNextScenario(scenario);
    } catch (e) { console.error(e); }
    setLoadingNext(false);
  };

  const handleFinishSetup = async () => {
    if (!setupData.name) {
      alert("Haba! What is your name?");
      return;
    }

    const challenge = CHALLENGES.find(c => c.id === setupData.challengeId)!;
    
    const initialStats: PlayerStats = {
      name: setupData.name,
      age: setupData.age,
      job: setupData.job,
      salary: setupData.salary,
      balance: setupData.salary,
      savings: setupData.challengeId === 'biz-cap' ? 0 : 25000,
      debt: setupData.challengeId === 'student-debt' ? 250000 : 0,
      happiness: setupData.challengeId === 'black-tax' ? 65 : 85,
      currentWeek: 1,
      city: setupData.city,
      challenge: challenge.name
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
      alert("Network wahala. Try again.");
      setStatus(GameStatus.SETUP);
    }
  };

  const updateMarketPrices = (event?: MarketNews) => {
    if (!stats) return;
    setStocks(prev => prev.map(stock => {
      let changePercent = (Math.random() * 8 - 4) / 100;
      if (event && event.stockId === stock.id) {
        if (event.impact === 'positive') changePercent += 0.10;
        if (event.impact === 'negative') changePercent -= 0.10;
      }
      const newPrice = Math.max(50, Math.round(stock.price * (1 + changePercent)));
      return { ...stock, price: newPrice, history: [...stock.history, newPrice].slice(-12) };
    }));
    if (event) setMarketNews(prev => [...prev, event].slice(-15));
  };

  const buyStock = (stockId: string) => {
    if (!stats) return;
    const stock = stocks.find(s => s.id === stockId);
    if (!stock || stats.balance < stock.price) return;
    setStats({ ...stats, balance: stats.balance - stock.price });
    setPortfolio(prev => {
      const existing = prev.find(p => p.stockId === stockId);
      if (existing) return prev.map(p => p.stockId === stockId ? { ...p, shares: p.shares + 1 } : p);
      return [...prev, { stockId, shares: 1, averagePrice: stock.price }];
    });
  };

  const sellStock = (stockId: string) => {
    if (!stats) return;
    const stock = stocks.find(s => s.id === stockId);
    const holding = portfolio.find(p => p.stockId === stockId);
    if (!stock || !holding || holding.shares <= 0) return;
    setStats({ ...stats, balance: stats.balance + stock.price });
    setPortfolio(prev => prev.map(p => p.stockId === stockId ? { ...p, shares: p.shares - 1 } : p).filter(p => p.shares > 0));
  };

  const handleChoice = async (choice: Choice) => {
    if (!currentScenario || !stats) return;
    const newStats = {
      ...stats,
      balance: Math.max(0, stats.balance + choice.impact.balance),
      savings: Math.max(0, stats.savings + choice.impact.savings),
      debt: Math.max(0, stats.debt + choice.impact.debt),
      happiness: Math.min(100, Math.max(0, stats.happiness + choice.impact.happiness)),
      currentWeek: stats.currentWeek + 1
    };
    
    const portfolioVal = portfolio.reduce((total, p) => {
      const stock = stocks.find(s => s.id === p.stockId);
      return total + (stock ? stock.price * p.shares : 0);
    }, 0);
    const netAssets = newStats.balance + newStats.savings + portfolioVal;

    const updatedGoals = goals.map(g => {
      if (!g.completed && netAssets >= g.target) {
        setNotifications(prev => [...prev, `🎉 DREAM ACHIEVED: ${g.title}!`]);
        return { ...g, completed: true };
      }
      return g;
    });

    setGoals(updatedGoals);
    setHistory([...history, { week: stats.currentWeek, title: currentScenario.title, decision: choice.text, consequence: choice.consequence }]);
    setStats(newStats);
    setLastConsequence({ text: choice.consequence, title: currentScenario.title });
  };

  const proceedToNextWeek = () => {
    if (!stats) return;
    setNotifications([]);
    if (nextScenario) {
      updateMarketPrices(nextScenario.marketEvent);
      setCurrentScenario(nextScenario);
      setLastConsequence(null);
      setNextScenario(null);
      prefetchScenario(stats, history);
    } else {
      setStatus(GameStatus.LOADING);
      setTimeout(() => setStatus(GameStatus.PLAYING), 800);
    }
  };

  const netAssets = (stats?.balance || 0) + (stats?.savings || 0) + portfolio.reduce((total, p) => {
    const stock = stocks.find(s => s.id === p.stockId);
    return total + (stock ? stock.price * p.shares : 0);
  }, 0);

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-8">
      {status === GameStatus.START && (
        <div className="bg-white rounded-[3rem] p-16 shadow-2xl text-center border border-slate-100 animate-in zoom-in duration-700">
          <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
            <Sparkles className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-6xl font-black text-slate-900 mb-8 tracking-tighter">Escape Sapa. <br /><span className="text-emerald-600">Build Wealth.</span></h2>
          <p className="text-xl text-slate-500 mb-12 max-w-xl mx-auto font-medium">Experience the highs and lows of the Nigerian economy. Personal, localized, and real.</p>
          <button onClick={() => setStatus(GameStatus.SETUP)} className="px-12 py-7 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2rem] font-black text-2xl transition-all shadow-2xl active:scale-95">Set Up Your Oga Profile</button>
        </div>
      )}

      {status === GameStatus.SETUP && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-12 duration-500">
          <header className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-2">Create Your Persona</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Step 1: Your Financial DNA</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
              <h3 className="text-xl font-black flex items-center gap-3"><UserCircle2 className="w-6 h-6 text-emerald-600" /> Basic Info</h3>
              <div className="space-y-4">
                <div className="group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Full Name</label>
                  <input type="text" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-bold" placeholder="Ebuka, Tunde, or Amina" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Age</label>
                    <input type="number" value={setupData.age} onChange={e => setSetupData({...setupData, age: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Location</label>
                    <select value={setupData.city} onChange={e => setSetupData({...setupData, city: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-bold">
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Job Role</label>
                  <input type="text" value={setupData.job} onChange={e => setSetupData({...setupData, job: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Monthly Salary (₦)</label>
                  <input type="number" value={setupData.salary} onChange={e => setSetupData({...setupData, salary: Number(e.target.value)})} className="w-full p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl focus:border-emerald-500 outline-none font-bold text-emerald-700" />
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-xl font-black flex items-center gap-3 mb-6"><ShieldAlert className="w-6 h-6 text-rose-500" /> Starting Challenge</h3>
                <div className="grid grid-cols-2 gap-3">
                  {CHALLENGES.map(c => (
                    <button key={c.id} onClick={() => setSetupData({...setupData, challengeId: c.id})} className={`p-4 rounded-2xl border-2 text-left transition-all ${setupData.challengeId === c.id ? 'border-rose-500 bg-rose-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <c.icon className={`w-5 h-5 mb-2 ${setupData.challengeId === c.id ? 'text-rose-600' : 'text-slate-400'}`} />
                      <p className="font-black text-[11px] leading-tight">{c.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-xl font-black flex items-center gap-3 mb-6"><Target className="w-6 h-6 text-indigo-600" /> The Big Dream</h3>
                <div className="space-y-3">
                  {PRESET_GOALS.map(g => (
                    <button key={g.id} onClick={() => setSetupData({...setupData, selectedGoalId: g.id})} className={`w-full p-4 rounded-2xl border-2 text-left flex justify-between items-center transition-all ${setupData.selectedGoalId === g.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <div>
                        <p className="font-black text-sm">{g.title}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">₦{g.target.toLocaleString()}</p>
                      </div>
                      {setupData.selectedGoalId === g.id && <Sparkles className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <button onClick={handleFinishSetup} className="w-full py-6 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2rem] font-black text-2xl shadow-2xl transition-all">Start My Life Journey</button>
        </div>
      )}

      {status === GameStatus.LOADING && (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse">Calculating Regional Inflation...</p>
        </div>
      )}

      {status === GameStatus.PLAYING && stats && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <header className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg"><Coins className="w-5 h-5 text-white" /></div>
              <h1 className="text-2xl font-black text-slate-900">NairaWise</h1>
            </div>
            <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
              <button onClick={() => setActiveTab('scenario')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'scenario' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>LIFE</button>
              <button onClick={() => setActiveTab('market')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'market' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>MARKET</button>
            </div>
          </header>

          <Dashboard stats={stats} goals={goals} netAssets={netAssets} />

          {activeTab === 'market' ? (
            <StockMarket stocks={stocks} portfolio={portfolio} news={marketNews} onBuy={buyStock} onSell={sellStock} balance={stats.balance} onSetTrigger={() => {}} />
          ) : lastConsequence ? (
            <div className="bg-white p-16 rounded-[3rem] shadow-2xl text-center border border-slate-100">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
              <h3 className="text-3xl font-black mb-4">{lastConsequence.title}</h3>
              <p className="text-xl text-slate-500 italic mb-10 leading-relaxed">"{lastConsequence.text}"</p>
              <button onClick={proceedToNextWeek} className="px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg">Proceed to Week {stats.currentWeek}</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100">
                <img src={`https://picsum.photos/seed/${currentScenario?.imageTheme || 'nigeria'}/1000/600`} className="w-full h-64 object-cover" alt="Scenario" />
                <div className="p-10">
                  <h3 className="text-3xl font-black mb-6 leading-tight">{currentScenario?.title}</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">{currentScenario?.description}</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Take Action</p>
                {currentScenario?.choices.map((choice, i) => (
                  <button key={i} onClick={() => handleChoice(choice)} className="w-full text-left p-8 bg-white border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 rounded-[2rem] transition-all group shadow-sm">
                    <p className="font-black text-xl mb-2 group-hover:text-emerald-700">{choice.text}</p>
                    <div className="flex gap-4">
                       <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Banknote className="w-3 h-3" /> Financial Impact</span>
                       {choice.impact.happiness > 0 && <span className="text-[9px] font-black text-sky-500 uppercase flex items-center gap-1"><Heart className="w-3 h-3 fill-sky-500" /> Happiness +</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
