
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { FocusMode } from './components/FocusMode';
import { UsageStats } from './components/UsageStats';
import { GeoFence } from './components/GeoFence';
import { Settings } from './components/Settings';
import { Assessment } from './components/Assessment';
import { DailySummary } from './components/DailySummary';
import { Auth } from './components/Auth';
import { PermissionGuard } from './components/PermissionGuard';
import { View, UserStats, AppTheme, BlockableApp, Zone, ReflectionEntry, WarningConfig, AssessmentData, StreakDay, DailyLog } from './types';
import { Onboarding } from './components/Onboarding';
import { supabase, syncUserData } from './services/supabase';
import { useRealTimeTracking } from './hooks/useRealTimeTracking';

// Define AIStudio interface to match environmental expectations and fix type mismatch errors
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DATA_VERSION = 2;

const getFreshStats = (): UserStats => {
  return {
    streak: 0,
    totalTimeSaved: 0,
    screenTime: 0,
    dailyLimit: 180,
    streakHistory: [],
    dailyLogs: [],
    journal: [],
    warningConfig: { intensity: 75, color: '#c084fc', layout: 'immersive', textScale: 1.1 },
    todayUsage: 0,
    todayFocusSessions: 0,
    lastFocusDate: ''
  };
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('untether_onboarding_complete');
  });
  const [hasConsented, setHasConsented] = useState(() => {
    return localStorage.getItem('untether_consent') === 'true';
  });

  const handleConsent = async () => {
    // Request Geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => console.log("Geolocation permission granted"),
        () => console.warn("Geolocation permission denied")
      );
    }

    // Request Notifications
    if ("Notification" in window) {
      await Notification.requestPermission();
    }

    setHasConsented(true);
    localStorage.setItem('untether_consent', 'true');
  };

  const [blockedApps, setBlockedApps] = useState<BlockableApp[]>(() => {
    const saved = localStorage.getItem('untether_blocked_apps');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [zones, setZones] = useState<Zone[]>(() => {
    const saved = localStorage.getItem('untether_geo_zones');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [stats, setStats] = useState<UserStats>(() => {
    // Data version migration: clear old dummy data
    const version = localStorage.getItem('untether_data_version');
    if (!version || parseInt(version) < DATA_VERSION) {
      localStorage.removeItem('untether_stats');
      localStorage.removeItem('untether_blocked_apps');
      localStorage.removeItem('untether_geo_zones');
      localStorage.setItem('untether_data_version', DATA_VERSION.toString());
      return getFreshStats();
    }

    const saved = localStorage.getItem('untether_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.journal) parsed.journal = [];
        if (!parsed.dailyLogs) parsed.dailyLogs = [];
        if (!parsed.warningConfig) parsed.warningConfig = { intensity: 75, color: '#c084fc', layout: 'immersive', textScale: 1.1 };
        if (parsed.screenTime === undefined) parsed.screenTime = 0;
        if (parsed.dailyLimit === undefined) parsed.dailyLimit = 180;
        if (parsed.totalTimeSaved === undefined) parsed.totalTimeSaved = 0;
        if (parsed.todayFocusSessions === undefined) parsed.todayFocusSessions = 0;
        return parsed;
      } catch (e) {
        return getFreshStats();
      }
    }
    return getFreshStats();
  });

  const [activeZones, setActiveZones] = useState<Zone[]>([]);
  const watchIdRef = React.useRef<number | null>(null);
  const statsRef = useRef(stats);

  // Keep ref in sync for beforeunload access
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // EOD Sync function — called on Daily Summary close and page unload
  const performEODSync = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await syncUserData(user.id, statsRef.current);
      }
    } catch (err) {
      console.error('[Untether] EOD sync error:', err);
    }
  }, []);

  // Sync on page unload (safety net)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save to localStorage immediately
      localStorage.setItem('untether_stats', JSON.stringify(statsRef.current));
      // Attempt cloud sync (best effort, using sendBeacon pattern)
      const user = supabase.auth.getUser();
      // Navigator.sendBeacon isn't ideal for Supabase, so we do a sync fire-and-forget
      performEODSync();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [performEODSync]);

  // Real-time Geo-fencing with watchPosition
  useEffect(() => {
    if (!isLoggedIn || isInitializing || zones.length === 0 || !hasConsented) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) return;

    const handleLocationUpdate = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      const currentlyIn = zones.filter(zone => {
        if (!zone.active) return false;

        const [zLat, zLng] = zone.address.split(',').map(Number);
        if (isNaN(zLat) || isNaN(zLng)) return false;

        const R = 6371e3; // Earth radius in meters
        const φ1 = latitude * Math.PI / 180;
        const φ2 = zLat * Math.PI / 180;
        const Δφ = (zLat - latitude) * Math.PI / 180;
        const Δλ = (zLng - longitude) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance <= zone.radius;
      });

      // Notification Logic
      const hasNotificationSupport = typeof Notification !== 'undefined';
      if (currentlyIn.length > activeZones.length) {
        const newZone = currentlyIn.find(z => !activeZones.find(az => az.id === z.id));
        if (newZone && hasNotificationSupport && Notification.permission === 'granted') {
          try {
            new Notification("UnTether: Perimeter Secured", {
              body: `Entered ${newZone.name}. Suppression matrix active.`,
            });
          } catch (e) {
            console.warn("Notification failed:", e);
          }
        }
      } else if (currentlyIn.length < activeZones.length) {
        const leftZone = activeZones.find(z => !currentlyIn.find(cz => cz.id === z.id));
        if (leftZone && hasNotificationSupport && Notification.permission === 'granted') {
          try {
            new Notification("UnTether: Perimeter Exited", {
              body: `Left ${leftZone.name}. Suppression matrix standby.`,
            });
          } catch (e) {
            console.warn("Notification failed:", e);
          }
        }
      }

      setActiveZones(currentlyIn);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Location tracking failed:", error);
      if (error.code === error.PERMISSION_DENIED) {
        setActiveZones([]);
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isLoggedIn, isInitializing, zones, activeZones, hasConsented]);

  const { trackingData, consumeTracking } = useRealTimeTracking(
    isLoggedIn,
    isInitializing,
    hasConsented,
    isFocusActive
  );

  // Merge real-time tracking data into main stats
  useEffect(() => {
    if (trackingData.activeMinutes > 0 || trackingData.idleMinutes > 0 || trackingData.totalSessions > 0) {
      setStats(prev => {
        const todayStr = getLocalDateString();
        const newHistory = [...prev.streakHistory];
        const todayIdx = newHistory.findIndex(d => d.date === todayStr);

        if (todayIdx === -1) {
          newHistory.push({ date: todayStr, achieved: false, timeSaved: 0 });
        }

        const newScreenTime = Number((prev.screenTime + trackingData.activeMinutes).toFixed(4));

        return {
          ...prev,
          screenTime: newScreenTime,
          todayUsage: newScreenTime,
          idleTime: (prev.idleTime || 0) + trackingData.idleMinutes,
          totalSessions: (prev.totalSessions || 0) + trackingData.totalSessions,
          streakHistory: newHistory.slice(-60)
        };
      });
      consumeTracking();
    }
  }, [trackingData, consumeTracking]);

  // Optimized Batched Supabase Sync (60s) for Free Tier Limit Management
  const lastSyncRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isLoggedIn || isInitializing || !hasConsented) return;

    const syncInterval = setInterval(() => {
      if (Date.now() - lastSyncRef.current >= 60000) {
        performEODSync();
        lastSyncRef.current = Date.now();
      }
    }, 60000);

    return () => clearInterval(syncInterval);
  }, [isLoggedIn, isInitializing, hasConsented, performEODSync]);

  // Handle API Key check
  useEffect(() => {
    const initKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          console.info("Application detected no personal key. Functionality may be limited by shared quota.");
        }
      }
    };
    initKey();
  }, []);

  // Check for daily summary on boot and ensure history consistency
  useEffect(() => {
    if (!isInitializing && isLoggedIn) {
      const today = getLocalDateString();
      if (stats.lastSummaryDate !== today) {
        setShowSummary(true);
        setStats(prev => ({ ...prev, lastSummaryDate: today }));
      }

      // Ensure history consistency
      setStats(prev => {
        const newHistory = [...prev.streakHistory];
        let changed = false;
        const todayObj = new Date();

        for (let i = 0; i < prev.streak; i++) {
          const d = new Date(todayObj);
          d.setDate(d.getDate() - i);
          const dStr = getLocalDateString(d);
          const idx = newHistory.findIndex(h => h.date === dStr);
          if (idx === -1) {
            newHistory.push({ date: dStr, achieved: true, timeSaved: 0 });
            changed = true;
          } else if (!newHistory[idx].achieved) {
            newHistory[idx].achieved = true;
            changed = true;
          }
        }

        if (changed) {
          return {
            ...prev,
            streakHistory: newHistory.sort((a, b) => a.date.localeCompare(b.date)).slice(-60)
          };
        }
        return prev;
      });
    }
  }, [isInitializing, isLoggedIn]);

  // INITIAL SYNC FROM CLOUD
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsLoggedIn(true);
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (data && data.stats) {
            setStats(data.stats);
          }
        }
      } catch (e) {
        console.error("Session check failed", e);
      } finally {
        setIsInitializing(false);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const getTheme = (streak: number): AppTheme => {
    if (streak >= 30) return 'pink';
    if (streak >= 14) return 'green';
    if (streak >= 7) return 'purple';
    return 'blue';
  };

  const currentTheme = getTheme(stats.streak);

  // LOCAL PERSISTENCE ONLY (cloud sync happens at EOD)
  useEffect(() => {
    localStorage.setItem('untether_stats', JSON.stringify(stats));
    localStorage.setItem('untether_blocked_apps', JSON.stringify(blockedApps));
    localStorage.setItem('untether_geo_zones', JSON.stringify(zones));
    document.body.className = `theme-${currentTheme}`;
  }, [stats, currentTheme, blockedApps, zones]);

  const handleAssessmentComplete = (data: AssessmentData) => {
    setStats(prev => ({ ...prev, assessment: data }));
    setCurrentView('stats');
  };

  const handleSessionComplete = (minutes: number, journalEntry?: { question: string, answer: string }) => {
    const today = new Date();
    const todayStr = getLocalDateString(today);

    setStats(prev => {
      let newStreak = prev.streak;
      if (prev.lastFocusDate !== todayStr) {
        newStreak += 1;
      }

      const newHistory = [...prev.streakHistory];
      const todayIdx = newHistory.findIndex(d => d.date === todayStr);
      if (todayIdx > -1) {
        newHistory[todayIdx] = {
          ...newHistory[todayIdx],
          achieved: true,
          timeSaved: newHistory[todayIdx].timeSaved + minutes
        };
      } else {
        newHistory.push({ date: todayStr, achieved: true, timeSaved: minutes });
      }

      // Ensure streak is reflected in history for previous days if missing
      const finalHistory = [...newHistory];
      for (let i = 0; i < newStreak; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = getLocalDateString(d);
        const idx = finalHistory.findIndex(h => h.date === dStr);
        if (idx === -1) {
          finalHistory.push({ date: dStr, achieved: true, timeSaved: 0 });
        } else if (!finalHistory[idx].achieved) {
          finalHistory[idx].achieved = true;
        }
      }

      const newJournal = journalEntry ? [
        { id: Date.now().toString(), date: today.toISOString(), ...journalEntry },
        ...(prev.journal || [])
      ] : (prev.journal || []);

      return {
        ...prev,
        streak: newStreak,
        totalTimeSaved: prev.totalTimeSaved + minutes,
        todayFocusSessions: (prev.todayFocusSessions || 0) + 1,
        lastFocusDate: todayStr,
        streakHistory: finalHistory.sort((a, b) => a.date.localeCompare(b.date)).slice(-60),
        journal: newJournal.slice(0, 50)
      };
    });
  };

  // Build daily log and sync at EOD when Daily Summary is closed
  const handleEODSync = useCallback(async () => {
    const todayStr = getLocalDateString();
    const todayHistory = statsRef.current.streakHistory.find(d => d.date === todayStr);

    const dailyLog: DailyLog = {
      date: todayStr,
      screenTimeMinutes: Math.round(statsRef.current.screenTime),
      timeSavedMinutes: todayHistory?.timeSaved || 0,
      benefits: [
        `Reduced screen time by ${Math.round(statsRef.current.dailyLimit - statsRef.current.screenTime)}m vs limit`,
        `Completed ${statsRef.current.todayFocusSessions || 0} focus sessions`,
        statsRef.current.streak > 0 ? `${statsRef.current.streak} day streak maintained` : 'Starting your journey'
      ],
      focusSessions: statsRef.current.todayFocusSessions || 0
    };

    // Append daily log (avoid duplicates for same day)
    setStats(prev => {
      const existingIdx = prev.dailyLogs.findIndex(l => l.date === todayStr);
      const newLogs = [...prev.dailyLogs];
      if (existingIdx > -1) {
        newLogs[existingIdx] = dailyLog;
      } else {
        newLogs.push(dailyLog);
      }
      return { ...prev, dailyLogs: newLogs.slice(-90) }; // Keep last 90 days
    });

    // Sync to cloud
    await performEODSync();
  }, [performEODSync]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 9-5 5a5 5 0 0 0 7 7l5-5" /><path d="m15 15 5-5a5 5 0 0 0-7-7l-5 5" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.6em] text-zinc-800">Booting Protocol</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Auth onLogin={() => setIsLoggedIn(true)} />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  if (!hasConsented) {
    return (
      <PermissionGuard
        onGranted={() => {
          setHasConsented(true);
          localStorage.setItem('untether_consent', 'true');
        }}
      />
    );
  }

  return (
    <Layout currentView={currentView} setView={setCurrentView} streak={stats.streak}>
      <main className={`pb-32 px-4 max-w-lg mx-auto overflow-x-hidden ${currentView === 'dashboard' ? 'pt-6' : 'pt-12'}`}>
        {showSummary && <DailySummary stats={stats} onClose={() => setShowSummary(false)} onEODSync={handleEODSync} />}

        {currentView === 'assessment' && (
          <Assessment onComplete={handleAssessmentComplete} onClose={() => setCurrentView('dashboard')} />
        )}
        {currentView === 'dashboard' && (
          <Dashboard
            setView={setCurrentView}
            stats={stats}
            blockedApps={blockedApps}
            activeZones={activeZones}
            toggleApp={(id) => setBlockedApps(apps => apps.map(a => a.id === id ? { ...a, blocked: !a.blocked } : a))}
          />
        )}
        {currentView === 'focus' && (
          <FocusMode
            isActive={isFocusActive}
            onToggle={() => setIsFocusActive(!isFocusActive)}
            onComplete={handleSessionComplete}
            warningConfig={stats.warningConfig!}
            streak={stats.streak}
            apps={blockedApps}
            toggleApp={(id) => setBlockedApps(apps => apps.map(a => a.id === id ? { ...a, blocked: !a.blocked } : a))}
          />
        )}
        {currentView === 'stats' && (
          <UsageStats
            stats={stats}
            onUpdateStats={(updates) => setStats(prev => ({ ...prev, ...updates }))}
          />
        )}
        {currentView === 'geo' && <GeoFence zones={zones} setZones={setZones} />}
        {(currentView === 'settings' || currentView === 'journal') && (
          <Settings
            onLogout={handleLogout}
            apps={blockedApps}
            setApps={setBlockedApps}
            journal={stats.journal || []}
            onAddJournalEntry={(newEntry) => setStats(prev => ({
              ...prev,
              journal: [newEntry, ...(prev.journal || [])]
            }))}
            warningConfig={stats.warningConfig || { intensity: 75, color: '#c084fc', layout: 'immersive', textScale: 1.1 }}
            setWarningConfig={(cfg) => setStats(prev => ({ ...prev, warningConfig: cfg }))}
            onBack={() => setCurrentView('dashboard')}
            initialView={currentView === 'journal' ? 'journal' : 'main'}
          />
        )}
      </main>
    </Layout>
  );
};

export default App;
