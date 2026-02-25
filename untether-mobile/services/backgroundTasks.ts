import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getUsageStats } from '../native/UsageTracker';
import { supabase } from './supabase';

const USAGE_SYNC_TASK = 'USAGE_SYNC_TASK';

// Define the background task
TaskManager.defineTask(USAGE_SYNC_TASK, async () => {
    try {
        const now = new Date();
        console.log(`[BackgroundFetch] Syncing usage at ${now.toISOString()}`);

        // 1. Get native usage stats
        const stats = await getUsageStats();

        // 2. Identify the user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return BackgroundFetch.BackgroundFetchResult.NoData;

        // 3. Fetch current profiles stats
        const { data: profile } = await supabase
            .from('profiles')
            .select('stats')
            .eq('id', user.id)
            .single();

        if (!profile) return BackgroundFetch.BackgroundFetchResult.Failed;

        const currentStats = profile.stats || {};
        const totalUsageToday = stats.reduce((acc, app) => acc + app.totalTimeInForeground, 0);

        // 4. Update the stats
        // We update the todayUsage and potential streak history
        const updatedStats = {
            ...currentStats,
            todayUsage: totalUsageToday,
            lastSync: now.toISOString(),
        };

        const { error } = await supabase
            .from('profiles')
            .update({ stats: updatedStats })
            .eq('id', user.id);

        if (error) throw error;

        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        console.error('[BackgroundSync] Task failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

// Register the task
export async function registerBackgroundSync() {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(USAGE_SYNC_TASK);
        if (!isRegistered) {
            await BackgroundFetch.registerTaskAsync(USAGE_SYNC_TASK, {
                minimumInterval: 15 * 60, // 15 minutes
                stopOnTerminate: false, // Continue after app is closed
                startOnBoot: true, // Continue after reboot
            });
            console.log('[BackgroundSync] Task registered successfully');
        }
    } catch (err) {
        console.error('[BackgroundSync] Registration failed:', err);
    }
}
