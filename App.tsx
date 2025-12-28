
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
import { getNextScenario, getEndGameAnalysis } from './services/geminiService';
import Dashboard from './components/Dashboard';
import StockMarket from './components/StockMarket';
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
  const [notifications, setNotifications] = useState<string[]>([]);

  // Stock Market State
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [marketNews, setMarketNews] = useState<MarketNews[]>([]);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('nairawise_session');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.status === GameStatus.PLAYING) {
          setStats(data.stats);
          setHistory(data.history);
          setStocks(data.stocks || INITIAL_STOCKS);
          setPortfolio(data.portfolio || []);
          setMarketNews(data.marketNews || []);
          setCurrentScenario(data.currentScenario);
          setStatus(GameStatus.PLAYING);
          prefetchScenario(data.stats, data.history);
        }
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, []);

  // Persist session
  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      localStorage.setItem('nairawise_session', JSON.stringify({
        status, stats, history, stocks, portfolio, marketNews, currentScenario
      }));
    } else if (status === GameStatus.START) {
      localStorage.removeItem('nairawise_session');
    }
  }, [status, stats, history, stocks, portfolio, marketNews, currentScenario]);

  const prefetchScenario = async (currentStats: PlayerStats, gameHistory: GameLog[]) => {
    setLoadingNext(true);
    try {
      const scenario = await getNextScenario(currentStats, gameHistory);
      setNextScenario(scenario);
    } catch (error) {
      console.error("Prefetch failed", error);
    } finally {
      setLoadingNext(false);
    }
  };

  const updateMarketPrices = (event?: MarketNews) => {
    let updatedStocks: Stock[] = [];
    setStocks(prev => {
      updatedStocks = prev.map(stock => {
        let changePercent = (Math.random() * 10 - 5) / 100;
        
        if (event && event.stockId === stock.id) {
          if (event.impact === 'positive') changePercent += 0.10;
          if (event.impact === 'negative') changePercent -= 0.10;
        }

        const newPrice = Math.max(100, Math.round(stock.price * (1 + changePercent)));
        return {
          ...stock,
          price: newPrice,
          history: [...stock.history, newPrice].slice(-10)
        };
      });
      return updatedStocks;
    });

    if (event) {
      setMarketNews(prev => [...prev, event].slice(-20));
    }

    setPortfolio(prevPortfolio => {
      const newPortfolio = [...prevPortfolio];
      let newBalance = stats.balance;
      const triggeredMsgs: string[] = [];

      for (let i = 0; i < newPortfolio.length; i++) {
        const item = newPortfolio[i];
        const stock = updatedStocks.find(s => s.id === item.stockId);
        if (!stock) continue;

        let triggered = false;
        if (item.takeProfit && stock.price >= item.takeProfit) {
          triggered = true;
          triggeredMsgs.push(`Auto-Sold ${item.shares} of ${stock.name} @ ₦${stock.price.toLocaleString()} (Take Profit)`);
        } else if (item.stopLoss && stock.price <= item.stopLoss) {
          triggered = true;
          triggeredMsgs.push(`Auto-Sold ${item.shares} of ${stock.name} @ ₦${stock.price.toLocaleString()} (Stop Loss)`);
        }

        if (triggered) {
          newBalance += stock.price * item.shares;
          newPortfolio.splice(i, 1);
          i--;
        }
      }

      if (triggeredMsgs.length > 0) {
        setStats(s => ({ ...s, balance: newBalance }));
        setNotifications(prev => [...prev, ...triggeredMsgs]);
      }
      return newPortfolio;
    });
  };

  const startGame = async () => {
    setStatus(GameStatus.LOADING);
    setStats(INITIAL_STATS);
    setHistory([]);
    setLastConsequence(null);
    setStocks(INITIAL_STOCKS);
    setPortfolio([]);
    setMarketNews([]);
    setNotifications([]);
    setActiveTab('scenario');

    try {
      const scenario = await getNextScenario(INITIAL_STATS, []);
      setCurrentScenario(scenario);
      setStatus(GameStatus.PLAYING);
      prefetchScenario(INITIAL_STATS, []);
    } catch (e) {
      setStatus(GameStatus.START);
    }
  };

  const proceedToNextWeek = () => {
    setNotifications([]);
    if (nextScenario) {
      const current = nextScenario;
      setCurrentScenario(current);
      setLastConsequence(null);
      setNextScenario(null);
      setActiveTab('scenario');
      updateMarketPrices(current.marketEvent);
      prefetchScenario(stats, history);
    } else {
      setStatus(GameStatus.LOADING);
      const checkAndProceed = setInterval(() => {
        // Explicitly check for nextScenario within the closure
        setNextScenario(prev => {
           if (prev) {
             setCurrentScenario(prev);
             setLastConsequence(null);
             setStatus(GameStatus.PLAYING);
             setActiveTab('scenario');
             updateMarketPrices(prev.marketEvent);
             prefetchScenario(stats, history);
             clearInterval(checkAndProceed);
             return null;
           }
           return prev;
        });
      }, 500);
    }
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

    const newLog: GameLog = {
      week: stats.currentWeek,
      title: currentScenario.title,
      decision: choice.text,
      consequence: choice.consequence
    };

    setHistory([...history, newLog]);
    setStats(newStats);
    setLastConsequence({ text: choice.consequence, title: currentScenario.title });

    if (newStats.balance <= 0 && newStats.savings <= 0 && newStats.debt > 300000) {
        endGame(newStats, [...history, newLog], "Sapa has finally won. The debt trap closed.");
    } else if (newStats.happiness <= 0) {
        endGame(newStats, [...history, newLog], "Exhaustion and stress have taken their toll.");
    } else if (newStats.currentWeek > 12) {
        endGame(newStats, [...history, newLog], "Quarterly goal achieved! You managed the storm.");
    }
  };

  const buyStock = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock || stats.balance < stock.price) return;

    setStats(prev => ({ ...prev, balance: prev.balance - stock.price }));
    setPortfolio(prev => {
      const existing = prev.find(p => p.stockId === stockId);
      if (existing) {
        return prev.map(p => p.stockId === stockId ? {
          ...p,
          shares: p.shares + 1,
          averagePrice: (p.averagePrice * p.shares + stock.price) / (p.shares + 1)
        } : p);
      }
      return [...prev, { stockId, shares: 1, averagePrice: stock.price }];
    });
  };

  const sellStock = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    const holding = portfolio.find(p => p.stockId === stockId);
    if (!stock || !holding || holding.shares <= 0) return;

    setStats(prev => ({ ...prev, balance: prev.balance + stock.price }));
    setPortfolio(prev => prev.map(p => p.stockId === stockId ? { ...p, shares: p.shares - 1 } : p).filter(p => p.shares > 0));
  };

  const setTrigger = (stockId: string, type: 'stopLoss' | 'takeProfit', value: number | undefined) => {
    setPortfolio(prev => prev.map(p => p.stockId === stockId ? { ...p, [type]: value } : p));
  };

  const endGame = async (finalStats: PlayerStats, finalHistory: GameLog[], message: string) => {
    setStatus(GameStatus.LOADING);
    localStorage.removeItem('nairawise_session');
    const analysis = await getEndGameAnalysis(finalStats, finalHistory);
    setEndGameText(`${message}\n\n${analysis}`);
    setStatus(GameStatus.GAMEOVER);
  };

  const portfolioValue = portfolio.reduce((total, p) => {
    const stock = stocks.find(s => s.id === p.stockId);
    return total + (stock ? stock.price * p.shares : 0);
  }, 0);

  const totalWealth = stats.balance + stats.savings + portfolioValue;

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-6 md:py-10">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-3 rounded-2xl shadow-xl shadow-emerald-200/50">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">NairaWise</h1>
            <p className="text-sm font-bold text-emerald-600 mt-1 uppercase tracking-widest">Growth Engine</p>
          </div>
        </div>
        
        {status === GameStatus.PLAYING && !lastConsequence && (
          <div className="flex flex-wrap justify-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-slate-200 backdrop-blur-sm">
            <button 
              onClick={() => setActiveTab('scenario')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'scenario' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
            >
              <Layout className="w-4 h-4" />
              Life
            </button>
            <button 
              onClick={() => setActiveTab('market')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'market' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
            >
              <TrendingUp className="w-4 h-4" />
              Exchange
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'history' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
            >
              <History className="w-4 h-4" />
              Journal
            </button>
          </div>
        )}

        {status === GameStatus.PLAYING && (
          <button 
            onClick={() => setStatus(GameStatus.START)}
            className="hidden md:flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors text-xs font-bold uppercase"
          >
            <LogOut className="w-4 h-4" />
            Quit
          </button>
        )}
      </header>

      <main className="pb-12">
        {status === GameStatus.START && (
          <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-700">
            <div className="max-w-2xl mx-auto">
              <div className="relative inline-block mb-10 group">
                <img 
                  src="https://picsum.photos/seed/naira-biz-master/1200/600" 
                  alt="NairaWise Banner" 
                  className="rounded-3xl w-full h-64 object-cover shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-emerald-600/10 rounded-3xl group-hover:bg-transparent transition-all"></div>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">Can you thrive <br/><span className="text-emerald-600 underline decoration-emerald-200 underline-offset-8">in the Naira economy?</span></h2>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                Welcome to the ultimate survival game. Budget your income, hedge against inflation, 
                and master the stock market. Nigeria is waiting.
              </p>
              <button 
                onClick={startGame}
                className="group relative inline-flex items-center justify-center gap-4 px-12 py-6 bg-slate-900 hover:bg-emerald-600 text-white rounded-3xl font-black text-2xl transition-all shadow-2xl hover:shadow-emerald-200 active:scale-95"
              >
                Enter the Market
                <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {status === GameStatus.LOADING && (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-pulse">
            <div className="relative">
                <Loader2 className="w-20 h-20 text-emerald-600 animate-spin mb-6" />
                <Coins className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Syncing Market Data...</h3>
            <p className="text-slate-400 font-bold uppercase text-xs mt-3 tracking-widest">Connecting to Lagos servers</p>
          </div>
        )}

        {status === GameStatus.PLAYING && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Dashboard stats={{ ...stats, savings: stats.savings + portfolioValue }} />
            
            {activeTab === 'history' ? (
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                        <History className="w-7 h-7 text-emerald-600" />
                        Historical Journal
                    </h3>
                    <div className="px-4 py-1.5 bg-slate-50 rounded-full text-xs font-black text-slate-400 uppercase">
                        {history.length} Decisions Logged
                    </div>
                </div>
                <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-4">
                  {[...history].reverse().map((log, idx) => (
                    <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 border-l-[6px] border-l-emerald-500 hover:bg-white hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest">Week {log.week}</span>
                        <h4 className="text-lg font-black text-slate-900">{log.title}</h4>
                      </div>
                      <p className="text-sm text-slate-500 font-bold mb-3 italic">You decided: "{log.decision}"</p>
                      <p className="text-base text-slate-700 leading-relaxed font-medium">{log.consequence}</p>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">Your journey hasn't begun yet.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'market' ? (
              <StockMarket 
                stocks={stocks} 
                portfolio={portfolio} 
                news={marketNews} 
                onBuy={buyStock} 
                onSell={sellStock} 
                balance={stats.balance}
                onSetTrigger={setTrigger}
              />
            ) : lastConsequence ? (
              <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-500">
                <div className="flex justify-center mb-8">
                  <div className="bg-emerald-100 p-6 rounded-[2rem] shadow-xl shadow-emerald-50">
                    <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">{lastConsequence.title}</h3>
                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto font-medium italic leading-relaxed">
                  "{lastConsequence.text}"
                </p>

                {notifications.length > 0 && (
                  <div className="max-w-lg mx-auto mb-10 space-y-3">
                    <div className="flex items-center justify-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-4">
                      <Bell className="w-4 h-4" /> NSE Automated Notifications
                    </div>
                    {notifications.map((n, i) => (
                      <div key={i} className="bg-indigo-50/50 text-indigo-700 text-sm font-bold p-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 flex-shrink-0" />
                        {n}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col items-center">
                  <button
                    onClick={proceedToNextWeek}
                    disabled={loadingNext && !nextScenario}
                    className="flex items-center gap-4 px-12 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-xl transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                  >
                    {loadingNext && !nextScenario ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Start Week {stats.currentWeek}
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 flex flex-col">
                  <div className="relative h-64">
                    <img 
                      src={`https://picsum.photos/seed/${currentScenario?.imageTheme || 'nigeria-finance'}/1200/800`} 
                      alt="Context"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-8 flex items-center gap-3">
                        <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg">Week {stats.currentWeek} Situation</span>
                        {currentScenario?.marketEvent && (
                            <span className="px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg animate-pulse">Market Event</span>
                        )}
                    </div>
                  </div>
                  <div className="p-10 pt-4 flex-grow">
                    <h3 className="text-3xl font-black text-slate-900 mb-6 leading-tight tracking-tight">{currentScenario?.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-xl font-medium">
                      {currentScenario?.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-2">Execute Strategy</h4>
                  {currentScenario?.choices.map((choice, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChoice(choice)}
                      className="group w-full text-left p-6 bg-white border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-xl hover:shadow-emerald-100/30 rounded-3xl transition-all relative overflow-hidden active:scale-[0.98]"
                    >
                      <div className="relative z-10">
                        <p className="font-black text-slate-900 text-xl mb-3 group-hover:text-emerald-700 transition-colors">{choice.text}</p>
                        <div className="flex flex-wrap gap-3">
                          {choice.impact.balance !== 0 && (
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${choice.impact.balance > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {choice.impact.balance > 0 ? '+' : ''}₦{Math.abs(choice.impact.balance).toLocaleString()}
                            </span>
                          )}
                          {choice.impact.happiness !== 0 && (
                            <span className={`text-[10px] font-black px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full uppercase tracking-widest shadow-sm`}>
                              {choice.impact.happiness > 0 ? '+' : ''}{choice.impact.happiness}% Happy
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2">
                        <ArrowRight className="w-8 h-8 text-emerald-600" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {status === GameStatus.GAMEOVER && (
          <div className="bg-white rounded-[3rem] p-12 md:p-20 shadow-2xl border border-slate-100 text-center max-w-5xl mx-auto animate-in zoom-in duration-700">
            <div className={`w-28 h-28 mx-auto rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl ${totalWealth > 250000 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {totalWealth > 250000 ? <Trophy className="w-14 h-14" /> : <ShieldAlert className="w-14 h-14" />}
            </div>
            
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Financial Performance Review</h2>
            <div className="mb-14">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Closing Net Worth</p>
              <p className="text-7xl font-black text-emerald-600 drop-shadow-sm">₦{totalWealth.toLocaleString()}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {[
                { label: 'Final Cash', value: `₦${stats.balance.toLocaleString()}`, icon: Wallet, color: 'emerald' },
                { label: 'Total Assets', value: `₦${(stats.savings + portfolioValue).toLocaleString()}`, icon: Briefcase, color: 'indigo' },
                { label: 'Endurance', value: `${stats.currentWeek} Weeks`, icon: Calendar, color: 'amber' },
                { label: 'Vibe Check', value: `${stats.happiness}%`, icon: Heart, color: 'rose' }
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner flex flex-col items-center hover:scale-105 transition-transform">
                  <div className={`p-4 bg-white rounded-2xl mb-4 shadow-sm text-${item.color}-600`}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">{item.label}</p>
                  <p className="text-2xl font-black text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="text-left bg-slate-900 p-12 rounded-[2.5rem] mb-16 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                 <Trophy className="w-40 h-40 text-white" />
               </div>
               <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em] mb-6">Expert Portfolio Analysis</h3>
               <p className="font-sans text-slate-100 leading-relaxed text-2xl font-medium italic whitespace-pre-wrap relative z-10">
                 {endGameText}
               </p>
            </div>

            <button 
              onClick={startGame}
              className="group inline-flex items-center justify-center gap-4 px-16 py-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black text-2xl transition-all shadow-2xl hover:-translate-y-1 active:scale-95"
            >
              <RefreshCw className="w-8 h-8 group-hover:rotate-180 transition-transform duration-700" />
              Re-Enter the Economy
            </button>
          </div>
        )}
      </main>

      <footer className="mt-20 pt-10 border-t border-slate-200 text-center text-slate-400">
        <div className="flex justify-center gap-6 mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Built for Chrome</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Optimized for Naira</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Powered Strategy</span>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 italic">
          © {new Date().getFullYear()} NairaWise: Financial Freedom through Strategy. 
        </p>
      </footer>
    </div>
  );
};

export default App;
