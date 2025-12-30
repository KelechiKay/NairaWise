
import React, { useState } from 'react';
import { Stock, PortfolioItem, MarketNews } from './types';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Newspaper, Settings2, Target, ShieldCheck } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from 'recharts';

interface StockMarketProps {
  stocks: Stock[];
  portfolio: PortfolioItem[];
  news: MarketNews[];
  onBuy: (stockId: string) => void;
  onSell: (stockId: string) => void;
  balance: number;
  onSetTrigger: (stockId: string, type: 'stopLoss' | 'takeProfit', value: number | undefined) => void;
}

const StockMarket: React.FC<StockMarketProps> = ({ stocks, portfolio, news, onBuy, onSell, balance, onSetTrigger }) => {
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
          NSE Exchange (Beta)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stocks.map((stock) => {
            const holding = portfolio.find(p => p.stockId === stock.id);
            const priceChange = stock.history.length > 1 
              ? ((stock.price - stock.history[stock.history.length - 2]) / stock.history[stock.history.length - 2] * 100).toFixed(2)
              : "0.00";
            const isPositive = parseFloat(priceChange) >= 0;

            const chartData = stock.history.map((price, index) => ({ week: index, price }));

            return (
              <div key={stock.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{stock.sector}</span>
                    <h4 className="text-lg font-bold text-slate-900">{stock.name}</h4>
                  </div>
                  <div className={`flex items-center gap-1 font-black text-xs ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {priceChange}%
                  </div>
                </div>

                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-2xl font-black text-slate-900">₦{stock.price.toLocaleString()}</p>
                  </div>
                  {holding && (
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Holdings: {holding.shares}</p>
                      <button 
                        onClick={() => setSelectedStockId(selectedStockId === stock.id ? null : stock.id)}
                        className={`mt-1 p-1 rounded-lg transition-colors ${selectedStockId === stock.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Automation Triggers */}
                {holding && selectedStockId === stock.id && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Target className="w-3 h-3" /> TP Price</span>
                      <input 
                        type="number" 
                        value={holding.takeProfit || ''}
                        onChange={(e) => onSetTrigger(stock.id, 'takeProfit', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g. 5000"
                        className="w-20 p-1 text-xs border rounded-lg"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> SL Price</span>
                      <input 
                        type="number" 
                        value={holding.stopLoss || ''}
                        onChange={(e) => onSetTrigger(stock.id, 'stopLoss', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g. 2000"
                        className="w-20 p-1 text-xs border rounded-lg"
                      />
                    </div>
                  </div>
                )}

                <div className="h-24 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line type="monotone" dataKey="price" stroke={isPositive ? '#10b981' : '#f43f5e'} strokeWidth={3} dot={false} />
                      <YAxis hide domain={['auto', 'auto']} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => onBuy(stock.id)} 
                    disabled={balance < stock.price} 
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => onSell(stock.id)} 
                    disabled={!holding || holding.shares <= 0} 
                    className="flex-1 py-3 border border-rose-200 text-rose-600 rounded-2xl font-black text-sm transition-all hover:bg-rose-50 disabled:opacity-50"
                  >
                    Sell
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2"><Newspaper className="w-6 h-6 text-indigo-600" />Market Wire</h3>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 h-[600px] overflow-y-auto space-y-4">
          {news.length === 0 && <p className="text-slate-400 italic text-center py-10">No breaking news. Trade carefully.</p>}
          {[...news].reverse().map((item, idx) => (
            <div key={idx} className="pb-4 border-b border-slate-50 last:border-0">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${item.impact === 'positive' ? 'bg-emerald-100 text-emerald-700' : item.impact === 'negative' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                {item.impact}
              </span>
              <p className="mt-2 text-sm font-bold text-slate-900 leading-tight">{item.headline}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockMarket;
