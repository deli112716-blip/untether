
import React, { useState, useEffect } from 'react';
import { View, UserStats, UserProfile, BlockableApp, Zone } from '../types';
import { Timer, MapPin, Zap, Shield, ToggleRight, ToggleLeft, Activity, BrainCircuit, Smartphone, Clock, LayoutDashboard, ArrowRight, Radio, MessageSquareQuote, PenTool, Target, Link2Off, Flame } from 'lucide-react';
import { DailySummary } from './DailySummary';
import { supabase } from '../services/supabase';

interface DashboardProps {
  setView: (view: View) => void;
  stats: UserStats;
  blockedApps: BlockableApp[];
  activeZones: Zone[];
  toggleApp: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setView, stats, blockedApps, activeZones, toggleApp }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showManualSummary, setShowManualSummary] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data) setProfile(data);
        }
      } catch (error) {
        console.error("Dashboard profile fetch failed:", error);
      }
    };
    fetchProfile();
  }, []);

  const [liveStatus, setLiveStatus] = useState({ geo: false, notify: false });

  useEffect(() => {
    const checkLive = async () => {
      if ('permissions' in navigator) {
        const geo = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        const notify = await navigator.permissions.query({ name: 'notifications' as PermissionName });
        setLiveStatus({ geo: geo.state === 'granted', notify: notify.state === 'granted' });
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (mins: number) => {
    const totalMins = Math.round(mins);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const timeSavedToday = stats.streakHistory.find(d => d.date === getLocalDateString())?.timeSaved || 0;
  const recentJournal = (stats.journal || []).slice(0, 2);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 px-2 pb-10">
      {showManualSummary && <DailySummary stats={stats} onClose={() => setShowManualSummary(false)} />}
      
      {/* Neural Link Status - Centered Top */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <div className="flex items-center gap-6 px-6 py-2.5 bg-black/60 border border-white/5 rounded-full backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${liveStatus.geo && liveStatus.notify ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'} animate-pulse`}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Neural Link: {liveStatus.geo && liveStatus.notify ? 'Established' : 'Fragmented'}</span>
          </div>
          <div className="flex gap-2">
            <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${liveStatus.geo ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 'text-zinc-800 bg-zinc-900/50 border border-white/5'}`}>GPS</div>
            <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${liveStatus.notify ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 'text-zinc-800 bg-zinc-900/50 border border-white/5'}`}>Alerts</div>
          </div>
        </div>

        {activeZones.length > 0 && (
          <button 
            onClick={() => setView('geo')}
            className="w-full max-w-xs p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between group animate-in slide-in-from-top-4 duration-500"
          >
            <div className="flex items-center gap-3">
              <MapPin className="text-rose-500" size={18} />
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Active Zone: {activeZones[0].name}</span>
            </div>
            <ArrowRight className="text-rose-500 group-hover:translate-x-1 transition-transform" size={16} />
          </button>
        )}
      </div>

      {/* Welcome Message */}
      <div className="text-center space-y-3 py-2">
        <h2 className="text-3xl font-black text-white italic tracking-tight">
          Welcome, {profile?.full_name?.split(' ')[0] || 'User'}
        </h2>
        <div className="w-40 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto"></div>
      </div>

      {/* Branding & Streak Row */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center transition-all group-hover:scale-105">
            <Link2Off size={22} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white">
            UnTether
          </h1>
        </div>
        
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#d8b4fe]/20 border border-[#d8b4fe]/30 rounded-full shadow-[0_0_20px_rgba(216,180,254,0.15)]">
          <Flame size={14} className="text-[#d8b4fe]" fill="currentColor" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">{stats.streak} DAY STREAK</span>
        </div>
      </div>

      {/* Hero Metric */}
      <section className="text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#d8b4fe] opacity-[0.02] blur-[120px] rounded-full -z-10"></div>
        
        <div className="space-y-4">
           <h2 className="text-[110px] font-black text-white tracking-tighter tabular-nums leading-none drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">
             {formatTime(stats.totalTimeSaved)}
           </h2>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
         <div className="p-7 opal-card rounded-[44px] text-left space-y-2 relative overflow-hidden group">
            <div className="flex items-center gap-3 text-zinc-500 group-hover:text-[#93c5fd] transition-colors">
              <Smartphone size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Usage</span>
            </div>
            <div className="text-3xl font-black text-white tabular-nums">{formatTime(stats.screenTime || 0)}</div>
         </div>
         <div className="p-7 opal-card rounded-[44px] text-left space-y-2 group">
            <div className="flex items-center gap-3 text-zinc-500 group-hover:text-emerald-400 transition-colors">
              <Activity size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Saved Today</span>
            </div>
            <div className="text-3xl font-black text-white tabular-nums">{formatTime(timeSavedToday)}</div>
         </div>
      </div>

      {/* Fast Actions */}
      <div className="flex gap-4">
        <button 
          onClick={() => setView('assessment')}
          className="flex-1 opal-card p-6 rounded-[36px] border-white/5 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-white/5 text-white flex items-center justify-center transition-all group-hover:bg-[var(--accent-purple)] group-hover:text-black">
               <BrainCircuit size={20} />
             </div>
             <div className="text-left">
                <p className="text-[8px] font-black uppercase text-[var(--accent-purple)] tracking-widest">Diagnostic</p>
                <h4 className="text-white font-black italic text-xs">Profile</h4>
             </div>
          </div>
        </button>
        <button 
          onClick={() => setShowManualSummary(true)}
          className="flex-1 opal-card p-6 rounded-[36px] border-white/5 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-white/5 text-white flex items-center justify-center transition-all group-hover:bg-[var(--accent-blue)] group-hover:text-black">
               <LayoutDashboard size={20} />
             </div>
             <div className="text-left">
                <p className="text-[8px] font-black uppercase text-[var(--accent-blue)] tracking-widest">Summary</p>
                <h4 className="text-white font-black italic text-xs">Recap</h4>
             </div>
          </div>
        </button>
      </div>

      {/* Suppression Matrix */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700">Suppression Matrix</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-2 px-2 no-scrollbar">
          {blockedApps.map(app => (
            <button 
              key={app.id} 
              onClick={() => toggleApp(app.id)}
              className={`flex-shrink-0 w-36 p-7 opal-card rounded-[40px] border-white/5 flex flex-col items-center gap-5 transition-all active:scale-90 ${app.blocked ? 'bg-white/5 border-[var(--accent-blue)]/30 shadow-[0_0_20px_var(--accent-glow-blue)]' : ''}`}
            >
              <div className="w-12 h-12 rounded-[20px] bg-black border border-white/5 flex items-center justify-center">
                 <div className={`w-3 h-3 rounded-full ${app.blocked ? 'animate-pulse' : ''}`} style={{ backgroundColor: app.iconColor, boxShadow: app.blocked ? `0 0 12px ${app.iconColor}` : 'none' }}></div>
              </div>
              <div className="text-center">
                 <div className={`text-[11px] font-black uppercase tracking-widest mb-1 ${app.blocked ? 'text-white' : 'text-zinc-600'}`}>{app.name}</div>
                 <div className={`text-[8px] font-black uppercase tracking-tighter ${app.blocked ? 'text-[var(--accent-blue)]' : 'text-zinc-800'}`}>
                   {app.blocked ? 'LOCKED' : 'BYPASS'}
                 </div>
              </div>
              {app.blocked ? <ToggleRight className="text-[var(--accent-blue)]" size={22} /> : <ToggleLeft className="text-zinc-900" size={22} />}
            </button>
          ))}
        </div>
      </section>

      {/* Core Protocol Entry */}
      <div className="grid grid-cols-1 gap-6">
        <button 
          onClick={() => setView('focus')}
          className="opal-card p-10 rounded-[56px] text-left active:scale-95 group transition-all flex items-center justify-between bg-gradient-to-r from-zinc-900/50 to-transparent"
        >
          <div className="flex items-center gap-8">
            <div className="text-[var(--accent-purple)] bg-white/5 w-20 h-20 rounded-[32px] flex items-center justify-center transition-all group-hover:bg-[var(--accent-purple)] group-hover:text-black shadow-sm group-hover:shadow-[0_0_30px_var(--accent-glow)]">
              <Timer size={40} strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-black text-3xl uppercase tracking-tighter text-white leading-none italic">Start Focus</div>
              <div className="text-[10px] text-zinc-600 font-black uppercase mt-3 tracking-[0.3em]">Initialize Silence Protocol</div>
            </div>
          </div>
          <ArrowRight className="text-zinc-800 group-hover:text-white transition-all group-hover:translate-x-2" size={32} />
        </button>
      </div>

      {/* Recent Realizations */}
      {recentJournal.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700">Recent Realizations</h3>
            <button onClick={() => setView('journal')} className="text-[9px] font-black uppercase text-[var(--accent-purple)] tracking-widest hover:opacity-70 transition-opacity">View Log</button>
          </div>
          <div className="space-y-4">
            {recentJournal.map(entry => (
              <div key={entry.id} className="opal-card p-6 rounded-[36px] border-white/5 space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 text-white/5 group-hover:text-[var(--accent-purple)]/10 transition-colors">
                  <MessageSquareQuote size={40} />
                </div>
                <div className="flex items-center justify-between text-[8px] font-black uppercase text-zinc-600 tracking-widest">
                  <div className="flex items-center gap-2">
                    <PenTool size={10} /> {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  {entry.reason && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#d8b4fe]/10 text-[#d8b4fe] rounded-md border border-[#d8b4fe]/10">
                      <Target size={8} /> {entry.reason}
                    </div>
                  )}
                </div>
                <p className="text-white text-sm font-bold italic leading-relaxed line-clamp-2">
                  "{entry.answer}"
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
