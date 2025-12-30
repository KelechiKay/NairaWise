import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PlayerStats, 
  Scenario, 
  GameLog, 
  GameStatus, 
  Choice,
  Stock,
  PortfolioItem,
  Goal
} from './types';
import { getNextScenario, getEndGameAnalysis } from './services/geminiService';
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
  ChevronRight,
  Trophy,
  Briefcase,
  Zap,
  RefreshCcw,
  Skull,
  Newspaper,
  TrendingUp,
  MapPin,
  Flame,
  Plane,
  Home,
  Crown,
  AlertCircle,
  Baby,
  Users,
  Wallet2,
  BarChart3,
  ShieldCheck,
  MousePointer2
} from 'lucide-react';

const INITIAL_ASSETS: Stock[] = [
  { id: 'lagos-gas', name: 'Lagos Gas Ltd.', price: 12500, history: [12000, 12500], sector: 'Energy', assetType: 'stock' },
  { id: 'nairatech', name: 'NairaTech Solutions', price: 25000, history: [22000, 25000], sector: 'Tech', assetType: 'stock' },
  { id: 'obudu-agri', name: 'Obudu Agriculture', price: 8000, history: [8200, 8000], sector: 'Agriculture', assetType: 'stock' },
  { id: 'naija-balanced', name: 'Naija Balanced Fund', price: 1000, history: [990, 1000], sector: 'Diversified', assetType: 'mutual_fund', description: 'Mixed bonds & stocks for safety.' },
  { id: 'arm-growth', name: 'Hustle Growth Fund', price: 2500, history: [2400, 2500], sector: 'Growth', assetType: 'mutual_fund', description: 'Aggressive equity-only mutual fund.' },
  { id: 'fgn-bond-fund', name: 'FGN Treasury Fund', price: 500, history: [500, 500], sector: 'Government', assetType: 'mutual_fund', description: 'Ultra-safe government bond pool.' },
];

const CHALLENGES = [
  { id: 'black-tax', name: 'Black Tax Heavy', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', description: 'Start with your custom salary, but family needs a cut of every profit.' },
  { id: 'sapa-max', name: 'Sapa Level Max', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', description: 'Start with exactly ₦0 in your account, regardless of income. True survival.' },
  { id: 'inflation', name: 'Inflation Fighter', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', description: 'Start with ₦500k debt from school. Interest is ticking.' },
  { id: 'silver-spoon', name: 'Silver Spoon', icon: Crown, color: 'text-indigo-500', bg: 'bg-indigo-50', description: 'Start with ₦1M inheritance, but happiness drops 2x faster.' }
];

const PRESET_GOALS: Goal[] = [
  { id: 'survive', title: 'The Great Escape', target: 2000000, category: 'savings', completed: false },
  { id: 'lekki', title: 'Lekki Landowner', target: 15000000, category: 'investment', completed: false },
  { id: 'japa', title: 'The Japa Route', target: 40000000, category: 'lifestyle', completed: false },
  { id: 'tycoon', title: 'Naira Tycoon', target: 250000000, category: 'investment', completed: false },
];

const ALL_NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const SAPA_QUOTES = [
  "Calculating the velocity of your financial downfall...",
  "Reviewing your 'Urgent 2k' history...",
  "Consulting the ancestors of the hustle...",
  "Analyzing why you didn't just save your money...",
  "Generating a report that will make you rethink your life choices..."
];

const FALLBACK_SCENARIO: Scenario = {
  title: "Economic Standstill",
  description: "The network is a bit shaky, but the hustle continues. What's your next move while you wait for the economy to refresh?",
  imageTheme: "hustle",
  choices: [
    { text: "Stay Prudent", consequence: "You decide to wait it out.", impact: { balance: 0, savings: 0, debt: 0, happiness: 0 } },
    { text: "Mini Side-Hustle", consequence: "You found a quick gig.", impact: { balance: 5000, savings: 0, debt: 0, happiness: -5 } },
    { text: "Connect with Family", consequence: "Good vibes, but data is expensive.", impact: { balance: -2000, savings: 0, debt: 0, happiness: 10 } },
    { text: "Invest ₦5k in NairaTech", consequence: "You bought a fraction of NairaTech.", investmentId: "nairatech", impact: { balance: -5000, savings: 0, debt: 0, happiness: -2 } },
    { text: "Risk it on a gamble", consequence: "Fortune favors the bold.", impact: { balance: 10000, savings: 0, debt: 0, happiness: -10 } }
  ]
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [loadingType, setLoadingType] = useState<'scenario' | 'report'>('scenario');
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [nextScenario, setNextScenario] = useState<Scenario | null>(null);
  const [history, setHistory] = useState<GameLog[]>([]);
  const [lastConsequences, setLastConsequences] = useState<{text: string; title: string}[] | null>(null);
  const [activeTab, setActiveTab] = useState<'scenario' | 'invest' | 'history'>('scenario');
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_ASSETS);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [gameOverReport, setGameOverReport] = useState<string>('');
  const [currentLoadingQuote, setCurrentLoadingQuote] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const isPrefetching = useRef(false);

  const [setupData, setSetupData] = useState({
    name: '', job: 'Digital Hustler', salary: 150000, city: 'Lagos',
    challengeId: 'sapa-max', selectedGoalId: 'survive', maritalStatus: 'single' as 'single' | 'married', numberOfKids: 0
  });

  useEffect(() => {
    let interval: any;
    if (status === GameStatus.LOADING) {
      interval = setInterval(() => {
        setCurrentLoadingQuote(prev => (prev + 1) % SAPA_QUOTES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [status]);

  const prefetchNext = useCallback(async (s: PlayerStats, h: GameLog[]) => {
    if (isPrefetching.current) return;
    isPrefetching.current = true;
    try {
      const scenario = await getNextScenario(s, h);
      setNextScenario(scenario);
    } catch (e) { 
      setNextScenario(FALLBACK_SCENARIO);
    }
    isPrefetching.current = false;
  }, []);

  // Fix for Error in file App.tsx on line 369: Added resetGame function to handle game restart
  const resetGame = () => {
    setStatus(GameStatus.START);
    setStats(null);
    setGoals([]);
    setCurrentScenario(null);
    setNextScenario(null);
    setHistory([]);
    setLastConsequences(null);
    setPortfolio([]);
    setGameOverReport('');
    setSelectedIndices([]);
    setStocks(INITIAL_ASSETS);
  };

  const handleFinishSetup = async () => {
    if (!setupData.name || !setupData.job) return alert("Oga, complete your profile first!");
    const challenge = CHALLENGES.find(c => c.id === setupData.challengeId)!;
    const initial: PlayerStats = {
      ...setupData, age: 22, balance: setupData.challengeId === 'sapa-max' ? 0 : setupData.challengeId === 'silver-spoon' ? 1000000 : setupData.salary,
      savings: 0, debt: setupData.challengeId === 'inflation' ? 500000 : 0, happiness: 80, currentWeek: 1, challenge: challenge.name
    };
    setLoadingType('scenario'); setStatus(GameStatus.LOADING); setStats(initial);
    setGoals([{ ...PRESET_GOALS.find(g => g.id === setupData.selectedGoalId)! }]);
    try {
      const scenario = await getNextScenario(initial, []);
      setCurrentScenario(scenario); setStatus(GameStatus.PLAYING); prefetchNext(initial, []);
    } catch (e) { 
      setCurrentScenario(FALLBACK_SCENARIO); setStatus(GameStatus.PLAYING);
    }
  };

  const toggleChoice = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(prev => prev.filter(i => i !== index));
    } else if (selectedIndices.length < 2) {
      setSelectedIndices(prev => [...prev, index]);
    }
  };

  const confirmChoices = async () => {
    if (!currentScenario || !stats || selectedIndices.length !== 2) return;

    const chosenOptions = selectedIndices.map(idx => currentScenario.choices[idx]);
    let totalBalanceChange = 0;
    let totalSavingsChange = 0;
    let totalDebtChange = 0;
    let totalHappinessChange = 0;
    const newPortfolios = [...portfolio];

    for (const choice of chosenOptions) {
      totalBalanceChange += choice.impact.balance;
      totalSavingsChange += choice.impact.savings;
      totalDebtChange += choice.impact.debt;
      totalHappinessChange += choice.impact.happiness;

      if (choice.investmentId) {
        const stock = stocks.find(s => s.id === choice.investmentId);
        if (stock) {
          const existing = newPortfolios.find(p => p.stockId === stock.id);
          if (existing) {
            existing.shares += 1;
            existing.averagePrice = (existing.averagePrice * (existing.shares - 1) + stock.price) / existing.shares;
          } else {
            newPortfolios.push({ stockId: stock.id, shares: 1, averagePrice: stock.price });
          }
        }
      }
    }

    const nextStats = {
      ...stats,
      balance: stats.balance + totalBalanceChange,
      savings: Math.max(0, stats.savings + totalSavingsChange),
      debt: Math.max(0, stats.debt + totalDebtChange),
      happiness: Math.min(100, Math.max(0, stats.happiness + totalHappinessChange)),
      currentWeek: stats.currentWeek + 1
    };

    setPortfolio(newPortfolios);
    const logs = chosenOptions.map(c => ({ week: stats.currentWeek, title: currentScenario.title, decision: c.text, consequence: c.consequence }));
    const newHistory = [...history, ...logs];
    setHistory(newHistory);
    setStats(nextStats);
    setSelectedIndices([]);

    if (nextStats.balance < 0) {
      setLoadingType('report'); setStatus(GameStatus.LOADING);
      try {
        const report = await getEndGameAnalysis(nextStats, newHistory);
        setGameOverReport(report); setStatus(GameStatus.GAMEOVER);
      } catch (e) {
        setGameOverReport("Sapa has finally won. You are officially broke, oga.");
        setStatus(GameStatus.GAMEOVER);
      }
      return;
    }

    const assets = nextStats.balance + nextStats.savings - nextStats.debt;
    setGoals(goals.map(g => (assets >= g.target && !g.completed) ? { ...g, completed: true } : g));
    setLastConsequences(chosenOptions.map(c => ({ text: c.consequence, title: currentScenario.title })));
    if (!nextScenario) prefetchNext(nextStats, newHistory);
  };

  const handleBuy = (stockId: string) => {
    const asset = stocks.find(s => s.id === stockId);
    if (!asset || !stats || stats.balance < asset.price) return;
    setStats({ ...stats, balance: stats.balance - asset.price });
    setPortfolio(prev => {
      const existing = prev.find(p => p.stockId === stockId);
      if (existing) return prev.map(p => p.stockId === stockId ? { ...p, shares: p.shares + 1, averagePrice: (p.averagePrice * p.shares + asset.price) / (p.shares + 1) } : p);
      return [...prev, { stockId, shares: 1, averagePrice: asset.price }];
    });
  };

  const handleSell = (stockId: string) => {
    const asset = stocks.find(s => s.id === stockId);
    const holding = portfolio.find(p => p.stockId === stockId);
    if (!asset || !holding || holding.shares <= 0 || !stats) return;
    setStats({ ...stats, balance: stats.balance + asset.price });
    setPortfolio(prev => prev.map(p => p.stockId === stockId ? { ...p, shares: p.shares - 1 } : p).filter(p => p.shares > 0));
  };

  const proceed = () => {
    if (nextScenario && stats) {
      setStocks(stocks.map(s => {
        const volatility = s.assetType === 'mutual_fund' ? 0.02 : 0.10;
        const change = (Math.random() * volatility * 2) - volatility;
        const newPrice = Math.max(1, Math.round(s.price * (1 + change)));
        return { ...s, price: newPrice, history: [...s.history, newPrice].slice(-20) };
      }));
      setCurrentScenario(nextScenario); setLastConsequences(null); setNextScenario(null); prefetchNext(stats, history);
    } else {
      setLoadingType('scenario'); setStatus(GameStatus.LOADING);
      const check = setInterval(() => { if (nextScenario) { clearInterval(check); setStatus(GameStatus.PLAYING); proceed(); } }, 100);
    }
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8">
      {status === GameStatus.START && (
        <div className="max-w-4xl mx-auto text-center space-y-12 py-20 animate-in zoom-in duration-300">
          <div className="bg-white rounded-[4rem] p-20 shadow-2xl border border-slate-100">
            <Coins className="w-24 h-24 text-emerald-600 mx-auto mb-8" />
            <h2 className="text-7xl font-black text-slate-900 mb-4 tracking-tighter">NairaWise</h2>
            <p className="text-2xl text-slate-500 font-bold mb-12 uppercase tracking-widest">Master the Nigerian Hustle</p>
            <button onClick={() => setStatus(GameStatus.SETUP)} className="px-16 py-8 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl flex items-center gap-4 mx-auto transition-all shadow-xl">
              Launch Career <ChevronRight />
            </button>
          </div>
        </div>
      )}

      {status === GameStatus.SETUP && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-300 pb-20">
          <div className="bg-white p-12 md:p-16 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-12">
            <div className="text-center">
               <h2 className="text-4xl font-black mb-2">Configure Your Journey</h2>
               <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Personalize the struggle. Pick your prize.</p>
            </div>
            <div className="space-y-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><UserCircle2 size={24} /> 1. The Persona & Family</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Your Name</label>
                  <input type="text" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} placeholder="e.g. Chinedu" className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Location</label>
                  <select value={setupData.city} onChange={e => setSetupData({...setupData, city: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-colors">
                    {ALL_NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Marital Status</label>
                  <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl">
                    <button onClick={() => setSetupData({...setupData, maritalStatus: 'single', numberOfKids: 0})} className={`flex-1 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${setupData.maritalStatus === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><UserCircle2 size={18} /> Single</button>
                    <button onClick={() => setSetupData({...setupData, maritalStatus: 'married'})} className={`flex-1 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${setupData.maritalStatus === 'married' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Users size={18} /> Married</button>
                  </div>
                </div>
                {setupData.maritalStatus === 'married' && (
                  <div className="space-y-2 animate-in slide-in-from-left-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Number of Kids</label>
                    <div className="relative">
                      <Baby className="absolute left-6 top-5 text-slate-400" size={20} />
                      <input type="number" min="0" max="10" value={setupData.numberOfKids} onChange={e => setSetupData({...setupData, numberOfKids: Number(e.target.value)})} className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Job Title</label>
                  <input type="text" value={setupData.job} onChange={e => setSetupData({...setupData, job: e.target.value})} placeholder="e.g. Freelancer" className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Monthly Income (₦)</label>
                  <div className="relative"><Wallet2 className="absolute left-6 top-5 text-slate-400" size={20} /><input type="number" value={setupData.salary} onChange={e => setSetupData({...setupData, salary: Number(e.target.value)})} className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-colors" /></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><Flame size={24} /> 2. Pick Your Struggle</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CHALLENGES.map(challenge => (
                  <button key={challenge.id} onClick={() => setSetupData({...setupData, challengeId: challenge.id})} className={`text-left p-6 rounded-3xl border-2 transition-all group ${setupData.challengeId === challenge.id ? 'border-slate-900 bg-slate-900 text-white scale-[1.02]' : 'border-slate-100 hover:border-slate-300 bg-white'}`}>
                    <div className="flex items-center gap-4 mb-3"><div className={`p-3 rounded-2xl ${setupData.challengeId === challenge.id ? 'bg-white/10' : challenge.bg}`}><challenge.icon size={24} className={setupData.challengeId === challenge.id ? 'text-white' : challenge.color} /></div><p className="font-black text-lg">{challenge.name}</p></div>
                    <p className={`text-sm font-medium leading-relaxed ${setupData.challengeId === challenge.id ? 'text-slate-300' : 'text-slate-500'}`}>{challenge.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><Trophy size={24} /> 3. The Big Dream</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PRESET_GOALS.map(goal => (
                  <button key={goal.id} onClick={() => setSetupData({...setupData, selectedGoalId: goal.id})} className={`text-center p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${setupData.selectedGoalId === goal.id ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                    {goal.id === 'survive' && <Sparkles className="mb-2" />} {goal.id === 'lekki' && <Home className="mb-2" />} {goal.id === 'japa' && <Plane className="mb-2" />} {goal.id === 'tycoon' && <Crown className="mb-2" />}
                    <p className="font-black text-sm leading-tight uppercase tracking-tight">{goal.title}</p>
                    <p className="text-[10px] font-black opacity-60">Target: ₦{(goal.target / 1000000).toFixed(1)}M</p>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleFinishSetup} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-emerald-600 transition-all shadow-xl mt-6">Start The Hustle</button>
          </div>
        </div>
      )}

      {status === GameStatus.LOADING && (
        <div className="flex flex-col items-center justify-center py-48 text-center animate-in fade-in duration-500">
          <div className="relative mb-10"><Loader2 className={`w-24 h-24 ${loadingType === 'report' ? 'text-rose-500' : 'text-emerald-600'} animate-spin`} />{loadingType === 'report' && <Skull className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-rose-500" />}</div>
          <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-[0.2em]">{loadingType === 'report' ? 'The Post-Mortem' : 'Syncing Grid'}</h3>
          <p className="text-slate-400 font-bold text-xl italic animate-pulse max-w-md">{SAPA_QUOTES[currentLoadingQuote]}</p>
        </div>
      )}

      {status === GameStatus.GAMEOVER && stats && (
        <div className="max-w-4xl mx-auto animate-in zoom-in duration-500">
          <div className="bg-slate-900 rounded-[4rem] p-16 md:p-24 shadow-2xl text-center text-white border-4 border-rose-500/30">
            <Skull className="w-24 h-24 text-rose-500 mx-auto mb-10 animate-pulse" /><h2 className="text-6xl font-black mb-4 tracking-tighter">GAME OVER</h2><p className="text-rose-400 font-bold text-xl uppercase tracking-widest mb-12">Sapa has conquered {stats.name}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <div className="bg-white/5 p-6 rounded-3xl"><p className="text-[10px] font-black text-slate-500 uppercase">Weeks</p><p className="text-2xl font-black">{stats.currentWeek}</p></div>
              <div className="bg-white/5 p-6 rounded-3xl"><p className="text-[10px] font-black text-slate-500 uppercase">Balance</p><p className="text-2xl font-black text-rose-400">₦{stats.balance.toLocaleString()}</p></div>
              <div className="bg-white/5 p-6 rounded-3xl"><p className="text-[10px] font-black text-slate-500 uppercase">Happiness</p><p className="text-2xl font-black">{stats.happiness}%</p></div>
              <div className="bg-white/5 p-6 rounded-3xl"><p className="text-[10px] font-black text-slate-500 uppercase">Assets</p><p className="text-2xl font-black">₦{stats.savings.toLocaleString()}</p></div>
            </div>
            <div className="bg-white/10 p-10 rounded-[3rem] text-left border border-white/5 mb-16 relative overflow-hidden"><Zap className="absolute top-4 right-4 text-amber-400 opacity-20 w-20 h-20" /><h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Newspaper className="text-indigo-400" /> Sapa Report</h3><div className="text-lg text-slate-300 leading-relaxed font-medium whitespace-pre-line border-l-4 border-indigo-500 pl-6">{gameOverReport}</div></div>
            <button onClick={resetGame} className="px-16 py-8 bg-white text-slate-900 hover:bg-emerald-500 hover:text-white rounded-[2.5rem] font-black text-2xl flex items-center gap-4 mx-auto transition-all shadow-xl"><RefreshCcw /> Try Again</button>
          </div>
        </div>
      )}

      {status === GameStatus.PLAYING && stats && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <header className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="flex items-center gap-3"><Coins className="text-emerald-500 w-8 h-8" /><h1 className="text-2xl font-black tracking-tighter">NairaWise</h1></div>
            <nav className="flex gap-2 p-1 bg-slate-50 rounded-2xl">{['scenario', 'invest', 'history'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>{tab === 'invest' ? <span className="flex items-center gap-1.5"><TrendingUp size={14} /> Invest</span> : tab}</button>))}</nav>
          </header>

          {activeTab === 'invest' ? (
            <StockMarket stocks={stocks} portfolio={portfolio} news={[]} onBuy={handleBuy} onSell={handleSell} balance={stats.balance} onSetTrigger={() => {}} />
          ) : activeTab === 'history' ? (
             <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100"><h3 className="text-3xl font-black mb-10">Journal</h3><div className="space-y-4">{history.length === 0 && <p className="text-slate-400 italic font-bold">No history recorded yet.</p>}{history.map((h, i) => (<div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center"><div><p className="text-xs font-black text-indigo-500 uppercase mb-1">Week {h.week}</p><p className="font-black text-lg">{h.title}</p><p className="text-sm text-slate-500 italic">Decision: {h.decision}</p></div></div>))}</div></div>
          ) : lastConsequences ? (
            <div className="bg-white p-20 rounded-[4.5rem] shadow-2xl text-center border border-slate-100 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto mb-10" />
              <h3 className="text-5xl font-black mb-10 text-slate-900 tracking-tight">Week {stats.currentWeek - 1} Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14 max-w-5xl mx-auto">
                {lastConsequences.map((c, idx) => (
                  <div key={idx} className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Outcome {idx + 1}</p>
                    <p className="text-xl text-slate-700 italic leading-relaxed font-medium">"{c.text}"</p>
                  </div>
                ))}
              </div>
              <button onClick={proceed} className="px-24 py-8 bg-slate-900 hover:bg-emerald-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl transition-all active:scale-95">Proceed to Week {stats.currentWeek}</button>
            </div>
          ) : (
            <>
              <Dashboard stats={stats} goals={goals} netAssets={stats.balance + stats.savings - stats.debt} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-6 space-y-8">
                  <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 relative group">
                    <img src={`https://picsum.photos/seed/${currentScenario?.imageTheme || 'hustle'}/1200/800`} className="w-full h-[350px] object-cover transition-transform duration-1000 group-hover:scale-110" alt="Scenario" />
                    <div className="p-12 -mt-12 bg-white relative rounded-t-[3.5rem]">
                      <div className="flex items-center gap-2 mb-4"><Zap className="w-5 h-5 text-amber-500 fill-amber-500" /><span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Strategic Decisions</span></div>
                      <h3 className="text-3xl font-black mb-6 leading-tight tracking-tight text-slate-900">{currentScenario?.title}</h3>
                      <p className="text-slate-500 text-xl leading-relaxed font-medium">{currentScenario?.description}</p>
                      <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MousePointer2 className="text-indigo-500" />
                          <span className="text-sm font-black text-slate-600 uppercase tracking-widest">Strategy Progress</span>
                        </div>
                        <span className={`text-xl font-black ${selectedIndices.length === 2 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                          {selectedIndices.length} / 2 Selected
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-6 flex flex-col gap-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 mb-2 flex justify-between">
                    <span>Choose 2 Strategic Actions</span>
                    {selectedIndices.length === 2 && <span className="text-emerald-500 animate-pulse">Plan Locked!</span>}
                  </p>
                  <div className="grid grid-cols-1 gap-3 flex-1 overflow-y-auto max-h-[600px] pr-2">
                    {currentScenario?.choices.map((choice, i) => {
                      const isInvestment = !!choice.investmentId;
                      const isSelected = selectedIndices.includes(i);
                      const asset = isInvestment ? stocks.find(s => s.id === choice.investmentId) : null;
                      return (
                        <button key={i} onClick={() => toggleChoice(i)} className={`w-full text-left p-6 border-2 rounded-[2rem] transition-all group shadow-sm hover:shadow-xl active:scale-98 ${isSelected ? 'border-emerald-500 bg-emerald-50/50 shadow-emerald-100 shadow-lg scale-[1.02]' : isInvestment ? 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-500' : 'bg-white border-slate-50 hover:border-emerald-500 hover:bg-emerald-50/20'}`}>
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-sm transition-colors ${isSelected ? 'bg-emerald-500 text-white' : isInvestment ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                              {isSelected ? <CheckCircle2 size={20} /> : isInvestment ? (asset?.assetType === 'stock' ? <BarChart3 size={18} /> : <ShieldCheck size={18} />) : i + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className={`font-black text-lg leading-tight ${isSelected ? 'text-emerald-900' : isInvestment ? 'text-indigo-900' : 'group-hover:text-emerald-700'}`}>{choice.text}</p>
                                {isInvestment && <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${isSelected ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}>Investment</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Banknote size={12} /> {choice.impact.balance < 0 ? `Cost: ₦${Math.abs(choice.impact.balance).toLocaleString()}` : `Gain: ₦${choice.impact.balance.toLocaleString()}`}</span>
                                {choice.impact.happiness !== 0 && <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${choice.impact.happiness > 0 ? 'text-emerald-500' : 'text-rose-500'}`}><Heart size={12} /> {choice.impact.happiness > 0 ? `+${choice.impact.happiness}%` : `${choice.impact.happiness}%`}</span>}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={confirmChoices} disabled={selectedIndices.length !== 2} className="w-full py-8 mt-4 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-2xl disabled:opacity-20 disabled:cursor-not-allowed">
                    {selectedIndices.length === 2 ? 'Execute Weekly Plan' : `Pick ${2 - selectedIndices.length} More...`}
                    <ChevronRight />
                  </button>
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