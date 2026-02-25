import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { MapPin, Plus, ArrowRight, Shield } from 'lucide-react-native';

export default function GeoScreen() {
    const [zones] = useState([
        { id: '1', name: 'Sanctuary', radius: 100, active: true },
        { id: '2', name: 'Workshop', radius: 50, active: false },
    ]);

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView className="flex-1 px-4 pt-6">

                <View className="items-center py-6 space-y-2">
                    <View className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-[24px] items-center justify-center">
                        <MapPin size={32} color="#f43f5e" />
                    </View>
                    <Text className="text-3xl font-black text-white uppercase italic tracking-tighter">Jurisdictions</Text>
                    <Text className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Geo-Fence Protocols</Text>
                </View>

                <View className="mt-8 space-y-4">
                    {zones.map(zone => (
                        <Pressable key={zone.id} className={`p-8 rounded-[40px] border flex-row items-center justify-between ${zone.active ? 'bg-rose-500/10 border-rose-500/30' : 'bg-zinc-900/40 border-white/5'}`}>
                            <View className="flex-row items-center gap-x-6">
                                <View className={`w-12 h-12 rounded-2xl items-center justify-center ${zone.active ? 'bg-rose-500' : 'bg-zinc-800'}`}>
                                    <Shield size={22} color={zone.active ? 'white' : '#666'} />
                                </View>
                                <View>
                                    <Text className="text-xl font-black text-white uppercase italic tracking-tighter">{zone.name}</Text>
                                    <Text className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{zone.radius}m Radius</Text>
                                </View>
                            </View>
                            <ArrowRight size={20} color={zone.active ? '#f43f5e' : '#3F3F46'} />
                        </Pressable>
                    ))}

                    <Pressable className="p-8 bg-zinc-900 border border-dashed border-white/10 rounded-[40px] items-center justify-center flex-row gap-x-3">
                        <Plus size={20} color="#666" />
                        <Text className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Establish New Zone</Text>
                    </Pressable>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
