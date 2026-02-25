import { useState, useEffect, useRef, useCallback } from 'react';

interface TrackingState {
    activeMinutes: number;
    idleMinutes: number;
    totalSessions: number;
}

export const useRealTimeTracking = (
    isLoggedIn: boolean,
    isInitializing: boolean,
    hasConsented: boolean,
    isFocusActive: boolean
) => {
    const [trackingData, setTrackingData] = useState<TrackingState>({
        activeMinutes: 0,
        idleMinutes: 0,
        totalSessions: 0
    });

    const lastTickRef = useRef<number>(Date.now());
    const lastActivityRef = useRef<number>(Date.now());
    const isIdleRef = useRef<boolean>(false);
    const wasHiddenRef = useRef<boolean>(document.hidden);

    const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds

    // Handle user activity to reset idle timer
    const resetIdleTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        isIdleRef.current = false;
    }, []);

    useEffect(() => {
        if (!isLoggedIn || isInitializing || !hasConsented || isFocusActive) return;

        // Attach activity listeners
        const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
        activityEvents.forEach(event => {
            window.addEventListener(event, resetIdleTimer, { passive: true });
        });

        // Reset initial state
        lastTickRef.current = Date.now();
        lastActivityRef.current = Date.now();

        const handleVisibilityChange = () => {
            const now = Date.now();
            const deltaMs = now - lastTickRef.current;
            const deltaMins = deltaMs / 1000 / 60;

            lastTickRef.current = now;

            if (document.hidden) {
                // Just got hidden. The time up to this point was either active or idle based on refs, 
                // but for simplicity of the transition, we attribute it contextually in the tick.
                wasHiddenRef.current = true;
            } else {
                // Just became visible. The previous time was hidden (idle)
                setTrackingData(prev => ({
                    ...prev,
                    idleMinutes: prev.idleMinutes + deltaMins,
                    // If they were gone for >1min, count as a new session
                    totalSessions: deltaMins > 1 ? prev.totalSessions + 1 : prev.totalSessions
                }));
                wasHiddenRef.current = false;
                resetIdleTimer();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // 1-second precision tick interval
        const interval = setInterval(() => {
            const now = Date.now();
            const deltaMs = now - lastTickRef.current;
            const deltaMins = deltaMs / 1000 / 60;

            lastTickRef.current = now;

            // Check idle state
            if (now - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
                isIdleRef.current = true;
            }

            setTrackingData(prev => {
                let newActive = prev.activeMinutes;
                let newIdle = prev.idleMinutes;

                if (wasHiddenRef.current || isIdleRef.current) {
                    // Time spent hidden or idle
                    newIdle += deltaMins;
                } else {
                    // Time spent active and visible
                    newActive += deltaMins;
                }

                return {
                    ...prev,
                    activeMinutes: newActive,
                    idleMinutes: newIdle
                };
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetIdleTimer);
            });
        };
    }, [isLoggedIn, isInitializing, hasConsented, isFocusActive, resetIdleTimer]);

    // Provide a way to consume and reset the accumulators
    const consumeTracking = useCallback(() => {
        setTrackingData({ activeMinutes: 0, idleMinutes: 0, totalSessions: 0 });
    }, []);

    return { trackingData, consumeTracking };
};
