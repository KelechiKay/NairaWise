
import React, { useState, useEffect } from 'react';
import { 
  PlayerStats, 
  Scenario, 
  GameLog, 
  GameStatus, 
  Choice,
  Stock,
  PortfolioItem,
  MarketNews
} from './types';
import { getNextScenario, getEndGameAnalysis } from './geminiService';
import Dashboard from './Dashboard';
import StockMarket from './StockMarket';
import { 
  Loader2, 
  Coins, 
  ArrowRight, 
  RefreshCw, 
  ShieldAlert,
  Trophy,
  History,
  CheckCircle2,
  TrendingUp,
  Layout,
  Briefcase,
  Heart,
  Calendar,
  Wallet,
  Bell,
  LogOut
} from 'lucide-react';

const INITIAL_STOCKS: Stock[] = [
  { id: 'lagos-gas', name: 'Lagos Gas Ltd.', price: 12500, history: [12000, 12500], sector: 'Energy' },
  { id: 'kano-textiles', name: 'Kano Textiles PLC', price: 5000, history: [4800, 5000], sector: 'Manufacturing' },
  { id: 'nairatech', name: 'NairaTech Solutions', price: 25000, history: [22000, 25000], sector: 'Tech' },
  { id: 'obudu-agri', name: 'Obudu Agriculture', price: 8000, history: [8200, 8000], sector: 'Agriculture' },
];

const INITIAL_STATS: PlayerStats = {
  balance: 150000,
  savings: 20000,
  debt: 0,
  happiness: 80,
  currentWeek: 1,
  job: "Lagos Junior Consultant"
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [nextScenario, setNextScenario] = useState<Scenario | null>(null);
  const [history, setHistory] = useState<GameLog[]>([]);
  const [lastConsequence, setLastConsequence] = useState<{text: string; title: string} | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  const [endGameText, setEndGameText] = useState("");
  const [activeTab, setActiveTab] = useState<'scenario' | 'market' | 'history'>('scenario');
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [marketNews, setMarketNews] = useState<MarketNews[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('nairawise_session');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.status === GameStatus.PLAYING) {
        setStats(data.stats);
        setHistory(data.history);
        setStocks(data.stocks || INITIAL_STOCKS);
        setPortfolio(data.portfolio || []);
        setCurrentScenario(data.currentScenario);
        setStatus(GameStatus.PLAYING);
        prefetchScenario(data.stats, data.history);
      }
    }
  }, []);

  const prefetchScenario = async (currentStats: PlayerStats, gameHistory: GameLog[]) => {
    setLoadingNext(true);
    try {
      const scenario = await getNextScenario(currentStats, gameHistory);
      setNextScenario(scenario);
    } catch (e) { console.error(e); }
    setLoadingNext(false);
  };

  const startGame = async () => {
    setStatus(GameStatus.LOADING);
    const scenario = await getNextScenario(INITIAL_STATS, []);
    setCurrentScenario(scenario);
    setStatus(GameStatus.PLAYING);
    prefetchScenario(INITIAL_STATS, []);
  };

  const handleChoice = async (choice: Choice) => {
    if (!currentScenario) return;
    const newStats = {
      ...stats,
      balance: Math.max(0, stats.balance + choice.impact.balance),
      savings: Math.max(0, stats.savings + choice.impact.savings),
      debt: Math.max(0, stats.debt + choice.impact.debt),
      happiness: Math.min(100, Math.max(0, stats.happiness + choice.impact.happiness)),
      currentWeek: stats.currentWeek + 1
    };
    setHistory([...history, { week: stats.currentWeek, title: currentScenario.title, decision: choice.text, consequence: choice.consequence }]);
    setStats(newStats);
    setLastConsequence({ text: choice.consequence, title: currentScenario.title });
  };

  const proceedToNextWeek = () => {
    if (nextScenario) {
      setCurrentScenario(nextScenario);
      setLastConsequence(null);
      setNextScenario(null);
      prefetchScenario(stats, history);
    } else {
      setStatus(GameStatus.LOADING);
      setTimeout(() => {
          if (nextScenario) {
            setCurrentScenario(nextScenario);
            setLastConsequence(null);
            setStatus(GameStatus.PLAYING);
          }
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-10">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-3 rounded-2xl shadow-xl"><Coins className="w-8 h-8 text-white" /></div>
          <h1 className="text-3xl font-black text-slate-900">NairaWise</h1>
        </div>
        {status === GameStatus.PLAYING && (
          <div className="flex gap-2 bg-white/50 p-1.5 rounded-2xl border border-slate-200">
            <button onClick={() => setActiveTab('scenario')} className={`px-5 py-2.5 rounded-xl text-xs font-black ${activeTab === 'scenario' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Life</button>
            <button onClick={() => setActiveTab('market')} className={`px-5 py-2.5 rounded-xl text-xs font-black ${activeTab === 'market' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Exchange</button>
            <button onClick={() => setActiveTab('history')} className={`px-5 py-2.5 rounded-xl text-xs font-black ${activeTab === 'history' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>Journal</button>
          </div>
        )}
      </header>

      <main>
        {status === GameStatus.START && (
          <div className="bg-white rounded-[2.5rem] p-16 shadow-2xl text-center">
            <h2 className="text-5xl font-black text-slate-900 mb-6">Survival in the Naira economy.</h2>
            <p className="text-xl text-slate-600 mb-10">Master your income, manage Sapa, and build your Nigerian empire.</p>
            <button onClick={startGame} className="px-12 py-6 bg-slate-900 text-white rounded-3xl font-black text-2xl">Enter the Market</button>
          </div>
        )}

        {status === GameStatus.LOADING && (
          <div className="flex flex-col items-center py-32"><Loader2 className="w-20 h-20 text-emerald-600 animate-spin mb-6" /></div>
        )}

        {status === GameStatus.PLAYING && (
          <div>
            <Dashboard stats={stats} />
            {activeTab === 'market' ? (
              <StockMarket stocks={stocks} portfolio={portfolio} news={marketNews} onBuy={() => {}} onSell={() => {}} balance={stats.balance} onSetTrigger={() => {}} />
            ) : lastConsequence ? (
              <div className="bg-white rounded-[2.5rem] p-16 shadow-2xl text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-8" />
                <h3 className="text-3xl font-black mb-3">{lastConsequence.title}</h3>
                <p className="text-xl text-slate-600 mb-10 italic">"{lastConsequence.text}"</p>
                <button onClick={proceedToNextWeek} className="px-12 py-5 bg-emerald-600 text-white rounded-3xl font-black text-xl">Next Week</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl">
                  <div className="p-10">
                    <h3 className="text-3xl font-black mb-6">{currentScenario?.title}</h3>
                    <p className="text-slate-600 text-xl">{currentScenario?.description}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {currentScenario?.choices.map((choice, i) => (
                    <button key={i} onClick={() => handleChoice(choice)} className="w-full text-left p-6 bg-white border-2 border-slate-100 hover:border-emerald-500 rounded-3xl transition-all">
                      <p className="font-black text-xl mb-2">{choice.text}</p>
                      <span className="text-xs font-black text-slate-400 uppercase">Execute Choice</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
