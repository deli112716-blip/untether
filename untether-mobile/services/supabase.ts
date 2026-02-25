import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ancgwygejlbjofsarzoy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuY2d3eWdlamxiam9mc2Fyem95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzMzNTIsImV4cCI6MjA4Njc0OTM1Mn0.MBrV89X5has5d_uHLCW7k9iLrtsMMVmjRyqD9AQejSw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
