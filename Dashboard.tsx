
import React from 'react';
import { PlayerStats, Goal } from './types';
import { 
  TrendingUp, 
  Wallet, 
  Heart, 
  CreditCard, 
  Calendar,
  Briefcase,
  Target,
  Trophy,
  MapPin,
  AlertCircle
} from 'lucide-react';

interface DashboardProps {
  stats: PlayerStats;
  goals: Goal[];
  netAssets: number;
}

const StatCard = ({ icon: Icon, label, value, color, unit = "₦" }: any) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
    <div className={`p-4 rounded-2xl ${color}`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <div className="overflow-hidden">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900 truncate">
        {unit === "₦" ? `₦${value.toLocaleString()}` : `${value}${unit}`}
      </p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, goals, netAssets }) => (
  <div className="space-y-6 mb-10">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard icon={Wallet} label="Liquid Cash" value={stats.balance} color="bg-emerald-500" />
      <StatCard icon={TrendingUp} label="Net Assets" value={netAssets} color="bg-indigo-500" />
      <StatCard icon={CreditCard} label="Debt" value={stats.debt} color="bg-rose-500" />
      <StatCard icon={Heart} label="Happiness" value={stats.happiness} color="bg-pink-500" unit="%" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="p-4 rounded-2xl bg-slate-900"><Briefcase className="w-7 h-7 text-white" /></div>
        <div className="overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stats.name}</p>
          <p className="text-sm font-black text-slate-900 truncate uppercase">{stats.job}</p>
        </div>
      </div>
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="p-4 rounded-2xl bg-amber-500"><MapPin className="w-7 h-7 text-white" /></div>
        <div className="overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
          <p className="text-sm font-black text-slate-900 truncate uppercase">{stats.city}</p>
        </div>
      </div>
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="p-4 rounded-2xl bg-slate-400"><AlertCircle className="w-7 h-7 text-white" /></div>
        <div className="overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Challenge</p>
          <p className="text-xs font-black text-slate-600 truncate uppercase">{stats.challenge}</p>
        </div>
      </div>
    </div>

    {/* Goals Tracking */}
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" /> Your Big Dream
        </h3>
      </div>
      <div className="space-y-6">
        {goals.map(goal => {
          const progress = Math.min(100, Math.max(0, (netAssets / goal.target) * 100));
          return (
            <div key={goal.id} className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-base font-black text-slate-900">{goal.title}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Required Capital: ₦{goal.target.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-indigo-600">{Math.floor(progress)}%</p>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className={`h-full transition-all duration-1000 rounded-full ${goal.completed ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {goal.completed && (
                <div className="flex items-center gap-2 text-emerald-600 animate-pulse">
                  <Trophy className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase">Dream Achieved! Wise Oga Status unlocked.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default Dashboard;
