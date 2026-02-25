import React from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable, Switch } from 'react-native';
import {
    Settings as SettingsIcon,
    Bell,
    ShieldCheck,
    Download,
    LogOut,
    UserCircle
} from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Redirect logic would go here
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView className="flex-1 px-4 pt-6">

                <View className="flex-row items-center gap-x-4 py-8 px-2">
                    <View className="w-16 h-16 bg-accent-purple rounded-full items-center justify-center">
                        <UserCircle size={40} color="black" />
                    </View>
                    <View>
                        <Text className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Admin Profile</Text>
                        <Text className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">Cognitive Custodian</Text>
                    </View>
                </View>

                <View className="mt-4 space-y-10">

                    {/* Preferences */}
                    <View className="space-y-4">
                        <Text className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700 px-2">Preferences</Text>
                        <View className="bg-zinc-900/40 border border-white/5 rounded-[40px] overflow-hidden">
                            <View className="p-6 flex-row items-center justify-between border-b border-white/5">
                                <View className="flex-row items-center gap-x-4">
                                    <Bell size={20} color="#9BA1A6" />
                                    <Text className="text-white font-bold">Neural Alerts</Text>
                                </View>
                                <Switch trackColor={{ false: '#27272a', true: '#d8b4fe' }} />
                            </View>
                            <View className="p-6 flex-row items-center justify-between">
                                <View className="flex-row items-center gap-x-4">
                                    <ShieldCheck size={20} color="#9BA1A6" />
                                    <Text className="text-white font-bold">Strict Protocol</Text>
                                </View>
                                <Switch trackColor={{ false: '#27272a', true: '#d8b4fe' }} />
                            </View>
                        </View>
                    </View>

                    {/* System */}
                    <View className="space-y-4">
                        <Text className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700 px-2">System</Text>
                        <View className="bg-zinc-900/40 border border-white/5 rounded-[40px] overflow-hidden">
                            <Pressable className="p-6 flex-row items-center gap-x-4 border-b border-white/5">
                                <Download size={20} color="#9BA1A6" />
                                <Text className="text-white font-bold">Export Logs</Text>
                            </Pressable>
                            <Pressable onPress={handleLogout} className="p-6 flex-row items-center gap-x-4">
                                <LogOut size={20} color="#f43f5e" />
                                <Text className="text-rose-500 font-bold">Terminate Session</Text>
                            </Pressable>
                        </View>
                    </View>

                </View>

                <View className="items-center py-20">
                    <Text className="text-[8px] font-black text-zinc-800 uppercase tracking-[0.8em]">v1.0.0-alpha NATIVE</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
