import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { supabase } from '../../services/supabase';
import {
  Activity,
  Flame,
  TrendingUp,
  Trophy,
  Award,
  BrainCircuit,
  Zap,
} from 'lucide-react-native';

export default function StatsScreen() {
  const [stats, setStats] = useState<any>({
    streak: 0,
    streakHistory: [],
    assessment: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('stats')
          .eq('id', session.user.id)
          .single();
        if (data?.stats) setStats(data.stats);
      }
    };
    fetchStats();
  }, []);

  const chartData = useMemo(() => {
    const history = stats.streakHistory || [];
    const last7 = history.slice(-7);
    const result = [];
    const needed = 7 - last7.length;

    for (let i = needed; i > 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - (last7.length + i));
      result.push({ name: d.toLocaleDateString(undefined, { weekday: 'short' }), value: 0 });
    }

    const realData = last7.map((day: any) => ({
      name: new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }),
      value: day.timeSaved
    }));

    return [...result, ...realData];
  }, [stats.streakHistory]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Profile Stats Header */}
        <View className="p-8 border border-accent-blue/30 rounded-[32px] bg-zinc-900/40 items-center space-y-5">
          <View className="flex-row items-center gap-x-3 px-6 py-2 rounded-full bg-white/5 border border-white/10">
            <Activity size={14} color="#d8b4fe" />
            <Text className="text-accent-purple text-[9px] font-black uppercase tracking-[0.4em]">Analytics Protocol</Text>
          </View>

          <Text className="text-[64px] font-black tracking-tighter text-white uppercase italic leading-none">
            Identity
          </Text>

          <View className="flex-row items-center gap-x-3 px-5 py-2 bg-black border border-white/20 rounded-full">
            <Flame size={16} color="#f97316" fill="#f97316" />
            <Text className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{stats.streak} Day Streak</Text>
          </View>
        </View>

        {/* Sync Velocity - Custom Simple Chart */}
        <View className="mt-10 space-y-6">
          <View className="flex-row items-center justify-between px-2">
            <Text className="text-[11px] font-black uppercase tracking-[0.8em] text-zinc-600">Sync Velocity</Text>
            <View className="flex-row items-center gap-x-1">
              <TrendingUp size={16} color="#4ade80" />
              <Text className="text-[#4ade80] text-[11px] font-black uppercase tracking-widest">+12%</Text>
            </View>
          </View>

          <View className="h-48 bg-zinc-900/60 border border-white/5 rounded-[40px] flex-row items-end justify-between px-8 py-6">
            {chartData.map((day, i) => (
              <View key={i} className="items-center gap-y-3">
                <View
                  className="w-4 bg-accent-purple rounded-full"
                  style={{ height: `${Math.max(10, (day.value / 180) * 100)}%` as any }}
                />
                <Text className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{day.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View className="mt-10 flex-row gap-x-4">
          <View className="flex-1 p-8 bg-zinc-900/50 border border-white/5 rounded-[40px] items-center gap-y-4">
            <View className="w-14 h-14 bg-white/5 rounded-2xl items-center justify-center">
              <Trophy size={28} color="#d8b4fe" />
            </View>
            <View className="items-center">
              <Text className="text-lg font-black text-white italic tracking-tighter">Consistency</Text>
              <Text className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">92% Compliance</Text>
            </View>
          </View>

          <View className="flex-1 p-8 bg-zinc-900/50 border border-white/5 rounded-[40px] items-center gap-y-4">
            <View className="w-14 h-14 bg-white/5 rounded-2xl items-center justify-center">
              <Award size={28} color="#4ade80" />
            </View>
            <View className="items-center">
              <Text className="text-lg font-black text-white italic tracking-tighter">Total Syncs</Text>
              <Text className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">{stats.streakHistory?.length || 0} Sessions</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
