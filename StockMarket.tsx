
import React, { useState } from 'react';
import { Stock, PortfolioItem, MarketNews } from '../types';
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
      {/* Stocks List */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
          Nigeria Stock Exchange (NairaWise)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stocks.map((stock) => {
            const holding = portfolio.find(p => p.stockId === stock.id);
            const priceChange = stock.history.length > 1 
              ? ((stock.price - stock.history[stock.history.length - 2]) / stock.history[stock.history.length - 2] * 100).toFixed(2)
              : "0.00";
            const isPositive = parseFloat(priceChange) >= 0;

            const chartData = stock.history.map((price, index) => ({
              week: `W${index + 1}`,
              price: price
            }));

            return (
              <div key={stock.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{stock.sector}</span>
                    <h4 className="text-lg font-bold text-slate-900">{stock.name}</h4>
                  </div>
                  <div className={`flex items-center gap-1 font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {priceChange}%
                  </div>
                </div>
                
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Current Price</p>
                    <p className="text-2xl font-black text-slate-900">₦{stock.price.toLocaleString()}</p>
                  </div>
                  {holding && (
                    <div className="text-right flex flex-col items-end">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Holdings</p>
                      <p className="text-sm font-bold text-indigo-600">{holding.shares} Shares</p>
                      <button 
                        onClick={() => setSelectedStockId(selectedStockId === stock.id ? null : stock.id)}
                        className={`mt-2 flex items-center gap-1 text-[10px] font-bold p-1 rounded ${selectedStockId === stock.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        <Settings2 className="w-3 h-3" /> Triggers
                      </button>
                    </div>
                  )}
                </div>

                {/* Automation UI Overlay */}
                {holding && selectedStockId === stock.id && (
                  <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                        <Target className="w-3 h-3 text-emerald-600" /> Take Profit (TP)
                      </div>
                      <input 
                        type="number" 
                        placeholder="₦ Price"
                        defaultValue={holding.takeProfit}
                        onChange={(e) => onSetTrigger(stock.id, 'takeProfit', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-24 p-1 text-xs border rounded bg-white font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                        <ShieldCheck className="w-3 h-3 text-rose-600" /> Stop Loss (SL)
                      </div>
                      <input 
                        type="number" 
                        placeholder="₦ Price"
                        defaultValue={holding.stopLoss}
                        onChange={(e) => onSetTrigger(stock.id, 'stopLoss', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-24 p-1 text-xs border rounded bg-white font-bold"
                      />
                    </div>
                  </div>
                )}

                {holding && !selectedStockId && (holding.stopLoss || holding.takeProfit) && (
                   <div className="flex gap-2 mb-4">
                     {holding.takeProfit && (
                       <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                         <Target className="w-2.5 h-2.5" /> TP @ ₦{holding.takeProfit.toLocaleString()}
                       </span>
                     )}
                     {holding.stopLoss && (
                       <span className="text-[9px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                         <ShieldCheck className="w-2.5 h-2.5" /> SL @ ₦{holding.stopLoss.toLocaleString()}
                       </span>
                     )}
                   </div>
                )}

                {/* Price History Chart */}
                <div className="h-32 w-full mb-6 -ml-4">
                  <ResponsiveContainer width="110%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Price']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke={isPositive ? '#10b981' : '#f43f5e'} 
                        strokeWidth={3} 
                        dot={false}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => onBuy(stock.id)}
                    disabled={balance < stock.price}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all text-sm"
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => onSell(stock.id)}
                    disabled={!holding || holding.shares <= 0}
                    className="flex-1 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 rounded-xl font-bold transition-all text-sm"
                  >
                    Sell
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Market News */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2">
          <Newspaper className="w-6 h-6 text-indigo-600" />
          Market News
        </h3>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-h-[500px] overflow-y-auto space-y-4">
          {news.length === 0 && <p className="text-slate-400 italic text-sm text-center py-8">No breaking news yet. Watch the markets.</p>}
          {[...news].reverse().map((item, idx) => (
            <div key={idx} className="border-b border-slate-50 pb-4 last:border-0">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${item.impact === 'positive' ? 'bg-emerald-50 text-emerald-600' : item.impact === 'negative' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                {item.impact}
              </span>
              <p className="mt-2 text-sm font-bold text-slate-900 leading-snug">{item.headline}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockMarket;
