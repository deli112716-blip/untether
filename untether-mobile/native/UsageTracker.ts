import { NativeModules, Platform } from 'react-native';

/**
 * UsageTracker Bridge
 * This module connects to the native Android UsageStatsManager.
 * In a Managed Expo project, this requires a Config Plugin or a custom Dev Client.
 */
const { UsageTrackerModule } = NativeModules;

export interface AppUsage {
    packageName: string;
    totalTimeInForeground: number; // minutes
    lastTimeUsed: number;
}

export const getUsageStats = async (): Promise<AppUsage[]> => {
    if (Platform.OS !== 'android') {
        console.warn('Background tracking is currently only supported on Android.');
        return [];
    }

    try {
        // In a prototype environment where the native module might not be linked yet,
        // we return a fallback or try the bridge.
        if (!UsageTrackerModule) {
            console.log('[UsageTracker] Native module not found. Using fallback data.');
            return [
                { packageName: 'com.instagram.android', totalTimeInForeground: 45, lastTimeUsed: Date.now() },
                { packageName: 'com.zhiliaoapp.musically', totalTimeInForeground: 120, lastTimeUsed: Date.now() },
            ];
        }
        return await UsageTrackerModule.getDailyUsage();
    } catch (error) {
        console.error('[UsageTracker] Failed to fetch usage stats:', error);
        return [];
    }
};

export const requestUsagePermission = () => {
    if (Platform.OS === 'android') {
        UsageTrackerModule?.requestPermission();
    }
};
