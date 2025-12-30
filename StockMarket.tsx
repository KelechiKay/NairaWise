
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
          NSE Exchange
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stocks.map((stock) => {
            const holding = portfolio.find(p => p.stockId === stock.id);
            const priceChange = stock.history.length > 1 
              ? ((stock.price - stock.history[stock.history.length - 2]) / stock.history[stock.history.length - 2] * 100).toFixed(2)
              : "0.00";
            const isPositive = parseFloat(priceChange) >= 0;

            return (
              <div key={stock.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400">{stock.sector}</span>
                    <h4 className="text-lg font-bold text-slate-900">{stock.name}</h4>
                  </div>
                  <div className={`flex items-center gap-1 font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {priceChange}%
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-2xl font-black text-slate-900">₦{stock.price.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => onBuy(stock.id)} disabled={balance < stock.price} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm">Buy</button>
                  <button onClick={() => onSell(stock.id)} disabled={!holding || holding.shares <= 0} className="flex-1 py-2 border border-rose-200 text-rose-600 rounded-xl font-bold text-sm">Sell</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-2"><Newspaper className="w-6 h-6 text-indigo-600" />News</h3>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-h-[500px] overflow-y-auto">
          {news.map((item, idx) => (
            <div key={idx} className="border-b border-slate-50 pb-4 mb-4 last:border-0">
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">{item.impact}</span>
              <p className="mt-2 text-sm font-bold text-slate-900 leading-snug">{item.headline}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockMarket;
