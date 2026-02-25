
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ancgwygejlbjofsarzoy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuY2d3eWdlamxiam9mc2Fyem95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzMzNTIsImV4cCI6MjA4Njc0OTM1Mn0.MBrV89X5has5d_uHLCW7k9iLrtsMMVmjRyqD9AQejSw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// EOD Sync helpers
export const syncUserData = async (userId: string, stats: any) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ stats })
            .eq('id', userId);
        if (error) throw error;
        console.log('[Untether] Background sync to cloud successful');
        return true;
    } catch (err) {
        console.error('[Untether] Background sync failed:', err);
        return false;
    }
};

export const fetchUserStats = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('stats')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data?.stats || null;
    } catch (err) {
        console.error('[Untether] Fetch stats failed:', err);
        return null;
    }
};
