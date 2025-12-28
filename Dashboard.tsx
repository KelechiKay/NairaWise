
import React from 'react';
import { PlayerStats } from '../types';
import { 
  TrendingUp, 
  Wallet, 
  Heart, 
  CreditCard, 
  Calendar,
  Briefcase
} from 'lucide-react';

interface DashboardProps {
  stats: PlayerStats;
}

const StatCard = ({ icon: Icon, label, value, color, unit = "₦" }: any) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-${color.split('-')[1]}-200/50`}>
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

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
      <StatCard 
        icon={Wallet} 
        label="Liquid Cash" 
        value={stats.balance} 
        color="bg-emerald-500" 
      />
      <StatCard 
        icon={TrendingUp} 
        label="Net Assets" 
        value={stats.savings} 
        color="bg-indigo-500" 
      />
      <StatCard 
        icon={CreditCard} 
        label="Outstanding Debt" 
        value={stats.debt} 
        color="bg-rose-500" 
      />
      <StatCard 
        icon={Heart} 
        label="Happiness" 
        value={stats.happiness} 
        color="bg-pink-500" 
        unit="%"
      />
      <StatCard 
        icon={Calendar} 
        label="Time Elapsed" 
        value={stats.currentWeek} 
        color="bg-amber-500" 
        unit=" Weeks"
      />
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="p-4 rounded-2xl bg-slate-900">
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <div className="overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Role</p>
          <p className="text-sm font-black text-slate-900 truncate uppercase">{stats.job}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
