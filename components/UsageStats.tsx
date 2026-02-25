
import React, { useState, useEffect, useMemo } from 'react';
import { UserStats, StreakDay } from '../types';
import { getMindfulInsight } from '../services/gemini';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Activity, Sparkles, Loader2, BrainCircuit, Trophy, Zap,
  ShieldCheck, Crown, Smartphone, Clock,
  Flame, Target, ChevronRight, ChevronLeft, CheckCircle2,
  Medal, ZapOff, Brain, Sparkle, Waves, Info, TrendingUp,
  BarChart3, Award, Zap as ZapIcon, Shield as ShieldIcon,
  CheckCircle2 as CheckIcon, X
} from 'lucide-react';

interface UsageStatsProps {
  stats: UserStats;
  onUpdateStats: (updates: Partial<UserStats>) => void;
}

export const UsageStats: React.FC<UsageStatsProps> = ({ stats, onUpdateStats }) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<StreakDay | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchInsights = async () => {
      // Check if we already have insights saved for today
      const todayStr = new Date().toISOString().split('T')[0];
      if (stats.lastSummaryDate === todayStr && stats.dailyInsights && stats.dailyInsights.length > 0) {
        setInsights(stats.dailyInsights);
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await getMindfulInsight(stats.streakHistory);
      setInsights(res);
      setLoading(false);

      // Save insights to global stats so they persist
      onUpdateStats({
        dailyInsights: res,
        lastSummaryDate: todayStr
      });
    };
    fetchInsights();
  }, [stats.streakHistory, stats.lastSummaryDate, stats.dailyInsights, onUpdateStats]);

  const formatTime = (mins: number) => {
    const totalMins = Math.round(mins);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const chartData = useMemo(() => {
    const history = stats.streakHistory || [];
    if (history.length === 0) {
      // Aesthetic placeholder baseline for brand new accounts
      return [
        { name: 'Mon', value: 15 },
        { name: 'Tue', value: 45 },
        { name: 'Wed', value: 25 },
        { name: 'Thu', value: 80 },
        { name: 'Fri', value: 50 },
        { name: 'Sat', value: 120 },
        { name: 'Sun', value: 90 },
      ];
    }

    const last7 = history.slice(-7);
    const result = [];
    const needed = 7 - last7.length;

    // Pad the start with zero if less than 7 days of history
    for (let i = needed; i > 0; i--) {
      const d = new Date(last7[0]?.date || new Date().toISOString());
      d.setDate(d.getDate() - i);
      result.push({
        name: d.toLocaleDateString(undefined, { weekday: 'short' }),
        value: 0,
        fullDate: d.toISOString().split('T')[0]
      });
    }

    const realData = last7.map(day => ({
      name: new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }),
      value: day.timeSaved,
      fullDate: day.date
    }));

    return [...result, ...realData];
  }, [stats.streakHistory]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const historyEntry = stats.streakHistory.find(d => d.date === dateStr);
      days.push(historyEntry || { date: dateStr, achieved: false, timeSaved: 0 });
    }
    return days;
  }, [currentMonth, stats.streakHistory]);

  const milestones = useMemo(() => [
    { name: 'Initiate', target: 3, icon: <ZapIcon size={14} />, rank: 'Bronze', color: '#fb923c', desc: 'Break the cycle' },
    { name: 'Adept', target: 7, icon: <Activity size={14} />, rank: 'Silver', color: '#94a3b8', desc: 'Establish presence' },
    { name: 'Master', target: 14, icon: <ShieldIcon size={14} />, rank: 'Gold', color: '#fbbf24', desc: 'Lens control' },
    { name: 'Ascendant', target: 30, icon: <Crown size={14} />, rank: 'Platinum', color: '#e5e7eb', desc: 'Digital freedom' },
  ], []);

  const currentMilestoneIdx = milestones.findIndex(m => stats.streak < m.target);
  const activeMilestone = currentMilestoneIdx === -1 ? milestones[milestones.length - 1] : milestones[currentMilestoneIdx];
  const prevMilestoneTarget = currentMilestoneIdx <= 0 ? 0 : milestones[currentMilestoneIdx - 1].target;

  const progressToNext = useMemo(() => {
    if (currentMilestoneIdx === -1) return 100;
    const range = activeMilestone.target - prevMilestoneTarget;
    const current = stats.streak - prevMilestoneTarget;
    return Math.min(100, (current / range) * 100);
  }, [stats.streak, activeMilestone, prevMilestoneTarget, currentMilestoneIdx]);

  const statsBreakdown = useMemo(() => {
    const totalWins = stats.streakHistory.filter(d => d.achieved).length;
    const consistency = stats.streakHistory.length > 0 ? (totalWins / stats.streakHistory.length) * 100 : 0;
    return { totalWins, consistency };
  }, [stats.streakHistory]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(newDate);
  };

  const FocusWave = ({ intensity, color }: { intensity: number, color: string }) => {
    return (
      <div className="flex items-end gap-1.5 h-16 px-2 w-full">
        {Array.from({ length: 15 }).map((_, i) => {
          const height = 15 + Math.random() * 85 * (intensity / 180);
          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-[2000ms] animate-pulse"
              style={{
                height: `${height}%`,
                backgroundColor: color,
                opacity: 0.1 + (Math.random() * 0.4),
                boxShadow: `0 0 10px ${color}20`,
                animationDelay: `${i * 150}ms`
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 px-2 pb-32 max-w-lg mx-auto">
      {/* Profile Header */}
      <div className="relative p-8 border border-[#93c5fd]/30 rounded-[32px] bg-black/40 backdrop-blur-xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-[#93c5fd]/5 to-transparent pointer-events-none"></div>

        <div className="text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[#d8b4fe] text-[9px] font-black uppercase tracking-[0.4em] shadow-[0_0_30px_rgba(216,180,254,0.15)]">
            <Activity size={14} strokeWidth={2.5} className="animate-pulse" /> ANALYTICS PROTOCOL
          </div>

          <h2 className="text-[64px] sm:text-[80px] font-black tracking-tighter text-white uppercase italic leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            Identity
          </h2>

          <div className="space-y-6">
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.8em]">Neural Status: Aligned</p>

            <div className="inline-flex items-center gap-3 px-5 py-2 bg-black border border-white/20 rounded-full shadow-2xl">
              <Flame size={16} className="text-orange-500" fill="currentColor" />
              <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{stats.streak} Day Streak Active</span>
            </div>

            <div className="pt-4 border-t border-white/5 max-w-[240px] mx-auto">
              <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">Protocol Purpose</p>
              <p className="text-white text-[10px] font-bold italic">Identity verification through cognitive consistency and digital sovereignty.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Velocity Chart */}
      <section className="space-y-8 pt-4">
        <div className="flex items-center justify-between px-4">
          <div className="space-y-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.8em] text-zinc-600">Sync Velocity</h3>
            <p className="text-[8px] font-black text-zinc-800 uppercase tracking-widest">Used for tracking focus momentum</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 text-[#4ade80] text-[11px] font-black uppercase tracking-widest justify-end">
              <TrendingUp size={16} /> +12% Efficiency
            </div>
            <p className="text-[8px] font-black text-zinc-800 uppercase tracking-widest">Reason: Consistent engagement</p>
          </div>
        </div>
        <div className="opal-card p-8 rounded-[56px] bg-zinc-950/60 h-64 border-white/5 overflow-hidden shadow-2xl relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#52525b', fontSize: 11, fontWeight: 900, letterSpacing: '0.1em' }}
                dy={15}
              />
              <YAxis hide domain={[0, 'auto']} />
              <RechartsTooltip
                cursor={{ stroke: 'rgba(216, 180, 254, 0.2)', strokeWidth: 2 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-black/95 border border-white/10 p-4 rounded-3xl shadow-2xl backdrop-blur-2xl">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{payload[0].payload.name}</p>
                        <p className="text-lg font-black text-white italic tracking-tight">{payload[0].value}m Reclaimed</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--accent-purple)"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorValue)"
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Diagnostic Profile Section */}
      {stats.assessment && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Diagnostic Profile</h3>
            <div className="text-[var(--accent-purple)] text-[9px] font-bold uppercase tracking-widest">
              Score: {stats.assessment.score}
            </div>
          </div>
          <div className="opal-card p-8 rounded-[48px] bg-zinc-950/40 border-white/5 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="w-48 h-48 shrink-0 relative bg-black/20 rounded-full p-2 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.assessment.breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={8}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {stats.assessment.breakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#d8b4fe' : index === 1 ? '#93c5fd' : '#4ade80'}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black/90 border border-white/10 p-2 rounded-xl shadow-2xl backdrop-blur-xl">
                              <p className="text-[10px] font-black text-white uppercase tracking-widest">
                                {payload[0].name}: {payload[0].value}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-white italic">{stats.assessment.score}</span>
                  <span className="text-[8px] font-black text-zinc-600 uppercase">Index</span>
                </div>
              </div>
              <div className="flex-1 space-y-4 text-center sm:text-left">
                <div>
                  <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
                    {stats.assessment.category}
                  </h4>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-2">
                    Cognitive Archetype Identified
                  </p>
                </div>
                <div className="space-y-2">
                  {stats.assessment.breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-center sm:justify-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: i === 0 ? '#d8b4fe' : i === 1 ? '#93c5fd' : '#3f3f46' }}
                      ></div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{item.name}</span>
                      <span className="text-[10px] font-black text-white ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Duolingo-style Streak Calendar */}
      <section className="space-y-6 relative">
        <div className="flex flex-col items-center justify-center pt-8 pb-4">
          <div className="relative flex items-center justify-center">
            <Flame size={100} className="text-orange-500 drop-shadow-[0_0_40px_rgba(249,115,22,0.4)]" fill="currentColor" />
            <div className="absolute inset-0 flex items-center justify-center pt-6">
              <span className="text-white font-black text-3xl">{stats.streak}</span>
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2 tracking-tight">Day Streak!</h3>
          <p className="text-zinc-400 font-bold mt-1">Complete a session every day to keep it lit!</p>
        </div>

        <div className="bg-zinc-900/80 border-2 border-zinc-800 p-6 sm:p-8 rounded-[2.5rem] space-y-8 relative shadow-xl">
          {/* Interactive Calendar Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <button onClick={() => changeMonth(-1)} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-2xl transition-all active:scale-95"><ChevronLeft size={24} /></button>
              <div className="text-center">
                <h4 className="text-xl font-bold text-white">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Flame size={12} className="text-orange-500" fill="currentColor" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">{stats.streak} Day Streak</span>
                </div>
              </div>
              <button onClick={() => changeMonth(1)} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-2xl transition-all active:scale-95"><ChevronRight size={24} /></button>
            </div>

            <div className="grid grid-cols-7 gap-y-6 gap-x-2 sm:gap-x-4" role="grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-sm font-bold text-zinc-500" aria-hidden="true">{day}</div>
              ))}

              {calendarDays.map((day, i) => {
                if (!day) return <div key={i} className="aspect-square"></div>;

                const isActive = day.achieved;
                const isFuture = new Date(day.date) > new Date();
                const isToday = day.date === `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;

                // Check if previous and next days are also achieved for streak connection
                const prevDay = calendarDays[i - 1];
                const nextDay = calendarDays[i + 1];
                const hasLeftConnection = isActive && prevDay && prevDay.achieved;
                const hasRightConnection = isActive && nextDay && nextDay.achieved;

                return (
                  <div key={i} className="relative aspect-square flex items-center justify-center group/cell">
                    {/* Streak Connection Lines */}
                    {hasLeftConnection && (
                      <div className="absolute left-0 right-1/2 h-2 bg-orange-500/40 z-0 top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(249,115,22,0.2)]"></div>
                    )}
                    {hasRightConnection && (
                      <div className="absolute left-1/2 right-0 h-2 bg-orange-500/40 z-0 top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(249,115,22,0.2)]"></div>
                    )}

                    <button
                      disabled={isFuture}
                      onClick={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-10
                          ${isToday ? 'ring-4 ring-orange-500/30 ring-offset-4 ring-offset-zinc-900' : ''}
                          ${isFuture ? 'opacity-40 pointer-events-none' : ''}
                          ${selectedDay?.date === day.date ? 'scale-110 z-50' : ''}
                          ${isActive
                          ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(194,65,12)] hover:bg-orange-400 hover:shadow-[0_4px_0_rgb(194,65,12),0_0_15px_rgba(249,115,22,0.5)]'
                          : (isFuture
                            ? 'bg-transparent text-zinc-600'
                            : 'bg-zinc-800 text-zinc-400 shadow-[0_4px_0_rgb(39,39,42)] hover:bg-zinc-700')}
                        `}
                    >
                      {isActive ? (
                        <Flame size={20} className="sm:w-6 sm:h-6" fill="currentColor" />
                      ) : (
                        <span className="text-sm sm:text-base font-bold">
                          {new Date(day.date).getDate()}
                        </span>
                      )}

                      {!isFuture && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-zinc-800 border-2 border-zinc-700 px-4 py-2 rounded-2xl opacity-0 group-hover/cell:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl scale-90 group-hover/cell:scale-100 translate-y-2 group-hover/cell:translate-y-0">
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            {isActive ? <Flame size={16} className="text-orange-500" fill="currentColor" /> : <ZapOff size={16} className="text-zinc-500" />}
                            {day.timeSaved}m saved
                          </div>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-800 rotate-45 border-r-2 border-b-2 border-zinc-700"></div>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedDay && (
            <div className="p-6 sm:p-8 bg-zinc-800/80 rounded-3xl border-2 border-zinc-700 animate-in zoom-in-95 duration-300 relative overflow-hidden shadow-2xl mt-6">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-white">Daily Summary</h4>
                    <p className="text-sm font-bold text-zinc-400 mt-1">{new Date(selectedDay.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <button onClick={() => setSelectedDay(null)} className="p-2 bg-zinc-700/50 hover:bg-zinc-700 rounded-full text-zinc-300 hover:text-white transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-900/50 rounded-2xl border-2 border-zinc-800 space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Status</p>
                    <div className={`text-lg font-black ${selectedDay.achieved ? 'text-orange-500' : 'text-zinc-400'}`}>
                      {selectedDay.achieved ? 'Streak Kept!' : 'Missed'}
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-900/50 rounded-2xl border-2 border-zinc-800 space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Time Saved</p>
                    <div className="text-lg font-black text-white">
                      {selectedDay.timeSaved} mins
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trophy Section */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700 px-6">Achievement Matrix</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="opal-card p-8 rounded-[48px] border-white/5 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-[var(--accent-purple)] shadow-inner">
              <Trophy size={32} />
            </div>
            <div>
              <div className="text-xl font-black text-white italic tracking-tighter">Consistency</div>
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">{Math.floor(statsBreakdown.consistency)}% Compliance</div>
            </div>
          </div>
          <div className="opal-card p-8 rounded-[48px] border-white/5 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-emerald-400 shadow-inner">
              <Award size={32} />
            </div>
            <div>
              <div className="text-xl font-black text-white italic tracking-tighter">Total Syncs</div>
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">{statsBreakdown.totalWins} Sessions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Optimizer Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-5 px-6">
          <BrainCircuit size={28} className="text-[var(--accent-purple)]" />
          <h3 className="text-[16px] font-black uppercase tracking-[0.8em] text-white italic">Optimizer</h3>
        </div>
        <div className="opal-card p-12 rounded-[64px] border-white/10 bg-gradient-to-br from-zinc-950/60 to-transparent space-y-12 shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center py-16 gap-10 text-center">
              <Loader2 className="animate-spin text-zinc-800" size={64} />
              <p className="text-[9px] font-black uppercase tracking-[0.8em] text-zinc-600 animate-pulse italic">Scanning Cognitive Path...</p>
            </div>
          ) : (
            <div className="space-y-12">
              {insights.map((insight, i) => (
                <div key={i} className="flex gap-10 group">
                  <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-purple)] shrink-0 transition-all group-hover:bg-[var(--accent-purple)] group-hover:text-black shadow-lg">
                    <Sparkles size={28} />
                  </div>
                  <div className="space-y-3 py-1 flex-1">
                    <p className="text-zinc-300 text-base font-bold italic leading-relaxed group-hover:text-white transition-colors duration-500">"{insight}"</p>
                    <div className="w-0 group-hover:w-full h-[1px] bg-gradient-to-r from-[var(--accent-purple)] to-transparent transition-all duration-1000"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
