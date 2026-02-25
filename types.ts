
export interface AppUsage {
  name: string;
  time: number; // in minutes
  scrollCount?: number;
  color: string;
}

export interface ReflectionEntry {
  id: string;
  date: string;
  question: string;
  answer: string;
  reason?: string;
}

export interface AssessmentData {
  score: number;
  category: string;
  breakdown: { name: string; value: number }[];
  lastTaken: string;
}

export interface WarningConfig {
  intensity: number; // 0-100
  color: string;
  layout: 'minimal' | 'immersive' | 'aggressive';
  textScale: number; // 1-2
}

export interface StreakDay {
  date: string;
  achieved: boolean;
  timeSaved: number;
}

export interface DailyLog {
  date: string;
  screenTimeMinutes: number;
  timeSavedMinutes: number;
  idleTimeMinutes?: number;
  benefits: string[];
  focusSessions: number;
}

export interface UserStats {
  streak: number;
  totalTimeSaved: number; // Minutes not spent on phone
  screenTime: number; // Actual minutes spent on phone today
  dailyLimit: number; // Target limit (e.g. 120 mins)
  todayUsage: number;
  todayFocusSessions: number;
  idleTime?: number;
  totalSessions?: number;
  lastFocusDate: string;
  lastSummaryDate?: string;
  streakHistory: StreakDay[];
  dailyLogs: DailyLog[];
  journal?: ReflectionEntry[];
  warningConfig?: WarningConfig;
  assessment?: AssessmentData;
  aiPersona?: string;
  dailyInsights?: string[];
  optimizers?: string[];
}

export interface Badge {
  id: string;
  name: string;
  requirement: number;
  icon: string;
  color: string;
  description: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  password?: string;
  created_at: string;
}

export type View = 'dashboard' | 'focus' | 'stats' | 'geo' | 'settings' | 'assessment' | 'journal';

export type AppTheme = 'blue' | 'purple' | 'green' | 'pink' | 'amber';

export interface BlockableApp {
  id: string;
  name: string;
  category: string;
  blocked: boolean;
  iconColor: string;
}

export interface Zone {
  id: string;
  name: string;
  address: string;
  radius: number;
  active: boolean;
}
