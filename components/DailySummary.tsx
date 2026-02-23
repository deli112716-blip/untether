
import React, { useState, useEffect } from 'react';
import { X, Flame, Smartphone, Clock, TrendingUp, Sparkles, Loader2, Calendar, Award } from 'lucide-react';
import { UserStats } from '../types';
import { getMindfulInsight } from '../services/gemini';

interface DailySummaryProps {
  stats: UserStats;
  onClose: () => void;
}

export const DailySummary: React.FC<DailySummaryProps> = ({ stats, onClose }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      const res = await getMindfulInsight({ 
        screenTime: stats.screenTime, 
        timeSaved: stats.totalTimeSaved,
        streak: stats.streak
      });
      setInsight(res[0] || "You've taken a significant step toward digital freedom today.");
      setLoading(false);
    };
    fetchInsight();
  }, [stats]);

  const formatTime = (mins: number) => {
    const totalMins = Math.round(mins);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const last7Days = stats.streakHistory.slice(-7);
  const isMilestoneDay = [3, 7, 14, 30, 60, 100].includes(stats.streak);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="max-w-sm w-full opal-card p-8 rounded-[40px] border-white/10 space-y-8 relative overflow-hidden shadow-3xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--accent-purple)] via-[var(--accent-blue)] to-[var(--accent-purple)] shadow-[0_0_20px_var(--accent-glow)]"></div>
        
        {isMilestoneDay && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[40%] bg-[var(--accent-purple)]/10 rotate-[-15deg] blur-[100px]"></div>
          </div>
        )}

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-purple)] shadow-[0_0_25px_var(--accent-glow)]">
               {isMilestoneDay ? <Award size={24} className="animate-bounce" /> : <Calendar size={24} />}
             </div>
             <div>
               <h2 className="text-2xl font-black text-white italic tracking-tighter">
                 {isMilestoneDay ? 'Milestone Sync' : 'Daily Summary'}
               </h2>
               <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.5em]">Protocol Completion</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-zinc-600 hover:text-white transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>

        {isMilestoneDay && (
          <div className="bg-[var(--accent-glow)] border border-[var(--accent-purple)]/30 p-6 rounded-[32px] text-center animate-in zoom-in-95 duration-1000 shadow-lg">
             <div className="text-[var(--accent-purple)] mb-2 font-black text-[10px] uppercase tracking-[0.6em]">Rank Evolution</div>
             <div className="text-3xl font-black text-white italic uppercase tracking-tighter drop-shadow-sm">Ascension {stats.streak}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 relative z-10">
           <div className="opal-card p-6 rounded-[32px] bg-zinc-950/60 border-white/5 space-y-2">
              <Smartphone size={16} className="text-[var(--accent-blue)]" />
              <div className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Digital Strain</div>
              <div className="text-2xl font-black text-white tabular-nums drop-shadow-sm">{formatTime(stats.screenTime)}</div>
           </div>
           <div className="opal-card p-6 rounded-[32px] bg-zinc-950/60 border-white/5 space-y-2">
              <Clock size={16} className="text-[var(--accent-purple)]" />
              <div className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Time Reclaimed</div>
              <div className="text-2xl font-black text-white tabular-nums drop-shadow-sm">{formatTime(stats.totalTimeSaved)}</div>
           </div>
        </div>

        {/* Duolingo-style Streak History */}
        <div className="space-y-6 relative z-10 px-2">
           <div className="flex items-center justify-between">
             <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-600">Streak History</h3>
             <div className="flex items-center gap-2 text-orange-500">
               <Flame size={16} fill="currentColor" className="animate-pulse" />
               <span className="text-[11px] font-black tracking-tighter uppercase">{stats.streak} DAYS</span>
             </div>
           </div>
           <div className="flex justify-between items-center gap-2">
             {last7Days.length > 0 ? last7Days.map((day, i) => (
               <div key={i} className="flex flex-col items-center gap-2 group flex-1">
                 <div 
                   className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300
                     ${day.achieved 
                       ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(194,65,12)]' 
                       : 'bg-zinc-800 text-zinc-500 shadow-[0_4px_0_rgb(39,39,42)]'}`}
                 >
                   {day.achieved ? (
                     <Flame size={20} fill="currentColor" />
                   ) : (
                     <span className="text-sm font-bold">{new Date(day.date).getDate()}</span>
                   )}
                 </div>
                 <div className="text-[10px] font-bold text-zinc-500 uppercase">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }).charAt(0)}</div>
               </div>
             )) : (
               <div className="w-full flex items-center justify-center text-zinc-800 text-[10px] font-black uppercase tracking-[0.8em] animate-pulse">Initializing Sequence</div>
             )}
           </div>
        </div>

        <div className="opal-card p-8 rounded-[40px] bg-gradient-to-br from-[var(--accent-purple)]/10 to-transparent border-white/10 relative group z-10 shadow-inner">
           <div className="absolute top-5 right-5 text-[var(--accent-purple)]/30 group-hover:scale-125 transition-transform duration-700">
             <Sparkles size={20} />
           </div>
           <h4 className="text-[10px] font-black uppercase text-[var(--accent-purple)] tracking-[0.4em] mb-3">Neural Insight</h4>
           {loading ? (
             <div className="flex items-center gap-4 py-4">
               <Loader2 className="animate-spin text-[var(--accent-purple)]" size={20} />
               <span className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.6em]">Parsing Trajectory...</span>
             </div>
           ) : (
             <p className="text-sm font-bold text-zinc-100 leading-relaxed italic drop-shadow-sm">
               "{insight}"
             </p>
           )}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-5 bg-white text-black rounded-[32px] font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-[var(--accent-purple)] hover:shadow-[0_0_30px_var(--accent-glow)] transition-all active:scale-95 z-10 relative shadow-2xl"
        >
          <TrendingUp size={18} />
          {isMilestoneDay ? 'COMMIT TO ASCENSION' : 'CONTINUE SEQUENCE'}
        </button>
      </div>
    </div>
  );
};
