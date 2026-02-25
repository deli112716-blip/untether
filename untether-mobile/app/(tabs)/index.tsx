import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { supabase } from '../../services/supabase';
import {
  Flame,
  Smartphone,
  Activity,
  BrainCircuit,
  PenTool,
  LayoutDashboard,
  Timer,
  ArrowRight,
  Link2Off,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    streak: 0,
    screenTime: 0,
    todayUsage: 0,
    streakHistory: [],
    journal: []
  });

  useEffect(() => {
    const fetchSessionAndStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          if (profileData.stats) setStats(profileData.stats);
        }
      }
    };
    fetchSessionAndStats();
  }, []);

  const formatTime = (mins: number) => {
    const totalMins = Math.round(mins);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View className="flex-row items-center justify-between py-2">
          <View className="flex-row items-center gap-x-3">
            <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
              <Link2Off size={22} color="black" strokeWidth={2.5} />
            </View>
            <Text className="text-2xl font-black tracking-tighter text-white">
              UnTether
            </Text>
          </View>

          <View className="flex-row items-center gap-x-2 px-4 py-2 bg-accent-purple/20 border border-accent-purple/30 rounded-full">
            <Flame size={14} color="#d8b4fe" />
            <Text className="text-[10px] font-black text-white uppercase tracking-widest">
              {stats.streak} DAY STREAK
            </Text>
          </View>
        </View>

        {/* Welcome */}
        <View className="items-center gap-y-2 py-4">
          <Text className="text-3xl font-black text-white italic tracking-tight">
            Welcome, {profile?.full_name?.split(' ')[0] || 'User'}
          </Text>
          <View className="w-40 h-[1px] bg-white/20" />
        </View>

        {/* Hero Metric */}
        <View className="items-center py-6">
          <Text className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2">Total Time Saved</Text>
          <Text className="text-[80px] font-black text-white tracking-tighter leading-none">
            {formatTime(stats.totalTimeSaved || 0)}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-x-4">
          <View className="flex-1 p-6 bg-zinc-900/50 border border-white/5 rounded-[32px] gap-y-2">
            <View className="flex-row items-center gap-x-2">
              <Smartphone size={16} color="#9BA1A6" />
              <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Usage</Text>
            </View>
            <Text className="text-2xl font-black text-white">{formatTime(stats.screenTime || 0)}</Text>
          </View>

          <View className="flex-1 p-6 bg-zinc-900/50 border border-white/5 rounded-[32px] gap-y-2">
            <View className="flex-row items-center gap-x-2">
              <Activity size={16} color="#9BA1A6" />
              <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Today</Text>
            </View>
            <Text className="text-2xl font-black text-white">{formatTime(stats.todayUsage || 0)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row justify-between pt-6">
          <Pressable className="items-center gap-y-2">
            <View className="w-14 h-14 bg-zinc-900 border border-white/10 rounded-2xl items-center justify-center">
              <BrainCircuit size={20} color="white" />
            </View>
            <Text className="text-[8px] font-black uppercase text-accent-purple tracking-widest">Diagnostic</Text>
          </Pressable>

          <Pressable className="items-center gap-y-2">
            <View className="w-14 h-14 bg-zinc-900 border border-white/10 rounded-2xl items-center justify-center">
              <PenTool size={20} color="white" />
            </View>
            <Text className="text-[8px] font-black uppercase text-accent-emerald tracking-widest">Log Urge</Text>
          </Pressable>

          <Pressable className="items-center gap-y-2">
            <View className="w-14 h-14 bg-zinc-900 border border-white/10 rounded-2xl items-center justify-center">
              <LayoutDashboard size={20} color="white" />
            </View>
            <Text className="text-[8px] font-black uppercase text-accent-blue tracking-widest">Recap</Text>
          </Pressable>
        </View>

        {/* Start Focus Button */}
        <Pressable className="mt-8 p-8 bg-zinc-900/40 border border-white/5 rounded-[44px] flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-6">
            <View className="w-16 h-16 bg-accent-purple rounded-[24px] items-center justify-center shadow-lg">
              <Timer size={32} color="black" strokeWidth={2.5} />
            </View>
            <View>
              <Text className="text-2xl font-black text-white uppercase italic tracking-tighter">Start Focus</Text>
              <Text className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">Silence Protocol</Text>
            </View>
          </View>
          <ArrowRight size={24} color="#3F3F46" />
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}
